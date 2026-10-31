import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SaleItem, SaleItemDocument } from '../sales/schemas/sale-item.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(InventoryBalance.name) private balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
  ) {}

  async getDemandSeries(
    tenantId: string,
    query: { ingredientId?: string; days?: number },
  ) {
    const tid = new Types.ObjectId(tenantId);
    const days = Math.min(365, Math.max(1, Number(query.days) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const match: Record<string, unknown> = {
      tenantId: tid,
      soldAt: { $gte: startDate },
      status: 'completed',
    };

    const sales = await this.saleModel.find(match).select('_id soldAt').lean();
    const saleMap = new Map<string, Date>();
    for (const s of sales) {
      saleMap.set(s._id.toString(), s.soldAt);
    }

    const saleIds = Array.from(saleMap.keys()).map((id) => new Types.ObjectId(id));
    const itemMatch: Record<string, unknown> = {
      tenantId: tid,
      saleId: { $in: saleIds },
    };

    if (query.ingredientId && Types.ObjectId.isValid(query.ingredientId)) {
      itemMatch.ingredientId = new Types.ObjectId(query.ingredientId);
    }

    const items = await this.saleItemModel
      .find(itemMatch)
      .populate('ingredientId', 'name sku baseUnit')
      .lean();

    // Group by date (YYYY-MM-DD) and ingredient
    const dailyMap = new Map<string, { date: string; ingredientId: string; ingredientName: string; quantity: number; revenue: number }>();

    for (const item of items) {
      const soldAt = saleMap.get(item.saleId.toString());
      if (!soldAt) continue;
      const dateKey = soldAt.toISOString().slice(0, 10);
      const ing = item.ingredientId as any;
      const ingId = ing?._id?.toString() || item.ingredientId.toString();
      const key = `${dateKey}_${ingId}`;

      const existing = dailyMap.get(key) || {
        date: dateKey,
        ingredientId: ingId,
        ingredientName: ing?.name || 'Unknown',
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      dailyMap.set(key, existing);
    }

    const points = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      points,
      daysCovered: days,
      totalObservations: points.length,
    };
  }

  async getOverviewMetrics(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);

    const [totalIngredients, lowStockCount, sales30Days] = await Promise.all([
      this.ingredientModel.countDocuments({ tenantId: tid, archivedAt: null }),
      this.balanceModel.aggregate([
        { $match: { tenantId: tid } },
        {
          $lookup: {
            from: 'ingredients',
            localField: 'ingredientId',
            foreignField: '_id',
            as: 'ingredient',
          },
        },
        { $unwind: '$ingredient' },
        {
          $match: {
            'ingredient.archivedAt': null,
            $expr: { $lte: ['$onHand', '$ingredient.reorderPoint'] },
          },
        },
        { $count: 'count' },
      ]),
      this.saleModel.aggregate([
        {
          $match: {
            tenantId: tid,
            status: 'completed',
            soldAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const lowStock = lowStockCount[0]?.count || 0;
    const salesSummary = sales30Days[0] || { totalRevenue: 0, totalOrders: 0 };

    return {
      totalIngredients,
      lowStockItems: lowStock,
      past30DaysOrders: salesSummary.totalOrders,
      past30DaysRevenue: salesSummary.totalRevenue,
    };
  }
}
