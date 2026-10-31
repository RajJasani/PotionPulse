import { TimeSeriesPoint, AnomalyReport, SeasonalEventWindow } from '../types';

export interface AnomalyDetectionOptions {
  zThreshold?: number; // default 3.0
  minVolumeThreshold?: number; // minimum absolute deviation to avoid micro-noise
  historyWindowSize?: number; // rolling window size (default 28 days)
  eventWindows?: SeasonalEventWindow[];
}

export interface StockAdjustmentRecord {
  id: string;
  ingredientId: string;
  ingredientName: string;
  date: string;
  quantityChange: number; // negative for loss/waste
  type: string; // e.g. 'ADJUSTMENT_OUT'
  reason: string; // e.g. 'SPOILED', 'SPILL', 'UNEXPLAINED'
  currentStock: number;
}

export interface LedgerMismatchCheck {
  ingredientId: string;
  ingredientName: string;
  date: string;
  expectedBalanceFromLedger: number;
  actualCurrentStock: number;
  unit: string;
}

export class AnomalyDetector {
  /**
   * Computes the Median of an array of numbers
   */
  public static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const midVal = sorted[mid] ?? 0;
    if (sorted.length % 2 !== 0) {
      return midVal;
    }
    const prevVal = sorted[mid - 1] ?? midVal;
    return (prevVal + midVal) / 2;
  }

  /**
   * Computes Median Absolute Deviation (MAD)
   */
  public static mad(values: number[], med?: number): number {
    if (values.length === 0) return 0;
    const m = med !== undefined ? med : this.median(values);
    const absoluteDeviations = values.map((v) => Math.abs(v - m));
    return this.median(absoluteDeviations);
  }

  /**
   * Detects demand anomalies across a time series using rolling Modified Z-score with MAD
   */
  public static detectDemandAnomalies(
    ingredientId: string,
    ingredientName: string,
    series: TimeSeriesPoint[],
    options: AnomalyDetectionOptions = {}
  ): AnomalyReport[] {
    const {
      zThreshold = 3.0,
      minVolumeThreshold = 5.0,
      historyWindowSize = 28,
      eventWindows = [],
    } = options;

    if (series.length < 7) {
      return []; // Insufficient history to establish baseline distribution
    }

    const anomalies: AnomalyReport[] = [];

    for (let i = 7; i < series.length; i++) {
      const currentPoint = series[i];
      if (!currentPoint) continue;

      const windowStart = Math.max(0, i - historyWindowSize);
      const historyWindow = series.slice(windowStart, i).map((p) => p.value);

      const med = this.median(historyWindow);
      const madVal = this.mad(historyWindow, med);

      // Effective scale: 0.6745 * (x - med) / MAD
      // If MAD is very small, use mean absolute deviation or epsilon
      const effectiveScale = madVal > 0 ? madVal / 0.6745 : Math.max(1.0, med * 0.1);
      const deviation = currentPoint.value - med;
      const modifiedZ = deviation / effectiveScale;
      const absZ = Math.abs(modifiedZ);

      // Check if this date falls within a known seasonal surge window (e.g. Midnight Curse)
      const matchingEvent = eventWindows.find(
        (e) => currentPoint.date >= e.startDate && currentPoint.date <= e.endDate
      );

      const isSignificantVolume = Math.abs(deviation) >= minVolumeThreshold;

      if (absZ >= zThreshold && isSignificantVolume) {
        // If it's a known scheduled event surge and matches the direction, it's expected
        if (matchingEvent && deviation > 0) {
          continue; // Suppress false alarm: this surge is expected due to the event!
        }

        const isSpike = deviation > 0;
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        if (absZ >= 5.0) severity = 'CRITICAL';
        else if (absZ >= 4.0) severity = 'HIGH';
        else if (absZ >= 3.5) severity = 'MEDIUM';
        else severity = 'LOW';

        const type = isSpike ? 'DEMAND_SPIKE' : 'DEMAND_DROP';
        const expectedRange = `${Math.max(0, Math.round(med - 2 * effectiveScale))} - ${Math.round(med + 2 * effectiveScale)}`;

        anomalies.push({
          id: `anom_demand_${ingredientId}_${currentPoint.date}`,
          ingredientId,
          ingredientName,
          date: currentPoint.date,
          anomalyType: type,
          severity,
          observedValue: Math.round(currentPoint.value * 10) / 10,
          expectedValue: Math.round(med * 10) / 10,
          deviationScore: Math.round(modifiedZ * 100) / 100,
          mad: Math.round(madVal * 100) / 100,
          isSeasonalEvent: !!matchingEvent,
          explanation: `Observed demand of ${currentPoint.value} on ${currentPoint.date} deviated significantly from rolling median of ${Math.round(med)} (Modified Z-Score: ${modifiedZ.toFixed(2)}, expected range: ${expectedRange}).`,
          recommendedAction: isSpike
            ? 'Review register sales for bulk or abnormal orders. Check for unannounced local potion festivals or high-volume brewing.'
            : 'Investigate potential brew batch failures, competitor activity, or recipe ingredient substitutions.',
        });
      }
    }

    return anomalies;
  }

  /**
   * Detects unexplained shrinkage or severe inventory losses
   */
  public static detectShrinkageAnomalies(
    adjustments: StockAdjustmentRecord[],
    typicalDailyDemand = 10
  ): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];

    for (const adj of adjustments) {
      if (adj.quantityChange < 0) {
        const lossAmount = Math.abs(adj.quantityChange);
        const relativeToDemand = lossAmount / Math.max(1, typicalDailyDemand);
        const relativeToStock = lossAmount / Math.max(1, adj.currentStock + lossAmount);

        if (relativeToDemand >= 2.0 || relativeToStock >= 0.15) {
          let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          if (relativeToStock >= 0.3 || lossAmount >= 50) severity = 'CRITICAL';
          else if (relativeToStock >= 0.2) severity = 'HIGH';
          else severity = 'MEDIUM';

          anomalies.push({
            id: `anom_shrink_${adj.id}`,
            ingredientId: adj.ingredientId,
            ingredientName: adj.ingredientName,
            date: adj.date,
            anomalyType: 'UNEXPLAINED_SHRINKAGE',
            severity,
            observedValue: lossAmount,
            expectedValue: 0,
            deviationScore: Math.round(relativeToDemand * 10) / 10,
            mad: 0,
            isSeasonalEvent: false,
            explanation: `Abnormal inventory loss of ${lossAmount} units recorded (Reason: ${adj.reason || 'Unspecified'}). Loss represents ${Math.round(relativeToStock * 100)}% of stock and ${relativeToDemand.toFixed(1)}x normal daily consumption.`,
            recommendedAction:
              'Initiate physical shelf recount, audit shelf security footage, and inspect storage containment seals.',
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detects discrepancies between the movement ledger sum and active balance
   */
  public static detectLedgerMismatches(checks: LedgerMismatchCheck[]): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];

    for (const check of checks) {
      const discrepancy = Math.abs(check.actualCurrentStock - check.expectedBalanceFromLedger);
      if (discrepancy > 0.01) {
        anomalies.push({
          id: `anom_ledger_${check.ingredientId}_${check.date}`,
          ingredientId: check.ingredientId,
          ingredientName: check.ingredientName,
          date: check.date,
          anomalyType: 'LEDGER_MISMATCH',
          severity: discrepancy >= 10 ? 'CRITICAL' : 'HIGH',
          observedValue: check.actualCurrentStock,
          expectedValue: check.expectedBalanceFromLedger,
          deviationScore: Math.round(discrepancy * 10) / 10,
          mad: 0,
          isSeasonalEvent: false,
          explanation: `Integrity check failed: Current inventory balance (${check.actualCurrentStock} ${check.unit}) does not match ledger movements sum (${check.expectedBalanceFromLedger} ${check.unit}). Discrepancy: ${discrepancy.toFixed(2)} ${check.unit}.`,
          recommendedAction:
            'Execute ledger reconciliation audit and verify uncommitted or concurrent stock movement records.',
        });
      }
    }

    return anomalies;
  }
}
