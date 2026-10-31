import { EvaluationEngine } from '../src/evaluation/metrics';
import { RollingOriginBacktester } from '../src/evaluation/backtester';
import { TimeSeriesPoint } from '../src/types';

describe('Evaluation & Rolling-Origin Backtester Suite', () => {
  it('EvaluationEngine should calculate exact MAE, RMSE, WAPE and Forecast Bias', () => {
    const actuals = [10, 20, 30, 40];
    const preds = [12, 18, 33, 45];
    // Errors: +2, -2, +3, +5.
    // Sum Abs Error: 2 + 2 + 3 + 5 = 12. MAE = 12 / 4 = 3.0.
    // Sum Sq Error: 4 + 4 + 9 + 25 = 42. RMSE = sqrt(42/4) = sqrt(10.5) = 3.24.
    // Sum Actual: 10 + 20 + 30 + 40 = 100.
    // WAPE = (12 / 100) * 100 = 12.0%.
    // Sum Signed Error: 2 - 2 + 3 + 5 = +8. Bias = (8 / 100) * 100 = +8.0%.

    const metrics = EvaluationEngine.computeMetrics(actuals, preds);
    expect(metrics.mae).toBe(3.0);
    expect(metrics.rmse).toBe(3.24);
    expect(metrics.wape).toBe(12.0);
    expect(metrics.bias).toBe(8.0);
    expect(metrics.sampleCount).toBe(4);
  });

  it('RollingOriginBacktester should evaluate models over expanding temporal window without data leakage', () => {
    const start = new Date('2026-07-01T00:00:00Z');
    const series: TimeSeriesPoint[] = Array.from({ length: 60 }).map((_, i) => ({
      date: new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10),
      timestamp: start.getTime() + i * 86400000,
      value: 20 + (i % 7) * 3, // Seasonality
    }));

    const result = RollingOriginBacktester.runBacktest('ing_test', 'Test Ingredient', series, {
      minTrainSize: 28,
      horizonDays: 7,
      stepSize: 1,
    });

    expect(result.models.length).toBeGreaterThanOrEqual(4);
    expect(result.recommendedModel).toBeDefined();

    const bestModel = result.models.find((m) => m.isBest);
    expect(bestModel).toBeDefined();
    expect(bestModel?.metrics.wape).toBeGreaterThanOrEqual(0);
    expect(bestModel?.metrics.sampleCount).toBeGreaterThan(100);
  });
});
