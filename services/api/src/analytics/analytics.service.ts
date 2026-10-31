import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SaleItem, SaleItemDocument } from '../sales/schemas/sale-item.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { PurchaseOrder, PurchaseOrderDocument } from '../purchase-orders/schemas/purchase-order.schema';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(SaleItem.name) private saleItemModel: Model<SaleItemDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(InventoryBalance.name) private balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    @InjectModel(PurchaseOrder.name) private poModel: Model<PurchaseOrderDocument>,
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

  /**
   * Wastage Analysis: aggregates spillage, expiration, and brewing loss
   */
  async getWastageAnalysis(tenantIdStr: string, days = 30) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const startDate = new Date(Date.now() - days * 86400000);

    const wastageMovements = await this.movementModel
      .find({
        tenantId,
        type: StockMovementType.WASTAGE,
        occurredAt: { $gte: startDate },
      })
      .populate('ingredientId', 'name baseUnit costPerUnit')
      .lean();

    const ingredientWastageMap = new Map<string, { ingredientName: string; unit: string; totalWasted: number; totalCostLoss: number; incidents: number }>();
    const reasonMap = new Map<string, number>();

    let grandTotalCostLoss = 0;
    let grandTotalWastedUnits = 0;

    for (const mov of wastageMovements) {
      const ing = mov.ingredientId as any;
      const ingId = ing?._id?.toString() || 'unknown';
      const costPerUnit = ing?.costPerUnit || 0;
      const qty = Math.abs(mov.quantityDelta);

      const costLoss = Math.round(qty * costPerUnit * 100) / 100;
      grandTotalCostLoss += costLoss;
      grandTotalWastedUnits += qty;

      const existing = ingredientWastageMap.get(ingId) || {
        ingredientName: ing?.name || 'Unknown',
        unit: ing?.baseUnit || 'units',
        totalWasted: 0,
        totalCostLoss: 0,
        incidents: 0,
      };

      existing.totalWasted += qty;
      existing.totalCostLoss = Math.round((existing.totalCostLoss + costLoss) * 100) / 100;
      existing.incidents += 1;
      ingredientWastageMap.set(ingId, existing);

      const reason = mov.reason || 'Unspecified';
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    }

    return {
      periodDays: days,
      grandTotalWastedUnits: Math.round(grandTotalWastedUnits * 10) / 10,
      grandTotalCostLoss: Math.round(grandTotalCostLoss * 100) / 100,
      byIngredient: Array.from(ingredientWastageMap.values()).sort((a, b) => b.totalCostLoss - a.totalCostLoss),
      byReason: Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })),
    };
  }

  /**
   * Supplier Performance Report: On-time delivery rates, fulfillment, and spend
   */
  async getSupplierPerformanceReport(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const suppliers = await this.supplierModel.find({ tenantId }).lean();
    const purchaseOrders = await this.poModel.find({ tenantId }).lean();

    const report = [];

    for (const sup of suppliers) {
      const supPOs = purchaseOrders.filter((p) => p.supplierId.toString() === sup._id.toString());
      const totalSpend = supPOs.filter((p) => p.status === 'received').reduce((sum, p) => sum + p.totalCost, 0);

      report.push({
        supplierId: sup._id,
        supplierName: sup.name,
        leadTimeDays: sup.leadTimeDays,
        status: sup.status,
        totalOrders: supPOs.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        performance: sup.performance || {
          onTimeDeliveryRate: 100,
          fulfillmentRate: 100,
          rating: 5.0,
        },
      });
    }

    return {
      totalSuppliers: suppliers.length,
      suppliers: report,
    };
  }

  /**
   * Period-over-period comparative analysis (e.g. this week vs last week)
   */
  async getPeriodOverPeriodComparison(tenantIdStr: string, periodDays = 7) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - periodDays * 86400000);
    const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 86400000);

    const [currentSales, prevSales, currentWaste, prevWaste] = await Promise.all([
      this.saleModel.find({ tenantId, status: 'completed', soldAt: { $gte: currentPeriodStart } }).lean(),
      this.saleModel.find({ tenantId, status: 'completed', soldAt: { $gte: previousPeriodStart, $lt: currentPeriodStart } }).lean(),
      this.movementModel.find({ tenantId, type: StockMovementType.WASTAGE, occurredAt: { $gte: currentPeriodStart } }).lean(),
      this.movementModel.find({ tenantId, type: StockMovementType.WASTAGE, occurredAt: { $gte: previousPeriodStart, $lt: currentPeriodStart } }).lean(),
    ]);

    const curRevenue = currentSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const prevRevenue = prevSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const revenueDelta = prevRevenue > 0 ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    const curWasteQty = currentWaste.reduce((acc, w) => acc + Math.abs(w.quantityDelta), 0);
    const prevWasteQty = prevWaste.reduce((acc, w) => acc + Math.abs(w.quantityDelta), 0);
    const wasteDelta = prevWasteQty > 0 ? Math.round(((curWasteQty - prevWasteQty) / prevWasteQty) * 100) : 0;

    return {
      periodDays,
      currentPeriod: {
        revenue: Math.round(curRevenue * 100) / 100,
        orders: currentSales.length,
        wasteUnits: Math.round(curWasteQty * 10) / 10,
      },
      previousPeriod: {
        revenue: Math.round(prevRevenue * 100) / 100,
        orders: prevSales.length,
        wasteUnits: Math.round(prevWasteQty * 10) / 10,
      },
      comparison: {
        revenueGrowthPercentage: `${revenueDelta >= 0 ? '+' : ''}${revenueDelta}%`,
        orderGrowthPercentage: `${currentSales.length - prevSales.length >= 0 ? '+' : ''}${currentSales.length - prevSales.length}`,
        wastePercentageChange: `${wasteDelta >= 0 ? '+' : ''}${wasteDelta}%`,
      },
    };
  }
}
