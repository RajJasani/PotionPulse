import { AnomalyDetector } from '../src/anomalies/anomaly-detector';
import { TimeSeriesPoint, SeasonalEventWindow } from '../src/types';

describe('Anomaly Detector Suite', () => {
  it('should compute exact Median and Median Absolute Deviation (MAD)', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Median is 5
    expect(AnomalyDetector.median(data)).toBe(5);

    // Deviations: 4, 3, 2, 1, 0, 1, 2, 3, 4
    // Sorted deviations: 0, 1, 1, 2, 2, 3, 3, 4, 4
    // Median deviation is 2
    expect(AnomalyDetector.mad(data)).toBe(2);
  });

  it('should detect extreme demand spike (true positive) with high modified Z-score', () => {
    const start = new Date('2026-09-01T00:00:00Z');
    const series: TimeSeriesPoint[] = Array.from({ length: 30 }).map((_, i) => ({
      date: new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10),
      timestamp: start.getTime() + i * 86400000,
      value: i === 25 ? 120 : 25 + (i % 3), // Normal: 25-27, Day 25: 120
    }));

    const anomalies = AnomalyDetector.detectDemandAnomalies('distilled_aether', 'Distilled Aether', series);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.anomalyType).toBe('DEMAND_SPIKE');
    expect(anomalies[0]?.observedValue).toBe(120);
    expect(anomalies[0]?.severity).toBe('CRITICAL');
    expect(anomalies[0]?.deviationScore).toBeGreaterThan(10);
  });

  it('should suppress false-positive spike alerts during known scheduled seasonal events (Midnight Curse)', () => {
    const start = new Date('2026-10-01T00:00:00Z');
    const surgeDate = '2026-10-20';

    const series: TimeSeriesPoint[] = Array.from({ length: 25 }).map((_, i) => {
      const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
      return {
        date: d,
        timestamp: start.getTime() + i * 86400000,
        value: d === surgeDate ? 90 : 30, // 3x surge on scheduled day
      };
    });

    const eventWindow: SeasonalEventWindow = {
      id: 'curse',
      name: 'Midnight Curse',
      startDate: '2026-10-19',
      endDate: '2026-10-21',
      multiplier: 3.0,
    };

    const anomalies = AnomalyDetector.detectDemandAnomalies('bat_wings', 'Bat Wings', series, {
      eventWindows: [eventWindow],
    });

    // Surge date 2026-10-20 is protected by event window, so no anomaly should be raised
    expect(anomalies.find((a) => a.date === surgeDate)).toBeUndefined();
  });

  it('should detect abnormal inventory shrinkage and waste', () => {
    const adjustments = [
      {
        id: 'adj_1',
        ingredientId: 'ghost_pepper',
        ingredientName: 'Ghost Pepper',
        date: '2026-10-15',
        quantityChange: -35, // Loss of 35g
        type: 'ADJUSTMENT_OUT',
        reason: 'UNEXPLAINED_STORAGE_SPILL',
        currentStock: 40,
      },
    ];

    const anomalies = AnomalyDetector.detectShrinkageAnomalies(adjustments, 10);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.anomalyType).toBe('UNEXPLAINED_SHRINKAGE');
    expect(anomalies[0]?.observedValue).toBe(35);
    expect(anomalies[0]?.severity).toBe('CRITICAL');
    expect(anomalies[0]?.explanation).toContain('Abnormal inventory loss');
  });

  it('should detect discrepancies between ledger and physical balance', () => {
    const checks = [
      {
        ingredientId: 'dragon_scale',
        ingredientName: 'Dragon Scale',
        date: '2026-10-31',
        expectedBalanceFromLedger: 25,
        actualCurrentStock: 18,
        unit: 'scales',
      },
    ];

    const mismatches = AnomalyDetector.detectLedgerMismatches(checks);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]?.anomalyType).toBe('LEDGER_MISMATCH');
    expect(mismatches[0]?.deviationScore).toBe(7); // 25 - 18
  });
});
