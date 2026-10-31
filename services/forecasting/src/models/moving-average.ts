import { Forecaster, applyEventMultiplier, computeIntervalBounds } from './base';
import { TimeSeriesPoint, ForecastPoint, SeasonalEventWindow } from '../types';

export class SimpleMovingAverageModel implements Forecaster {
  public readonly name = 'SimpleMovingAverage';
  public readonly windowSize: number;
  private series: TimeSeriesPoint[] = [];
  private residuals: number[] = [];
  private residualStdev = 1.0;

  constructor(windowSize = 7) {
    this.windowSize = windowSize;
  }

  public fit(series: TimeSeriesPoint[]): void {
    this.series = series;
    if (series.length < 2) {
      this.residuals = [0];
      this.residualStdev = 1.0;
      return;
    }

    const effectiveWindow = Math.min(this.windowSize, series.length);
    this.residuals = [];

    for (let i = effectiveWindow; i < series.length; i++) {
      let sum = 0;
      for (let j = i - effectiveWindow; j < i; j++) {
        const pt = series[j];
        if (pt) sum += pt.value;
      }
      const pred = sum / effectiveWindow;
      const cur = series[i];
      if (cur) {
        this.residuals.push(cur.value - pred);
      }
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

    const effectiveWindow = Math.min(this.windowSize, this.series.length);
    const recentValues = this.series.slice(-effectiveWindow).map((p) => p.value);
    const baselinePrediction = recentValues.reduce((a, b) => a + b, 0) / effectiveWindow;

    const lastPt = this.series[this.series.length - 1];
    const lastDate = lastPt ? new Date(lastPt.date + 'T00:00:00Z') : new Date();
    const forecast: ForecastPoint[] = [];

    for (let h = 1; h <= horizonDays; h++) {
      const targetDate = new Date(lastDate.getTime() + h * 86400000);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const { value: adjustedVal, multiplier } = applyEventMultiplier(baselinePrediction, dateStr, eventWindows);
      const { lowerBound, upperBound } = computeIntervalBounds(adjustedVal, this.residualStdev * Math.sqrt(h));

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

export class EWMAModel implements Forecaster {
  public readonly name = 'ExponentialSmoothing_EWMA';
  private series: TimeSeriesPoint[] = [];
  private alpha: number;
  private lastLevel = 0;
  private residuals: number[] = [];
  private residualStdev = 1.0;

  constructor(alpha = 0.3) {
    this.alpha = alpha;
  }

  public fit(series: TimeSeriesPoint[]): void {
    this.series = series;
    if (series.length === 0) return;

    let level = series[0]?.value ?? 0;
    this.residuals = [];

    for (let i = 1; i < series.length; i++) {
      const cur = series[i];
      if (!cur) continue;
      const actual = cur.value;
      const pred = level;
      this.residuals.push(actual - pred);
      level = this.alpha * actual + (1 - this.alpha) * level;
    }

    this.lastLevel = level;

    if (this.residuals.length > 0) {
      const sumSq = this.residuals.reduce((acc, r) => acc + r * r, 0);
      this.residualStdev = Math.sqrt(sumSq / Math.max(1, this.residuals.length));
    } else {
      this.residualStdev = 1.0;
    }
  }

  public predict(horizonDays: number, eventWindows: SeasonalEventWindow[] = []): ForecastPoint[] {
    if (this.series.length === 0) return [];

    const lastPt = this.series[this.series.length - 1];
    const lastDate = lastPt ? new Date(lastPt.date + 'T00:00:00Z') : new Date();
    const forecast: ForecastPoint[] = [];

    for (let h = 1; h <= horizonDays; h++) {
      const targetDate = new Date(lastDate.getTime() + h * 86400000);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const { value: adjustedVal, multiplier } = applyEventMultiplier(this.lastLevel, dateStr, eventWindows);
      const { lowerBound, upperBound } = computeIntervalBounds(adjustedVal, this.residualStdev * Math.sqrt(h));

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
