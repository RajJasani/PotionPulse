import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { DemandEvent, DemandEventDocument } from '../events/schemas/demand-event.schema';
import { EventsGateway } from '../events/events.gateway';
import { ForecastsService } from '../forecasts/forecasts.service';

export interface CreateNotificationInput {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  payload?: Record<string, unknown>;
  fingerprint?: string;
  userId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(DemandEvent.name) private readonly eventModel: Model<DemandEventDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly forecastsService: ForecastsService,
  ) {}

  async createNotification(tenantIdStr: string, input: CreateNotificationInput) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const userId = input.userId ? new Types.ObjectId(input.userId) : undefined;
    const severity = input.severity || 'info';

    // Deduplication check if fingerprint provided (skip if created within last 6 hours)
    if (input.fingerprint) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const existing = await this.notificationModel.findOne({
        tenantId,
        fingerprint: input.fingerprint,
        createdAt: { $gte: sixHoursAgo },
      });
      if (existing) {
        return existing;
      }
    }

    const notification = await this.notificationModel.create({
      tenantId,
      userId,
      title: input.title,
      message: input.message,
      severity,
      payload: input.payload || {},
      fingerprint: input.fingerprint,
    });

    // Broadcast real-time notification to active tenant session rooms
    this.eventsGateway.server?.to(`tenant:${tenantIdStr}`).emit('notification:created', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      createdAt: notification.createdAt,
      payload: notification.payload,
    });

    return notification;
  }

  async listNotifications(
    tenantIdStr: string,
    query: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
  ) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: Record<string, unknown> = { tenantId };

    if (query.unreadOnly) {
      filter.readAt = null;
    }

    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = Math.max(0, query.offset || 0);

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ tenantId, readAt: null }),
    ]);

    return {
      data: items,
      meta: {
        total,
        unreadCount,
        limit,
        offset,
      },
    };
  }

  async markAsRead(tenantIdStr: string, notificationId: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), tenantId },
      { $set: { readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }
    return notification;
  }

  async markAllAsRead(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const result = await this.notificationModel.updateMany(
      { tenantId, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return { markedCount: result.modifiedCount };
  }

  /**
   * Scans inventory for low stock, stockout risks, and active seasonal events,
   * automatically generating in-app notifications and WebSocket alerts.
   */
  async generateAlertsForTenant(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const generated = [];

    // 1. Check Low Stock (onHand <= reorderPoint)
    const ingredients = await this.ingredientModel.find({ tenantId, archivedAt: null }).lean();
    const balances = await this.balanceModel.find({ tenantId }).lean();
    const balanceMap = new Map<string, number>();
    for (const b of balances) {
      balanceMap.set(b.ingredientId.toString(), (balanceMap.get(b.ingredientId.toString()) || 0) + b.onHand);
    }

    for (const ing of ingredients) {
      const onHand = balanceMap.get(ing._id.toString()) || 0;
      if (ing.reorderPoint > 0 && onHand <= ing.reorderPoint) {
        const notif = await this.createNotification(tenantIdStr, {
          title: `Low Stock: ${ing.name}`,
          message: `${ing.name} has dropped to ${onHand} ${ing.baseUnit} (Reorder point: ${ing.reorderPoint} ${ing.baseUnit}). Restock recommended.`,
          severity: 'warning',
          payload: { ingredientId: ing._id, onHand, reorderPoint: ing.reorderPoint },
          fingerprint: `low_stock_${ing._id.toString()}_${new Date().toISOString().slice(0, 10)}`,
        });
        generated.push(notif);
      }
    }

    // 2. Check AI Forecast Stockout Risks (CRITICAL risk levels)
    try {
      const forecastSummaries = await this.forecastsService.getTenantForecastSummary(tenantIdStr);
      for (const fc of forecastSummaries) {
        if (fc.riskLevel === 'CRITICAL') {
          const notif = await this.createNotification(tenantIdStr, {
            title: `CRITICAL Stockout Risk: ${fc.ingredientName}`,
            message: `Days of cover (${fc.daysOfCover}d) is less than lead time. Projected stockout on ${fc.projectedStockoutDate || 'immediate'}. Recommended reorder: ${fc.recommendedRestock} ${fc.unit}.`,
            severity: 'critical',
            payload: {
              ingredientId: fc.ingredientId,
              daysOfCover: fc.daysOfCover,
              stockoutDate: fc.projectedStockoutDate,
              recommendedRestock: fc.recommendedRestock,
            },
            fingerprint: `stockout_risk_${fc.ingredientId}_${new Date().toISOString().slice(0, 10)}`,
          });
          generated.push(notif);
        }
      }
    } catch {
      // Forecast fallback
    }

    // 3. Check Active Seasonal Events (e.g. Midnight Curse)
    const activeEvents = await this.eventModel.find({ tenantId, status: 'active' }).lean();
    for (const ev of activeEvents) {
      const notif = await this.createNotification(tenantIdStr, {
        title: `Active Event: ${ev.name}`,
        message: `${ev.name} is currently active (${ev.multiplier}x demand surge applied to ${ev.ingredientIds.length} ingredients).`,
        severity: 'info',
        payload: { eventId: ev._id, multiplier: ev.multiplier },
        fingerprint: `active_event_${ev._id.toString()}_${new Date().toISOString().slice(0, 10)}`,
      });
      generated.push(notif);
    }

    return {
      message: `Alert scan complete. Generated ${generated.length} notifications.`,
      generatedCount: generated.length,
      notifications: generated,
    };
  }
}
