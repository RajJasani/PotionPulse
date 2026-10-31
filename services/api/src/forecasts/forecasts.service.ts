import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Forecast, ForecastDocument } from './schemas/forecast.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemDocument } from '../sales/schemas/sale-item.schema';
import { DemandEvent, DemandEventDocument } from '../events/schemas/demand-event.schema';
import {
  DataPreprocessor,
  AdaptiveForecastSelector,
  StockoutPredictor,
  RestockOptimizer,
  SeasonalEventWindow,
} from '@potionpulse/forecasting';

@Injectable()
export class ForecastsService {
  constructor(
    @InjectModel(Forecast.name) private readonly forecastModel: Model<ForecastDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Sale.name) private readonly saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private readonly saleItemModel: Model<SaleItemDocument>,
    @InjectModel(DemandEvent.name) private readonly eventModel: Model<DemandEventDocument>,
  ) {}

  /**
   * Generates a statistically defensible demand forecast for an ingredient,
   * evaluates stockout risk, and calculates restock recommendations.
   */
  async generateIngredientForecast(
    tenantIdStr: string,
    ingredientIdStr: string,
    horizonDays = 14,
  ) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const ingredientId = new Types.ObjectId(ingredientIdStr);

    const ingredient = await this.ingredientModel.findOne({ _id: ingredientId, tenantId });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient ${ingredientIdStr} not found`);
    }

    const balance = await this.balanceModel.findOne({ tenantId, ingredientId });
    const currentStock = balance?.onHand ?? 0;

    // Fetch active demand events (e.g. Midnight Curse)
    const dbEvents = await this.eventModel.find({ tenantId, isActive: true });
    const eventWindows: SeasonalEventWindow[] = dbEvents.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      startDate: e.startAt.toISOString().slice(0, 10),
      endDate: e.endAt.toISOString().slice(0, 10),
      multiplier: e.multiplier || 1.0,
    }));

    // Fetch historical completed sales
    const sales = await this.saleModel
      .find({ tenantId, status: 'completed' })
      .select('_id soldAt')
      .lean();

    const saleMap = new Map<string, Date>();
    for (const s of sales) {
      saleMap.set(s._id.toString(), s.soldAt);
    }

    const saleIds = Array.from(saleMap.keys()).map((id) => new Types.ObjectId(id));
    const items = await this.saleItemModel
      .find({
        tenantId,
        ingredientId,
        saleId: { $in: saleIds },
      })
      .lean();

    const rawPoints: Array<{ date: string; value: number }> = [];
    for (const item of items) {
      const soldAt = saleMap.get(item.saleId.toString());
      if (soldAt) {
        rawPoints.push({
          date: soldAt.toISOString().slice(0, 10),
          value: item.quantity,
        });
      }
    }

    // Preprocess historical series
    const preprocessed = DataPreprocessor.preprocess(rawPoints, {
      fillMissingDates: true,
      missingDateStrategy: 'zero',
    });

    // Run Adaptive Forecast Selection
    const forecastResult = AdaptiveForecastSelector.generateForecast(
      ingredientId.toString(),
      ingredient.name,
      preprocessed.points,
      horizonDays,
      eventWindows,
    );

    // Assess Stockout Risk
    const stockoutRisk = StockoutPredictor.assessRisk({
      ingredientId: ingredientId.toString(),
      ingredientName: ingredient.name,
      currentStock,
      unit: ingredient.baseUnit || 'units',
      incomingStock: 0,
      leadTimeDays: ingredient.leadTimeDays || 3,
      safetyStock: ingredient.safetyStock || 10,
      forecast: forecastResult.forecast,
    });

    // Calculate Restock Optimization
    const restockPlan = RestockOptimizer.calculateRecommendation({
      ingredientId: ingredientId.toString(),
      ingredientName: ingredient.name,
      currentStock,
      unit: ingredient.baseUnit || 'units',
      incomingStock: 0,
      leadTimeDays: ingredient.leadTimeDays || 3,
      safetyStock: ingredient.safetyStock || 10,
      reviewCycleDays: 7,
      packSize: 1,
      moq: 0,
      unitCost: ingredient.costPerUnit || 0,
      forecast: forecastResult.forecast,
    });

    // Persist snapshot to MongoDB
    const persisted = await this.forecastModel.create({
      tenantId,
      ingredientId,
      generatedAt: new Date(),
      horizon: `${horizonDays}d`,
      modelVersion: forecastResult.modelUsed,
      dataSufficiency: preprocessed.points.length >= 14 ? 'SUFFICIENT' : 'LIMITED',
      points: forecastResult.forecast.map((f) => ({
        date: f.date,
        baselineDemand: f.predictedDemand / (f.eventMultiplierApplied || 1.0),
        eventAdjustedDemand: f.predictedDemand,
      })),
      eventIds: dbEvents.map((e) => e._id),
    });

    return {
      forecastId: persisted._id,
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      unit: ingredient.baseUnit,
      currentStock,
      forecastResult,
      stockoutRisk,
      restockPlan,
    };
  }

  /**
   * Retrieves tenant-wide forecast summary across all ingredients
   */
  async getTenantForecastSummary(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const ingredients = await this.ingredientModel.find({ tenantId, archivedAt: null });
    const summaries = [];

    for (const ing of ingredients) {
      try {
        const result = await this.generateIngredientForecast(tenantIdStr, ing._id.toString(), 14);
        summaries.push({
          ingredientId: ing._id,
          ingredientName: ing.name,
          unit: ing.baseUnit,
          currentStock: result.currentStock,
          daysOfCover: result.stockoutRisk.daysOfCover,
          riskLevel: result.stockoutRisk.riskLevel,
          projectedStockoutDate: result.stockoutRisk.projectedStockoutDate,
          recommendedRestock: result.restockPlan.recommendedQuantity,
          recommendedOrderDate: result.restockPlan.recommendedOrderDate,
          modelUsed: result.forecastResult.modelUsed,
        });
      } catch {
        summaries.push({
          ingredientId: ing._id,
          ingredientName: ing.name,
          unit: ing.baseUnit,
          currentStock: 0,
          daysOfCover: 999,
          riskLevel: 'LOW',
          projectedStockoutDate: null,
          recommendedRestock: 0,
          recommendedOrderDate: new Date().toISOString().slice(0, 10),
          modelUsed: 'SimpleMovingAverage_FallbackColdStart',
        });
      }
    }

    return summaries;
  }
}
