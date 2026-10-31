import { TimeSeriesPoint } from '../types';

export interface PreprocessingOptions {
  fillMissingDates?: boolean;
  missingDateStrategy?: 'zero' | 'forward_fill' | 'linear';
  aggregateDuplicates?: boolean;
  enforceNonNegative?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PreprocessedSeries {
  points: TimeSeriesPoint[];
  metadata: {
    originalCount: number;
    cleanedCount: number;
    duplicatesAggregated: number;
    missingDatesFilled: number;
    negativeValuesClamped: number;
    startDate: string;
    endDate: string;
  };
}

export class DataPreprocessor {
  /**
   * Preprocesses raw sales/consumption time series:
   * 1. Validates and normalizes dates to 'YYYY-MM-DD'.
   * 2. Detects and aggregates intra-day duplicate observations (summing quantities).
   * 3. Sorts chronologically.
   * 4. Fills missing calendar dates with true zeros or forward-fill.
   * 5. Enforces non-negative demand values.
   */
  public static preprocess(
    rawPoints: Array<{ date: string | Date | number; value: number; [key: string]: any }>,
    options: PreprocessingOptions = {}
  ): PreprocessedSeries {
    const {
      fillMissingDates = true,
      missingDateStrategy = 'zero',
      aggregateDuplicates = true,
      enforceNonNegative = true,
    } = options;

    if (!rawPoints || rawPoints.length === 0) {
      return {
        points: [],
        metadata: {
          originalCount: 0,
          cleanedCount: 0,
          duplicatesAggregated: 0,
          missingDatesFilled: 0,
          negativeValuesClamped: 0,
          startDate: '',
          endDate: '',
        },
      };
    }

    let negativeValuesClamped = 0;
    let duplicatesAggregated = 0;

    // Step 1: Normalize timestamp and date format
    const normalized: Array<{ dateStr: string; timestamp: number; value: number; raw: any }> = [];

    for (const pt of rawPoints) {
      let d: Date;
      if (typeof pt.date === 'string') {
        d = pt.date.includes('T') ? new Date(pt.date) : new Date(pt.date + 'T00:00:00Z');
      } else if (typeof pt.date === 'number') {
        d = new Date(pt.date);
      } else {
        d = pt.date;
      }

      if (isNaN(d.getTime())) {
        continue;
      }

      const dateStr = d.toISOString().slice(0, 10);
      let val = Number(pt.value);
      if (isNaN(val)) val = 0;

      if (enforceNonNegative && val < 0) {
        val = 0;
        negativeValuesClamped++;
      }

      normalized.push({
        dateStr,
        timestamp: new Date(dateStr + 'T00:00:00Z').getTime(),
        value: val,
        raw: pt,
      });
    }

    // Step 2: Sort chronologically
    normalized.sort((a, b) => a.timestamp - b.timestamp);

    // Step 3: Handle duplicates on the same date
    const dateMap = new Map<string, { timestamp: number; value: number; count: number; metadata: any }>();

    for (const item of normalized) {
      if (dateMap.has(item.dateStr)) {
        duplicatesAggregated++;
        const existing = dateMap.get(item.dateStr)!;
        if (aggregateDuplicates) {
          existing.value += item.value;
          existing.count += 1;
        } else {
          existing.value = item.value;
        }
      } else {
        dateMap.set(item.dateStr, {
          timestamp: item.timestamp,
          value: item.value,
          count: 1,
          metadata: item.raw.metadata || {},
        });
      }
    }

    const uniqueDates = Array.from(dateMap.keys()).sort();
    if (uniqueDates.length === 0) {
      return {
        points: [],
        metadata: {
          originalCount: rawPoints.length,
          cleanedCount: 0,
          duplicatesAggregated,
          missingDatesFilled: 0,
          negativeValuesClamped,
          startDate: '',
          endDate: '',
        },
      };
    }

    const startStr = options.startDate || uniqueDates[0] || '';
    const endStr = options.endDate || uniqueDates[uniqueDates.length - 1] || '';
    const startTime = new Date(startStr + 'T00:00:00Z').getTime();
    const endTime = new Date(endStr + 'T00:00:00Z').getTime();

    const resultPoints: TimeSeriesPoint[] = [];
    let missingDatesFilled = 0;
    let lastKnownValue = 0;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    for (let t = startTime; t <= endTime; t += ONE_DAY_MS) {
      const currentD = new Date(t);
      const dateStr = currentD.toISOString().slice(0, 10);

      if (dateMap.has(dateStr)) {
        const item = dateMap.get(dateStr)!;
        lastKnownValue = item.value;
        resultPoints.push({
          date: dateStr,
          timestamp: t,
          value: item.value,
          metadata: {
            isImputed: false,
            sourceTransactionsCount: item.count,
            ...item.metadata,
          },
        });
      } else if (fillMissingDates) {
        missingDatesFilled++;
        let imputedVal = 0;
        if (missingDateStrategy === 'forward_fill') {
          imputedVal = lastKnownValue;
        } else if (missingDateStrategy === 'zero') {
          imputedVal = 0;
        }

        resultPoints.push({
          date: dateStr,
          timestamp: t,
          value: imputedVal,
          metadata: {
            isImputed: true,
            imputationStrategy: missingDateStrategy,
          },
        });
      }
    }

    return {
      points: resultPoints,
      metadata: {
        originalCount: rawPoints.length,
        cleanedCount: resultPoints.length,
        duplicatesAggregated,
        missingDatesFilled,
        negativeValuesClamped,
        startDate: startStr,
        endDate: endStr,
      },
    };
  }

  /**
   * Calculates rolling summary statistics
   */
  public static calculateSummary(points: TimeSeriesPoint[]) {
    if (!points || points.length === 0) {
      return { count: 0, mean: 0, stdev: 0, min: 0, max: 0 };
    }
    const values = points.map((p) => p.value);
    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / Math.max(1, count - 1);
    const stdev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count, mean, stdev, min, max };
  }
}
