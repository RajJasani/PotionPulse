import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { Location, LocationDocument } from '../inventory/schemas/location.schema';
import { ForecastsService } from '../forecasts/forecasts.service';
import { ImportCsvDto } from './dto/import-export.dto';
import { StockMovementType } from '@potionpulse/contracts';

export interface ParsedImportRow {
  rowNumber: number;
  name: string;
  sku?: string;
  category: string;
  baseUnit: string;
  currentStock: number;
  costPerUnit: number;
  leadTimeDays: number;
  safetyStock: number;
  isDuplicate: boolean;
  duplicateField?: string;
}

export interface RowValidationError {
  rowNumber: number;
  field: string;
  message: string;
  rawLine?: string;
}

@Injectable()
export class ImportsExportsService {
  constructor(
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(StockMovement.name) private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    private readonly forecastsService: ForecastsService,
  ) {}

  /**
   * Parses CSV string into raw lines and columns
   */
  private parseCsvLines(rawCsv: string): string[][] {
    const lines = rawCsv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    return lines.map((line) => {
      // Split by comma while respecting quotes
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  }

  /**
   * Previews or executes CSV import for ingredients and inventory
   */
  async processIngredientCsv(tenantIdStr: string, _actorIdStr: string, dto: ImportCsvDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const grid = this.parseCsvLines(dto.rawCsv);

    if (grid.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }

    const headers = grid[0]!.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const colMap: Record<string, number> = {};

    headers.forEach((h, idx) => {
      if (['name', 'ingredient', 'ingredientname'].includes(h)) colMap.name = idx;
      else if (['sku', 'code', 'itemcode'].includes(h)) colMap.sku = idx;
      else if (['category', 'group', 'type'].includes(h)) colMap.category = idx;
      else if (['baseunit', 'unit', 'uom'].includes(h)) colMap.baseUnit = idx;
      else if (['currentstock', 'stock', 'onhand', 'quantity', 'qty'].includes(h)) colMap.currentStock = idx;
      else if (['costperunit', 'cost', 'unitcost', 'price'].includes(h)) colMap.costPerUnit = idx;
      else if (['leadtimedays', 'leadtime', 'leadtimes'].includes(h)) colMap.leadTimeDays = idx;
      else if (['safetystock', 'safety', 'buffer'].includes(h)) colMap.safetyStock = idx;
    });

    if (colMap.name === undefined) {
      throw new BadRequestException("CSV header must contain a 'name' or 'ingredient' column");
    }

    const errors: RowValidationError[] = [];
    const validRows: ParsedImportRow[] = [];

    // Query existing ingredients for duplicate detection
    const existingIngredients = await this.ingredientModel.find({ tenantId }).lean();
    const existingSkus = new Set(existingIngredients.filter((i) => i.sku).map((i) => i.sku!.toUpperCase()));
    const existingNames = new Set(existingIngredients.map((i) => i.name.toLowerCase()));

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r]!;
      const rowNumber = r + 1; // 1-based index including header

      const name = (row[colMap.name] || '').trim();
      if (!name) {
        errors.push({ rowNumber, field: 'name', message: 'Ingredient name is required' });
        continue;
      }

      const rawSku = colMap.sku !== undefined ? (row[colMap.sku] || '').trim().toUpperCase() : undefined;
      const sku = rawSku && rawSku.length > 0 ? rawSku : undefined;
      const category = colMap.category !== undefined && row[colMap.category] ? row[colMap.category]!.trim() : 'General';
      const baseUnit = colMap.baseUnit !== undefined && row[colMap.baseUnit] ? row[colMap.baseUnit]!.trim().toLowerCase() : 'pieces';

      const rawStock = colMap.currentStock !== undefined ? row[colMap.currentStock] : '0';
      const currentStock = parseFloat(rawStock || '0');
      if (isNaN(currentStock) || currentStock < 0) {
        errors.push({ rowNumber, field: 'currentStock', message: `Invalid stock quantity '${rawStock}': must be non-negative` });
        continue;
      }

      const rawCost = colMap.costPerUnit !== undefined ? row[colMap.costPerUnit] : '0';
      const costPerUnit = parseFloat(rawCost || '0');
      if (isNaN(costPerUnit) || costPerUnit < 0) {
        errors.push({ rowNumber, field: 'costPerUnit', message: `Invalid cost '${rawCost}': must be non-negative` });
        continue;
      }

      const rawLead = colMap.leadTimeDays !== undefined ? row[colMap.leadTimeDays] : '3';
      const leadTimeDays = parseInt(rawLead || '3', 10);

      const rawSafety = colMap.safetyStock !== undefined ? row[colMap.safetyStock] : '10';
      const safetyStock = parseFloat(rawSafety || '10');

      // Duplicate check
      let isDuplicate = false;
      let duplicateField: string | undefined = undefined;

      if (sku && existingSkus.has(sku)) {
        isDuplicate = true;
        duplicateField = `SKU '${sku}'`;
      } else if (existingNames.has(name.toLowerCase())) {
        isDuplicate = true;
        duplicateField = `Name '${name}'`;
      }

      validRows.push({
        rowNumber,
        name,
        sku,
        category,
        baseUnit,
        currentStock,
        costPerUnit,
        leadTimeDays: isNaN(leadTimeDays) ? 3 : leadTimeDays,
        safetyStock: isNaN(safetyStock) ? 10 : safetyStock,
        isDuplicate,
        duplicateField,
      });
    }

    const duplicateCount = validRows.filter((r) => r.isDuplicate).length;

    // If dryRun, return preview without committing to DB
    if (dto.dryRun) {
      return {
        dryRun: true,
        totalRows: grid.length - 1,
        validCount: validRows.length,
        duplicateCount,
        errorCount: errors.length,
        errors,
        previewRows: validRows.slice(0, 20),
      };
    }

    // Default location for stock placement
    let defaultLocation = await this.locationModel.findOne({ tenantId });
    if (!defaultLocation) {
      defaultLocation = await this.locationModel.create({
        tenantId,
        name: 'Main Apothecary Vault',
        type: 'STORAGE',
      });
    }

    const createdIngredients = [];
    const updatedIngredients = [];

    for (const item of validRows) {
      if (item.isDuplicate && !dto.overwriteDuplicates) {
        continue; // Skip duplicate if overwrite is false
      }

      let ingredient = await this.ingredientModel.findOne({
        tenantId,
        ...(item.sku ? { sku: item.sku } : { name: item.name }),
      });

      if (ingredient) {
        // Update existing
        ingredient.name = item.name;
        ingredient.category = item.category;
        ingredient.baseUnit = item.baseUnit;
        ingredient.costPerUnit = item.costPerUnit;
        ingredient.leadTimeDays = item.leadTimeDays;
        ingredient.safetyStock = item.safetyStock;
        await ingredient.save();
        updatedIngredients.push(ingredient);
      } else {
        // Create new
        ingredient = await this.ingredientModel.create({
          tenantId,
          name: item.name,
          sku: item.sku,
          category: item.category,
          baseUnit: item.baseUnit,
          costPerUnit: item.costPerUnit,
          leadTimeDays: item.leadTimeDays,
          safetyStock: item.safetyStock,
        });
        createdIngredients.push(ingredient);
      }

      // Initialize or update inventory balance if stock specified
      if (item.currentStock > 0) {
        const balance = await this.balanceModel.findOneAndUpdate(
          { tenantId, ingredientId: ingredient._id, locationId: defaultLocation._id },
          {
            $set: { onHand: item.currentStock },
            $inc: { version: 1 },
            $setOnInsert: { reserved: 0 },
          },
          { upsert: true, new: true }
        );

        await this.movementModel.create({
          tenantId,
          ingredientId: ingredient._id,
          locationId: defaultLocation._id,
          type: StockMovementType.RECEIPT,
          quantityDelta: item.currentStock,
          unit: item.baseUnit,
          balanceAfter: balance.onHand,
          reason: `CSV Import: ${ingredient.name}`,
          referenceType: 'initial_seed',
        });
      }
    }

    return {
      message: 'CSV import completed successfully',
      dryRun: false,
      createdCount: createdIngredients.length,
      updatedCount: updatedIngredients.length,
      skippedDuplicatesCount: validRows.filter((r) => r.isDuplicate && !dto.overwriteDuplicates).length,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Generates downloadable CSV of current inventory positions
   */
  async exportInventoryCsv(tenantIdStr: string): Promise<string> {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const ingredients = await this.ingredientModel.find({ tenantId, archivedAt: null }).sort({ name: 1 }).lean();
    const balances = await this.balanceModel.find({ tenantId }).lean();
    const balanceMap = new Map<string, number>();
    for (const b of balances) {
      balanceMap.set(b.ingredientId.toString(), (balanceMap.get(b.ingredientId.toString()) || 0) + b.onHand);
    }

    const lines = [
      'SKU,Name,Category,Base Unit,On Hand,Cost Per Unit,Lead Time Days,Safety Stock',
    ];

    for (const ing of ingredients) {
      const onHand = balanceMap.get(ing._id.toString()) || 0;
      const row = [
        `"${ing.sku || ''}"`,
        `"${ing.name}"`,
        `"${ing.category || 'General'}"`,
        `"${ing.baseUnit}"`,
        onHand,
        ing.costPerUnit || 0,
        ing.leadTimeDays || 3,
        ing.safetyStock || 10,
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Generates downloadable CSV of AI demand forecasts and restock plans
   */
  async exportForecastsCsv(tenantIdStr: string): Promise<string> {
    const summaries = await this.forecastsService.getTenantForecastSummary(tenantIdStr);

    const lines = [
      'Ingredient ID,Ingredient Name,Base Unit,Current Stock,Days of Cover,Risk Level,Projected Stockout Date,Recommended Reorder,Recommended Order Date,Model Used',
    ];

    for (const s of summaries) {
      const row = [
        `"${s.ingredientId}"`,
        `"${s.ingredientName}"`,
        `"${s.unit}"`,
        s.currentStock,
        s.daysOfCover,
        `"${s.riskLevel}"`,
        `"${s.projectedStockoutDate || 'N/A'}"`,
        s.recommendedRestock,
        `"${s.recommendedOrderDate}"`,
        `"${s.modelUsed}"`,
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }
}
