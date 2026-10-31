import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DemandEvent, DemandEventDocument } from './schemas/demand-event.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemDocument } from '../sales/schemas/sale-item.schema';
import { EventsGateway } from './events.gateway';
import { CreateDemandEventDto, MidnightCurseSetupDto, UpdateDemandEventDto } from './dto/event.dto';
import {
  DataPreprocessor,
  AdaptiveForecastSelector,
  StockoutPredictor,
  RestockOptimizer,
  SeasonalEventWindow,
} from '@potionpulse/forecasting';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(DemandEvent.name) private readonly eventModel: Model<DemandEventDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Sale.name) private readonly saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private readonly saleItemModel: Model<SaleItemDocument>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createEvent(tenantIdStr: string, dto: CreateDemandEventDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('Event startAt must precede endAt');
    }

    const ingredientObjectIds = (dto.ingredientIds || []).map((id) => new Types.ObjectId(id));

    // Validate that provided ingredients exist
    if (ingredientObjectIds.length > 0) {
      const foundCount = await this.ingredientModel.countDocuments({
        tenantId,
        _id: { $in: ingredientObjectIds },
      });
      if (foundCount !== ingredientObjectIds.length) {
        throw new BadRequestException('One or more selected ingredient IDs do not exist in this tenant');
      }
    }

    const now = new Date();
    let computedStatus = dto.status || 'scheduled';
    if (!dto.status) {
      if (now >= startAt && now <= endAt) computedStatus = 'active';
      else if (now > endAt) computedStatus = 'expired';
    }

    const event = await this.eventModel.create({
      tenantId,
      name: dto.name,
      description: dto.description || '',
      startAt,
      endAt,
      multiplier: dto.multiplier || 1.0,
      ingredientIds: ingredientObjectIds,
      status: computedStatus,
    });

    this.eventsGateway.server?.to(`tenant:${tenantIdStr}`).emit('event:created', {
      tenantId: tenantIdStr,
      eventId: event._id,
      name: event.name,
      status: event.status,
    });

    return event;
  }

  async listEvents(tenantIdStr: string, status?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const now = new Date();

    // Auto-update statuses based on wall-clock time
    await this.eventModel.updateMany(
      { tenantId, endAt: { $lt: now }, status: { $in: ['active', 'scheduled'] } },
      { $set: { status: 'expired' } },
    );

    const filter: Record<string, unknown> = { tenantId };
    if (status) {
      filter.status = status;
    }

    return this.eventModel
      .find(filter)
      .populate('ingredientIds', 'name sku baseUnit')
      .sort({ startAt: -1 })
      .lean();
  }

  async getEvent(tenantIdStr: string, eventId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const event = await this.eventModel
      .findOne({ _id: new Types.ObjectId(eventId), tenantId })
      .populate('ingredientIds', 'name sku baseUnit')
      .lean();

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return event;
  }

  async updateEvent(tenantIdStr: string, eventId: string, dto: UpdateDemandEventDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const event = await this.eventModel.findOne({ _id: new Types.ObjectId(eventId), tenantId });
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (dto.name !== undefined) event.name = dto.name;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.startAt !== undefined) event.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) event.endAt = new Date(dto.endAt);
    if (dto.multiplier !== undefined) event.multiplier = dto.multiplier;
    if (dto.status !== undefined) event.status = dto.status;
    if (dto.ingredientIds !== undefined) {
      event.ingredientIds = dto.ingredientIds.map((id) => new Types.ObjectId(id));
    }

    await event.save();

    this.eventsGateway.server?.to(`tenant:${tenantIdStr}`).emit('event:updated', {
      tenantId: tenantIdStr,
      eventId: event._id,
      name: event.name,
      status: event.status,
    });

    return event;
  }

  async activateEvent(tenantIdStr: string, eventId: string) {
    return this.updateEvent(tenantIdStr, eventId, { status: 'active' });
  }

  async expireEvent(tenantIdStr: string, eventId: string) {
    return this.updateEvent(tenantIdStr, eventId, { status: 'expired' });
  }

  /**
   * Official Midnight Curse Scenario:
   * - Configurable festival window
   * - Exactly 3 affected ingredients
   * - Demand multiplier: 3.0
   */
  async setupMidnightCurseScenario(tenantIdStr: string, dto: MidnightCurseSetupDto) {
    const tenantId = new Types.ObjectId(tenantIdStr);

    // Strict Rule: Exactly three affected ingredients
    if (!dto.ingredientIds || dto.ingredientIds.length !== 3) {
      throw new BadRequestException('Midnight Curse scenario requires exactly three affected ingredients');
    }

    const ingredientObjectIds = dto.ingredientIds.map((id) => new Types.ObjectId(id));
    const verifiedIngredients = await this.ingredientModel
      .find({ tenantId, _id: { $in: ingredientObjectIds } })
      .lean();

    if (verifiedIngredients.length !== 3) {
      throw new BadRequestException(
        `Failed to verify all 3 ingredients. Found ${verifiedIngredients.length}/3 matching ingredients in tenant catalog.`
      );
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new BadRequestException('Midnight Curse startAt must precede endAt');
    }

    const eventName = dto.name || 'Midnight Curse Festival';
    const multiplier = 3.0; // Official requirement: strictly 3.0

    // Upsert or create official Midnight Curse record
    let event = await this.eventModel.findOne({ tenantId, name: /Midnight Curse/i });
    if (event) {
      event.name = eventName;
      event.startAt = startAt;
      event.endAt = endAt;
      event.multiplier = multiplier;
      event.ingredientIds = ingredientObjectIds;
      event.status = 'active';
      await event.save();
    } else {
      event = await this.eventModel.create({
        tenantId,
        name: eventName,
        description: 'Official Midnight Curse high-potency surge scenario (+300% demand for 3 key reagents).',
        startAt,
        endAt,
        multiplier,
        ingredientIds: ingredientObjectIds,
        status: 'active',
      });
    }

    // Broadcast instant real-time alert to web and mobile
    this.eventsGateway.server?.to(`tenant:${tenantIdStr}`).emit('midnight_curse:activated', {
      tenantId: tenantIdStr,
      eventId: event._id,
      name: event.name,
      multiplier: 3.0,
      affectedIngredients: verifiedIngredients.map((ing) => ({
        id: ing._id,
        name: ing.name,
        baseUnit: ing.baseUnit,
      })),
      startAt: event.startAt,
      endAt: event.endAt,
    });

    return {
      message: 'Midnight Curse scenario activated successfully with 3x surge across 3 configured ingredients',
      event,
      affectedIngredients: verifiedIngredients,
    };
  }

  /**
   * Computes granular baseline vs event-adjusted impact comparison
   */
  async calculateEventImpact(tenantIdStr: string, eventId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const event = await this.eventModel.findOne({ _id: new Types.ObjectId(eventId), tenantId });
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const eventWindow: SeasonalEventWindow = {
      id: event._id.toString(),
      name: event.name,
      startDate: event.startAt.toISOString().slice(0, 10),
      endDate: event.endAt.toISOString().slice(0, 10),
      multiplier: event.multiplier,
      affectedIngredientIds: event.ingredientIds.map((id) => id.toString()),
    };

    const impactResults = [];

    // Query completed sales
    const sales = await this.saleModel
      .find({ tenantId, status: 'completed' })
      .select('_id soldAt')
      .lean();
    const saleMap = new Map<string, Date>();
    for (const s of sales) {
      saleMap.set(s._id.toString(), s.soldAt);
    }
    const saleIds = Array.from(saleMap.keys()).map((id) => new Types.ObjectId(id));

    for (const ingId of event.ingredientIds) {
      const ingredient = await this.ingredientModel.findOne({ _id: ingId, tenantId });
      if (!ingredient) continue;

      const balance = await this.balanceModel.findOne({ tenantId, ingredientId: ingId });
      const currentStock = balance?.onHand ?? 0;

      const items = await this.saleItemModel
        .find({
          tenantId,
          ingredientId: ingId,
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

      const preprocessed = DataPreprocessor.preprocess(rawPoints);

      // 1. Baseline forecast (NO event window)
      const baselineForecast = AdaptiveForecastSelector.generateForecast(
        ingId.toString(),
        ingredient.name,
        preprocessed.points,
        14,
        []
      );

      // 2. Event-adjusted forecast (WITH event window)
      const eventForecast = AdaptiveForecastSelector.generateForecast(
        ingId.toString(),
        ingredient.name,
        preprocessed.points,
        14,
        [eventWindow]
      );

      // 3. Stockout Risk comparison
      const baselineRisk = StockoutPredictor.assessRisk({
        ingredientId: ingId.toString(),
        ingredientName: ingredient.name,
        currentStock,
        unit: ingredient.baseUnit,
        incomingStock: 0,
        leadTimeDays: ingredient.leadTimeDays || 3,
        safetyStock: ingredient.safetyStock || 10,
        forecast: baselineForecast.forecast,
      });

      const eventRisk = StockoutPredictor.assessRisk({
        ingredientId: ingId.toString(),
        ingredientName: ingredient.name,
        currentStock,
        unit: ingredient.baseUnit,
        incomingStock: 0,
        leadTimeDays: ingredient.leadTimeDays || 3,
        safetyStock: ingredient.safetyStock || 10,
        forecast: eventForecast.forecast,
      });

      // 4. Restock Plan comparison
      const baselineRestock = RestockOptimizer.calculateRecommendation({
        ingredientId: ingId.toString(),
        ingredientName: ingredient.name,
        currentStock,
        unit: ingredient.baseUnit,
        incomingStock: 0,
        leadTimeDays: ingredient.leadTimeDays || 3,
        safetyStock: ingredient.safetyStock || 10,
        forecast: baselineForecast.forecast,
      });

      const eventRestock = RestockOptimizer.calculateRecommendation({
        ingredientId: ingId.toString(),
        ingredientName: ingredient.name,
        currentStock,
        unit: ingredient.baseUnit,
        incomingStock: 0,
        leadTimeDays: ingredient.leadTimeDays || 3,
        safetyStock: ingredient.safetyStock || 10,
        forecast: eventForecast.forecast,
      });

      impactResults.push({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        unit: ingredient.baseUnit,
        currentStock,
        baseline: {
          daysOfCover: baselineRisk.daysOfCover,
          stockoutDate: baselineRisk.projectedStockoutDate,
          riskLevel: baselineRisk.riskLevel,
          recommendedRestock: baselineRestock.recommendedQuantity,
          forecast: baselineForecast.forecast,
        },
        withEvent: {
          daysOfCover: eventRisk.daysOfCover,
          stockoutDate: eventRisk.projectedStockoutDate,
          riskLevel: eventRisk.riskLevel,
          recommendedRestock: eventRestock.recommendedQuantity,
          forecast: eventForecast.forecast,
        },
        impactDelta: {
          daysOfCoverReduction: Math.round((baselineRisk.daysOfCover - eventRisk.daysOfCover) * 10) / 10,
          additionalStockRequired: Math.max(0, eventRestock.recommendedQuantity - baselineRestock.recommendedQuantity),
        },
      });
    }

    return {
      eventId: event._id,
      eventName: event.name,
      multiplier: event.multiplier,
      startAt: event.startAt,
      endAt: event.endAt,
      status: event.status,
      ingredientsCount: event.ingredientIds.length,
      impact: impactResults,
    };
  }
}
