import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import { ProductionBatch, ProductionBatchDocument } from './schemas/production-batch.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { EventsGateway } from '../events/events.gateway';
import { CreateRecipeDto, ExecuteProductionBatchDto, UpdateRecipeDto } from './dto/recipe.dto';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(ProductionBatch.name) private readonly batchModel: Model<ProductionBatchDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(StockMovement.name) private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createRecipe(tenantIdStr: string, dto: CreateRecipeDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);

    if (!dto.ingredients || dto.ingredients.length === 0) {
      throw new BadRequestException('Recipe must require at least one ingredient');
    }

    const ingredientObjectIds = dto.ingredients.map((i) => new Types.ObjectId(i.ingredientId));
    const ingredients = await this.ingredientModel
      .find({ tenantId, _id: { $in: ingredientObjectIds } })
      .lean();

    if (ingredients.length !== ingredientObjectIds.length) {
      throw new BadRequestException('One or more recipe ingredients do not exist in tenant catalog');
    }

    let totalBatchCost = 0;
    const requirements = dto.ingredients.map((req) => {
      const ing = ingredients.find((i) => i._id.toString() === req.ingredientId)!;
      const costEstimate = Math.round(req.quantity * (ing.costPerUnit || 0) * 100) / 100;
      totalBatchCost += costEstimate;

      return {
        ingredientId: ing._id,
        ingredientName: ing.name,
        quantity: req.quantity,
        unit: req.unit || ing.baseUnit,
        costEstimate,
      };
    });

    const baseYield = Math.max(0.1, dto.baseYield || 1);
    const estimatedCostPerUnit = Math.round((totalBatchCost / baseYield) * 100) / 100;

    return this.recipeModel.create({
      tenantId,
      name: dto.name,
      category: dto.category || 'General',
      description: dto.description,
      version: dto.version || 1,
      isActive: true,
      baseYield,
      yieldUnit: dto.yieldUnit || 'bottles',
      preparationTimeMinutes: dto.preparationTimeMinutes || 30,
      ingredients: requirements,
      instructions: dto.instructions || [],
      estimatedCostPerUnit,
      suggestedRetailPrice: dto.suggestedRetailPrice || estimatedCostPerUnit * 2,
    });
  }

  async listRecipes(tenantIdStr: string, category?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: Record<string, unknown> = { tenantId, isActive: true };
    if (category) {
      filter.category = category;
    }
    return this.recipeModel.find(filter).sort({ name: 1 }).lean();
  }

  async getRecipe(tenantIdStr: string, recipeId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const recipe = await this.recipeModel
      .findOne({ _id: new Types.ObjectId(recipeId), tenantId })
      .lean();

    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }
    return recipe;
  }

  async updateRecipe(tenantIdStr: string, recipeId: string, dto: UpdateRecipeDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const recipe = await this.recipeModel.findOne({ _id: new Types.ObjectId(recipeId), tenantId });
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    if (dto.name !== undefined) recipe.name = dto.name;
    if (dto.category !== undefined) recipe.category = dto.category;
    if (dto.description !== undefined) recipe.description = dto.description;
    if (dto.isActive !== undefined) recipe.isActive = dto.isActive;
    if (dto.baseYield !== undefined) recipe.baseYield = dto.baseYield;
    if (dto.yieldUnit !== undefined) recipe.yieldUnit = dto.yieldUnit;
    if (dto.preparationTimeMinutes !== undefined) recipe.preparationTimeMinutes = dto.preparationTimeMinutes;
    if (dto.instructions !== undefined) recipe.instructions = dto.instructions;
    if (dto.suggestedRetailPrice !== undefined) recipe.suggestedRetailPrice = dto.suggestedRetailPrice;

    if (dto.ingredients !== undefined) {
      const ingredientObjectIds = dto.ingredients.map((i) => new Types.ObjectId(i.ingredientId));
      const ingredients = await this.ingredientModel
        .find({ tenantId, _id: { $in: ingredientObjectIds } })
        .lean();

      let totalCost = 0;
      recipe.ingredients = dto.ingredients.map((req) => {
        const ing = ingredients.find((i) => i._id.toString() === req.ingredientId)!;
        const costEstimate = Math.round(req.quantity * (ing?.costPerUnit || 0) * 100) / 100;
        totalCost += costEstimate;

        return {
          ingredientId: new Types.ObjectId(req.ingredientId),
          ingredientName: ing?.name,
          quantity: req.quantity,
          unit: req.unit || ing?.baseUnit || 'units',
          costEstimate,
        };
      });

      recipe.estimatedCostPerUnit = Math.round((totalCost / recipe.baseYield) * 100) / 100;
      recipe.version += 1; // Increment version on formulation change
    }

    await recipe.save();
    return recipe;
  }

  /**
   * Checks real-time stock availability for a scaled production batch
   */
  async checkBatchAvailability(tenantIdStr: string, recipeId: string, scaleFactor = 1.0) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const recipe = await this.recipeModel.findOne({ _id: new Types.ObjectId(recipeId), tenantId });
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    const scale = Math.max(0.01, scaleFactor);
    const requirements = [];
    let canProduce = true;
    const missingIngredients = [];

    for (const req of recipe.ingredients) {
      const scaledRequired = Math.round(req.quantity * scale * 100) / 100;
      const balance = await this.balanceModel.findOne({ tenantId, ingredientId: req.ingredientId });
      const currentStock = balance?.onHand ?? 0;
      const isSufficient = currentStock >= scaledRequired;

      if (!isSufficient) {
        canProduce = false;
        missingIngredients.push({
          ingredientId: req.ingredientId,
          ingredientName: req.ingredientName,
          required: scaledRequired,
          currentStock,
          shortage: Math.round((scaledRequired - currentStock) * 100) / 100,
          unit: req.unit,
        });
      }

      requirements.push({
        ingredientId: req.ingredientId,
        ingredientName: req.ingredientName,
        baseQuantity: req.quantity,
        scaledRequired,
        currentStock,
        isSufficient,
        unit: req.unit,
      });
    }

    const expectedYield = Math.round(recipe.baseYield * scale * 10) / 10;

    return {
      recipeId: recipe._id,
      recipeName: recipe.name,
      scaleFactor: scale,
      expectedYield,
      yieldUnit: recipe.yieldUnit,
      canProduce,
      missingIngredients,
      requirements,
    };
  }

  /**
   * Executes a production batch:
   * 1. Validates inventory availability.
   * 2. Atomically deducts consumed ingredients from stock.
   * 3. Records PRODUCTION and WASTAGE stock movements.
   * 4. Persists ProductionBatch record.
   * 5. Emits real-time inventory updates.
   */
  async executeProductionBatch(
    tenantIdStr: string,
    actorIdStr: string,
    recipeId: string,
    dto: ExecuteProductionBatchDto,
  ) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const recipe = await this.recipeModel.findOne({ _id: new Types.ObjectId(recipeId), tenantId });
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    const scale = Math.max(0.01, dto.scaleFactor || 1.0);
    const availability = await this.checkBatchAvailability(tenantIdStr, recipeId, scale);

    if (!availability.canProduce) {
      const shortages = availability.missingIngredients
        .map((m) => `${m.ingredientName}: need ${m.required} ${m.unit}, have ${m.currentStock}`)
        .join('; ');
      throw new BadRequestException(`Cannot brew batch due to insufficient ingredients: ${shortages}`);
    }

    let defaultLocation = await this.locationModel.findOne({ tenantId });
    if (!defaultLocation) {
      defaultLocation = await this.locationModel.create({
        tenantId,
        name: 'Main Apothecary Cauldron Room',
        type: 'PRODUCTION',
      });
    }

    const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expectedYield = Math.round(recipe.baseYield * scale * 10) / 10;
    const actualYield = dto.actualYield !== undefined ? dto.actualYield : expectedYield;

    const consumedItems = [];
    let totalBatchCost = 0;

    for (const req of recipe.ingredients) {
      const ing = await this.ingredientModel.findById(req.ingredientId);
      const unitCost = ing?.costPerUnit || 0;
      const plannedQty = Math.round(req.quantity * scale * 100) / 100;

      const wasteEntry = (dto.wastage || []).find(
        (w) => w.ingredientId === req.ingredientId.toString(),
      );
      const wastageQty = wasteEntry ? Math.max(0, wasteEntry.wastageQty) : 0;
      const totalDeducted = plannedQty + wastageQty;

      // Atomically decrement inventory balance
      const balance = await this.balanceModel.findOneAndUpdate(
        { tenantId, ingredientId: req.ingredientId },
        {
          $inc: { onHand: -totalDeducted, version: 1 },
        },
        { new: true }
      );

      // Record CONSUMPTION stock movement
      await this.movementModel.create({
        tenantId,
        ingredientId: req.ingredientId,
        locationId: defaultLocation._id,
        type: StockMovementType.CONSUMPTION,
        quantityDelta: -plannedQty,
        unit: req.unit,
        balanceAfter: (balance?.onHand ?? 0) + wastageQty,
        reason: `Brewed batch: ${batchNumber} (${recipe.name})`,
        referenceType: 'production',
      });

      // If wastage recorded, record WASTAGE stock movement
      if (wastageQty > 0) {
        await this.movementModel.create({
          tenantId,
          ingredientId: req.ingredientId,
          locationId: defaultLocation._id,
          type: StockMovementType.WASTAGE,
          quantityDelta: -wastageQty,
          unit: req.unit,
          balanceAfter: balance?.onHand ?? 0,
          reason: `Brewing spillage/waste: ${batchNumber}`,
          referenceType: 'production',
        });
      }

      const cost = Math.round(totalDeducted * unitCost * 100) / 100;
      totalBatchCost += cost;

      consumedItems.push({
        ingredientId: req.ingredientId,
        ingredientName: req.ingredientName,
        plannedQty,
        actualQty: totalDeducted,
        unit: req.unit,
        wastageQty,
        cost,
      });
    }

    const batch = await this.batchModel.create({
      tenantId,
      recipeId: recipe._id,
      batchNumber,
      status: 'completed',
      scaleFactor: scale,
      expectedYield,
      actualYield,
      yieldUnit: recipe.yieldUnit,
      totalCost: Math.round(totalBatchCost * 100) / 100,
      ingredientsConsumed: consumedItems,
      brewedBy: new Types.ObjectId(actorIdStr),
      brewedAt: new Date(),
      notes: dto.notes,
    });

    this.eventsGateway.broadcastInventoryUpdate(tenantIdStr, {
      batchNumber,
      recipeName: recipe.name,
      yield: `${actualYield} ${recipe.yieldUnit}`,
      action: 'BREWED',
    });

    return {
      message: `Successfully brewed ${actualYield} ${recipe.yieldUnit} of ${recipe.name}`,
      batch,
    };
  }

  async listBatches(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    return this.batchModel
      .find({ tenantId })
      .populate('recipeId', 'name category yieldUnit')
      .sort({ brewedAt: -1 })
      .lean();
  }
}
