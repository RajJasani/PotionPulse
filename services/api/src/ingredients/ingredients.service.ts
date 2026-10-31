import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ingredient, IngredientDocument } from './schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async create(tenantId: string, dto: CreateIngredientDto) {
    const tid = new Types.ObjectId(tenantId);

    if (dto.sku) {
      const existingSku = await this.ingredientModel.findOne({
        tenantId: tid,
        sku: dto.sku.toUpperCase(),
      });
      if (existingSku) {
        throw new ConflictException(`An ingredient with SKU '${dto.sku}' already exists in this shop`);
      }
    }

    let defaultLocId: Types.ObjectId | undefined;
    if (dto.defaultLocationId && Types.ObjectId.isValid(dto.defaultLocationId)) {
      defaultLocId = new Types.ObjectId(dto.defaultLocationId);
    } else {
      const defaultLoc = await this.locationModel.findOne({ tenantId: tid, isDefault: true });
      if (defaultLoc) defaultLocId = defaultLoc._id as Types.ObjectId;
    }

    const ingredient = await this.ingredientModel.create({
      tenantId: tid,
      name: dto.name,
      sku: dto.sku ? dto.sku.toUpperCase() : undefined,
      category: dto.category || 'General',
      baseUnit: dto.baseUnit.toLowerCase(),
      reorderPoint: dto.reorderPoint || 0,
      safetyStock: dto.safetyStock || 0,
      leadTimeDays: dto.leadTimeDays || 1,
      costPerUnit: dto.costPerUnit || 0,
      defaultLocationId: defaultLocId,
    });

    // Initialize balance record if location exists
    if (defaultLocId) {
      await this.balanceModel.create({
        tenantId: tid,
        ingredientId: ingredient._id,
        locationId: defaultLocId,
        onHand: 0,
        reserved: 0,
        version: 1,
      });
    }

    return {
      id: ingredient._id.toString(),
      name: ingredient.name,
      sku: ingredient.sku,
      category: ingredient.category,
      baseUnit: ingredient.baseUnit,
      reorderPoint: ingredient.reorderPoint,
      safetyStock: ingredient.safetyStock,
      leadTimeDays: ingredient.leadTimeDays,
      costPerUnit: ingredient.costPerUnit,
      defaultLocationId: ingredient.defaultLocationId?.toString(),
      onHand: 0,
      createdAt: ingredient.createdAt,
    };
  }

  async findAll(
    tenantId: string,
    query: {
      search?: string;
      category?: string;
      lowStockOnly?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const tid = new Types.ObjectId(tenantId);
    const filter: Record<string, unknown> = {
      tenantId: tid,
      archivedAt: null,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { sku: searchRegex }];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [ingredients, total] = await Promise.all([
      this.ingredientModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      this.ingredientModel.countDocuments(filter),
    ]);

    // Aggregate onHand across locations for each ingredient
    const ingredientIds = ingredients.map((i) => i._id);
    const balances = await this.balanceModel.aggregate([
      { $match: { tenantId: tid, ingredientId: { $in: ingredientIds } } },
      { $group: { _id: '$ingredientId', totalOnHand: { $sum: '$onHand' }, totalReserved: { $sum: '$reserved' } } },
    ]);

    const balanceMap = new Map<string, { onHand: number; reserved: number }>();
    for (const b of balances) {
      balanceMap.set(b._id.toString(), { onHand: b.totalOnHand, reserved: b.totalReserved });
    }

    const items = ingredients.map((ing) => {
      const bal = balanceMap.get(ing._id.toString()) || { onHand: 0, reserved: 0 };
      const isLowStock = bal.onHand <= (ing.reorderPoint || 0);
      return {
        id: ing._id.toString(),
        name: ing.name,
        sku: ing.sku,
        category: ing.category,
        baseUnit: ing.baseUnit,
        reorderPoint: ing.reorderPoint,
        safetyStock: ing.safetyStock,
        leadTimeDays: ing.leadTimeDays,
        costPerUnit: ing.costPerUnit,
        onHand: bal.onHand,
        reserved: bal.reserved,
        available: bal.onHand - bal.reserved,
        isLowStock,
        createdAt: ing.createdAt,
      };
    });

    const filteredItems = query.lowStockOnly ? items.filter((i) => i.isLowStock) : items;

    return {
      items: filteredItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ingredient ID format');
    }

    const tid = new Types.ObjectId(tenantId);
    const ingredient = await this.ingredientModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: tid,
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    // Get location breakdown
    const locationBalances = await this.balanceModel
      .find({ tenantId: tid, ingredientId: ingredient._id })
      .populate('locationId', 'name code type');

    const totalOnHand = locationBalances.reduce((sum, b) => sum + b.onHand, 0);
    const totalReserved = locationBalances.reduce((sum, b) => sum + b.reserved, 0);

    return {
      id: ingredient._id.toString(),
      name: ingredient.name,
      sku: ingredient.sku,
      category: ingredient.category,
      baseUnit: ingredient.baseUnit,
      reorderPoint: ingredient.reorderPoint,
      safetyStock: ingredient.safetyStock,
      leadTimeDays: ingredient.leadTimeDays,
      costPerUnit: ingredient.costPerUnit,
      onHand: totalOnHand,
      reserved: totalReserved,
      available: totalOnHand - totalReserved,
      isLowStock: totalOnHand <= ingredient.reorderPoint,
      archivedAt: ingredient.archivedAt,
      locationBalances: locationBalances.map((b) => {
        const loc = b.locationId as any;
        return {
          locationId: loc?._id?.toString(),
          locationName: loc?.name,
          locationCode: loc?.code,
          onHand: b.onHand,
          reserved: b.reserved,
        };
      }),
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateIngredientDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ingredient ID format');
    }

    const tid = new Types.ObjectId(tenantId);
    const ingredient = await this.ingredientModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: tid,
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (dto.sku && dto.sku.toUpperCase() !== ingredient.sku) {
      const conflict = await this.ingredientModel.findOne({
        tenantId: tid,
        sku: dto.sku.toUpperCase(),
        _id: { $ne: ingredient._id },
      });
      if (conflict) {
        throw new ConflictException(`SKU '${dto.sku}' is already assigned to another ingredient`);
      }
      ingredient.sku = dto.sku.toUpperCase();
    }

    if (dto.name) ingredient.name = dto.name;
    if (dto.category) ingredient.category = dto.category;
    if (dto.baseUnit) ingredient.baseUnit = dto.baseUnit.toLowerCase();
    if (dto.reorderPoint !== undefined) ingredient.reorderPoint = dto.reorderPoint;
    if (dto.safetyStock !== undefined) ingredient.safetyStock = dto.safetyStock;
    if (dto.leadTimeDays !== undefined) ingredient.leadTimeDays = dto.leadTimeDays;
    if (dto.costPerUnit !== undefined) ingredient.costPerUnit = dto.costPerUnit;

    await ingredient.save();
    return this.findOne(tenantId, id);
  }

  async archive(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ingredient ID format');
    }

    const ingredient = await this.ingredientModel.findOne({
      _id: new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    ingredient.archivedAt = new Date();
    await ingredient.save();

    return { id: ingredient._id.toString(), archivedAt: ingredient.archivedAt };
  }
}
