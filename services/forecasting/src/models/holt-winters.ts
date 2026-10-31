import { Forecaster, applyEventMultiplier, computeIntervalBounds } from './base';
import { TimeSeriesPoint, ForecastPoint, SeasonalEventWindow } from '../types';

export class HoltWintersModel implements Forecaster {
  public readonly name = 'HoltWinters_Additive';
  private series: TimeSeriesPoint[] = [];
  private period: number;
  private alpha: number;
  private beta: number;
  private gamma: number;

  private finalLevel = 0;
  private finalTrend = 0;
  private seasonals: number[] = [];
  private residuals: number[] = [];
  private residualStdev = 1.0;

  constructor(period = 7, alpha = 0.25, beta = 0.05, gamma = 0.3) {
    this.period = period;
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
  }

  public fit(series: TimeSeriesPoint[]): void {
    this.series = series;
    const m = this.period;
    const n = series.length;

    if (n < m * 2) {
      // Not enough data for full seasonal cycle fitting, fallback to simple mean
      const mean = n > 0 ? series.reduce((acc, p) => acc + p.value, 0) / n : 0;
      this.finalLevel = mean;
      this.finalTrend = 0;
      this.seasonals = new Array(m).fill(0);
      this.residuals = [0];
      this.residualStdev = 1.0;
      return;
    }

    // Step 1: Initial level L0 = mean of first period
    let sumFirstPeriod = 0;
    for (let i = 0; i < m; i++) {
      sumFirstPeriod += series[i]?.value ?? 0;
    }
    let level = sumFirstPeriod / m;

    // Step 2: Initial trend T0
    let trend = 0;
    for (let i = 0; i < m; i++) {
      const valNext = series[i + m]?.value ?? 0;
      const valCur = series[i]?.value ?? 0;
      trend += (valNext - valCur) / m;
    }
    trend /= m;

    // Step 3: Initial seasonal components
    const S: number[] = new Array(n + m).fill(0);
    for (let i = 0; i < m; i++) {
      S[i] = (series[i]?.value ?? 0) - level;
    }

    this.residuals = [];

    // Step 4: Recursive smoothing
    for (let t = 0; t < n; t++) {
      const actual = series[t]?.value ?? 0;
      const seasonalIndex = t;
      const prevSeasonal = S[seasonalIndex] ?? 0;

      const pred = Math.max(0, level + trend + prevSeasonal);
      this.residuals.push(actual - pred);

      const prevLevel = level;
      level = this.alpha * (actual - prevSeasonal) + (1 - this.alpha) * (prevLevel + trend);
      trend = this.beta * (level - prevLevel) + (1 - this.beta) * trend;
      S[t + m] = this.gamma * (actual - level) + (1 - this.gamma) * prevSeasonal;
    }

    this.finalLevel = level;
    this.finalTrend = trend;
    this.seasonals = S.slice(n, n + m);

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
    const m = this.period;

    for (let h = 1; h <= horizonDays; h++) {
      const targetDate = new Date(lastDate.getTime() + h * 86400000);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const seasonalOffset = (h - 1) % m;
      const sVal = this.seasonals[seasonalOffset] ?? 0;
      const baselineValue = Math.max(0, this.finalLevel + h * this.finalTrend + sVal);

      const { value: adjustedVal, multiplier } = applyEventMultiplier(baselineValue, dateStr, eventWindows);
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
