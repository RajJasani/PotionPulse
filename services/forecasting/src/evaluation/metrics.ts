import { EvaluationMetrics } from '../types';

export class EvaluationEngine {
  private static readonly EPSILON = 1e-6;

  public static computeMetrics(actuals: number[], predictions: number[]): EvaluationMetrics {
    if (actuals.length !== predictions.length || actuals.length === 0) {
      return {
        mae: 0,
        rmse: 0,
        wape: 0,
        bias: 0,
        meanActual: 0,
        meanPredicted: 0,
        sampleCount: 0,
      };
    }

    const n = actuals.length;
    let sumAbsError = 0;
    let sumSqError = 0;
    let sumActual = 0;
    let sumPredicted = 0;
    let sumSignedError = 0;

    for (let i = 0; i < n; i++) {
      const a = actuals[i] ?? 0;
      const p = predictions[i] ?? 0;
      const diff = p - a;
      const absDiff = Math.abs(diff);

      sumAbsError += absDiff;
      sumSqError += diff * diff;
      sumActual += a;
      sumPredicted += p;
      sumSignedError += diff;
    }

    const mae = sumAbsError / n;
    const rmse = Math.sqrt(sumSqError / n);
    const denominator = Math.max(sumActual, this.EPSILON);
    const wape = (sumAbsError / denominator) * 100;
    const bias = (sumSignedError / denominator) * 100;

    return {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      wape: Math.round(wape * 100) / 100,
      bias: Math.round(bias * 100) / 100,
      meanActual: Math.round((sumActual / n) * 100) / 100,
      meanPredicted: Math.round((sumPredicted / n) * 100) / 100,
      sampleCount: n,
    };
  }
}
