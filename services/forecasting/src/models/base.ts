import { TimeSeriesPoint, ForecastPoint, SeasonalEventWindow } from '../types';

export interface Forecaster {
  readonly name: string;
  fit(series: TimeSeriesPoint[]): void;
  predict(horizonDays: number, eventWindows?: SeasonalEventWindow[]): ForecastPoint[];
  getResiduals(): number[];
  getResidualStdev(): number;
}

export function applyEventMultiplier(
  baseValue: number,
  dateStr: string,
  eventWindows: SeasonalEventWindow[] = [],
  ingredientId?: string,
): { value: number; multiplier: number } {
  let multiplier = 1.0;
  for (const window of eventWindows) {
    if (dateStr >= window.startDate && dateStr <= window.endDate) {
      if (
        !ingredientId ||
        !window.affectedIngredientIds ||
        window.affectedIngredientIds.length === 0 ||
        window.affectedIngredientIds.includes(ingredientId)
      ) {
        multiplier *= window.multiplier;
      }
    }
  }
  return {
    value: Math.max(0, baseValue * multiplier),
    multiplier,
  };
}

export function computeIntervalBounds(
  pointValue: number,
  stdev: number,
  zScore = 1.645 // 90% confidence interval default
): { lowerBound: number; upperBound: number } {
  const margin = zScore * stdev;
  return {
    lowerBound: Math.max(0, Math.round((pointValue - margin) * 10) / 10),
    upperBound: Math.round((pointValue + margin) * 10) / 10,
  };
}

