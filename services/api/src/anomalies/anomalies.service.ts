import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Anomaly, AnomalyDocument } from './schemas/anomaly.schema';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema';
import { StockMovement, StockMovementDocument } from '../movements/schemas/stock-movement.schema';
import { InventoryBalance, InventoryBalanceDocument } from '../inventory/schemas/inventory-balance.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';
import { SaleItem, SaleItemDocument } from '../sales/schemas/sale-item.schema';
import { DemandEvent, DemandEventDocument } from '../events/schemas/demand-event.schema';
import {
  AnomalyDetector,
  DataPreprocessor,
  SeasonalEventWindow,
  StockAdjustmentRecord,
  LedgerMismatchCheck,
} from '@potionpulse/forecasting';
import { StockMovementType } from '@potionpulse/contracts';

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectModel(Anomaly.name) private readonly anomalyModel: Model<AnomalyDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(StockMovement.name) private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(InventoryBalance.name) private readonly balanceModel: Model<InventoryBalanceDocument>,
    @InjectModel(Sale.name) private readonly saleModel: Model<SaleDocument>,
    @InjectModel(SaleItem.name) private readonly saleItemModel: Model<SaleItemDocument>,
    @InjectModel(DemandEvent.name) private readonly eventModel: Model<DemandEventDocument>,
  ) {}

  /**
   * Runs the full explainable anomaly detection engine across all active inventory and movements
   */
  async scanAnomaliesForTenant(tenantIdStr: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const ingredients = await this.ingredientModel.find({ tenantId, archivedAt: null });
    const dbEvents = await this.eventModel.find({ tenantId, isActive: true });
    const eventWindows: SeasonalEventWindow[] = dbEvents.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      startDate: e.startAt.toISOString().slice(0, 10),
      endDate: e.endAt.toISOString().slice(0, 10),
      multiplier: e.multiplier || 1.0,
    }));

    const detectedReports = [];

    for (const ing of ingredients) {
      // 1. Demand anomalies
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
          ingredientId: ing._id,
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

      if (rawPoints.length >= 7) {
        const preprocessed = DataPreprocessor.preprocess(rawPoints);
        const demandAnomalies = AnomalyDetector.detectDemandAnomalies(
          ing._id.toString(),
          ing.name,
          preprocessed.points,
          { eventWindows }
        );
        detectedReports.push(...demandAnomalies);
      }

      // 2. Shrinkage anomalies from adjustments
      const adjustments = await this.movementModel
        .find({
          tenantId,
          ingredientId: ing._id,
          type: StockMovementType.ADJUSTMENT_OUT,
        })
        .sort({ occurredAt: -1 })
        .limit(20)
        .lean();

      const balance = await this.balanceModel.findOne({ tenantId, ingredientId: ing._id });
      const currentStock = balance?.onHand ?? 0;

      const adjustmentRecords: StockAdjustmentRecord[] = adjustments.map((adj) => ({
        id: adj._id.toString(),
        ingredientId: ing._id.toString(),
        ingredientName: ing.name,
        date: new Date(adj.occurredAt || Date.now()).toISOString().slice(0, 10),
        quantityChange: adj.quantityDelta < 0 ? adj.quantityDelta : -Math.abs(adj.quantityDelta),
        type: adj.type,
        reason: adj.reason || 'UNEXPLAINED',
        currentStock,
      }));

      const shrinkageAnomalies = AnomalyDetector.detectShrinkageAnomalies(adjustmentRecords, 10);
      detectedReports.push(...shrinkageAnomalies);

      // 3. Ledger integrity checks
      const movements = await this.movementModel.find({ tenantId, ingredientId: ing._id }).lean();
      let ledgerSum = 0;
      for (const m of movements) {
        ledgerSum += m.quantityDelta;
      }

      const ledgerChecks: LedgerMismatchCheck[] = [
        {
          ingredientId: ing._id.toString(),
          ingredientName: ing.name,
          date: new Date().toISOString().slice(0, 10),
          expectedBalanceFromLedger: ledgerSum,
          actualCurrentStock: currentStock,
          unit: ing.baseUnit,
        },
      ];

      const ledgerAnomalies = AnomalyDetector.detectLedgerMismatches(ledgerChecks);
      detectedReports.push(...ledgerAnomalies);
    }

    // Persist new anomalies to MongoDB with deduplication fingerprint
    for (const report of detectedReports) {
      const fingerprint = `${report.ingredientId}_${report.anomalyType}_${report.date}`;
      const existing = await this.anomalyModel.findOne({ tenantId, fingerprint });
      if (!existing) {
        let typeEnum = 'CONSUMPTION_SPIKE';
        if (report.anomalyType === 'UNEXPLAINED_SHRINKAGE') typeEnum = 'UNUSUAL_ADJUSTMENT';
        else if (report.anomalyType === 'LEDGER_MISMATCH') typeEnum = 'LEDGER_DISCREPANCY';

        await this.anomalyModel.create({
          tenantId,
          ingredientId: new Types.ObjectId(report.ingredientId),
          type: typeEnum,
          severity: report.severity.toLowerCase(),
          observedAt: new Date(report.date),
          evidence: {
            observedValue: report.observedValue,
            expectedBaseline: report.expectedValue,
            deviationPercentage: report.deviationScore,
            explanation: report.explanation,
          },
          status: 'open',
          fingerprint,
        });
      }
    }

    return detectedReports;
  }

  /**
   * Lists anomalies for the active tenant
   */
  async listAnomalies(tenantIdStr: string, status?: string) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const filter: any = { tenantId };
    if (status) {
      filter.status = status;
    }
    return this.anomalyModel
      .find(filter)
      .populate('ingredientId', 'name sku baseUnit')
      .sort({ observedAt: -1 })
      .lean();
  }

  /**
   * Resolves or acknowledges an anomaly alert
   */
  async updateAnomalyStatus(
    tenantIdStr: string,
    anomalyId: string,
    status: 'acknowledged' | 'resolved' | 'false_positive',
    resolutionNotes?: string,
  ) {
    const tenantId = new Types.ObjectId(tenantIdStr);
    const anomaly = await this.anomalyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(anomalyId), tenantId },
      {
        $set: {
          status,
          ...(resolutionNotes && { resolutionNotes }),
          updatedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!anomaly) {
      throw new NotFoundException(`Anomaly ${anomalyId} not found`);
    }
    return anomaly;
  }
}
