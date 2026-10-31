import { Forecaster, applyEventMultiplier, computeIntervalBounds } from './base';
import { TimeSeriesPoint, ForecastPoint, SeasonalEventWindow } from '../types';

export class SeasonalNaiveModel implements Forecaster {
  public readonly name = 'SeasonalNaive_Weekly';
  private series: TimeSeriesPoint[] = [];
  private period: number;
  private residuals: number[] = [];
  private residualStdev = 1.0;

  constructor(period = 7) {
    this.period = period;
  }

  public fit(series: TimeSeriesPoint[]): void {
    this.series = series;
    if (series.length <= this.period) {
      this.residuals = [0];
      this.residualStdev = 1.0;
      return;
    }

    this.residuals = [];
    for (let i = this.period; i < series.length; i++) {
      const pred = series[i - this.period]?.value ?? 0;
      const actual = series[i]?.value ?? 0;
      this.residuals.push(actual - pred);
    }

    if (this.residuals.length > 0) {
      const sumSq = this.residuals.reduce((acc, r) => acc + r * r, 0);
      this.residualStdev = Math.sqrt(sumSq / Math.max(1, this.residuals.length));
    } else {
      this.residualStdev = 1.0;
    }
  }

  public predict(horizonDays: number, eventWindows: SeasonalEventWindow[] = []): ForecastPoint[] {
    if (this.series.length === 0) return [];

    const n = this.series.length;
    const lastPt = this.series[n - 1];
    const lastDate = lastPt ? new Date(lastPt.date + 'T00:00:00Z') : new Date();
    const forecast: ForecastPoint[] = [];

    for (let h = 1; h <= horizonDays; h++) {
      const targetDate = new Date(lastDate.getTime() + h * 86400000);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const lagOffset = ((h - 1) % this.period) + 1;
      const seasonalIndex = n - this.period - 1 + lagOffset;
      const rawLagValue = seasonalIndex >= 0 && seasonalIndex < n
        ? (this.series[seasonalIndex]?.value ?? lastPt?.value ?? 0)
        : (lastPt?.value ?? 0);

      const { value: adjustedVal, multiplier } = applyEventMultiplier(rawLagValue, dateStr, eventWindows);
      const { lowerBound, upperBound } = computeIntervalBounds(adjustedVal, this.residualStdev * Math.sqrt(Math.ceil(h / this.period)));

      forecast.push({
        date: dateStr,
        predictedDemand: Math.round(adjustedVal * 10) / 10,
        lowerBound,
        upperBound,
        confidenceLevel: 0.9,
        eventMultiplierApplied: multiplier,
      });
    }

    return forecast;
  }

  public getResiduals(): number[] {
    return this.residuals;
  }

  public getResidualStdev(): number {
    return this.residualStdev;
  }
}
