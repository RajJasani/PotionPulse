import { TimeSeriesPoint, ForecastResult, SeasonalEventWindow } from '../types';
import { Forecaster } from './base';
import { SimpleMovingAverageModel, EWMAModel } from './moving-average';
import { SeasonalNaiveModel } from './seasonal-naive';
import { HoltWintersModel } from './holt-winters';
import { RollingOriginBacktester } from '../evaluation/backtester';

export class AdaptiveForecastSelector {
  /**
   * Automatically selects the highest performing forecasting model for a given ingredient
   * using chronological rolling-origin validation, or falls back to robust defaults for cold-start.
   */
  public static generateForecast(
    ingredientId: string,
    ingredientName: string,
    series: TimeSeriesPoint[],
    horizonDays = 14,
    eventWindows: SeasonalEventWindow[] = []
  ): ForecastResult {
    const n = series.length;
    const methodologyNotes: string[] = [];

    let chosenForecaster: Forecaster;
    let selectedModelName = '';

    // Cold-start handling rule
    if (n < 7) {
      methodologyNotes.push(`Cold start: insufficient history (${n} points < 7). Using 3-day simple moving average fallback.`);
      chosenForecaster = new SimpleMovingAverageModel(Math.max(1, n));
      selectedModelName = 'SimpleMovingAverage_FallbackColdStart';
    } else if (n < 14) {
      methodologyNotes.push(`Moderate history (${n} points). Using Exponential Smoothing (EWMA) with alpha=0.3.`);
      chosenForecaster = new EWMAModel(0.3);
      selectedModelName = 'ExponentialSmoothing_EWMA';
    } else {
      // Sufficient history: evaluate models via rolling-origin backtesting
      const backtest = RollingOriginBacktester.runBacktest(ingredientId, ingredientName, series, {
        minTrainSize: Math.min(28, Math.floor(n * 0.6)),
        horizonDays: Math.min(horizonDays, 7),
        stepSize: 1,
      });

      selectedModelName = backtest.recommendedModel;
      const bestModelMetrics = backtest.models.find((m) => m.modelName === selectedModelName)?.metrics;

      methodologyNotes.push(
        `Selected ${selectedModelName} via rolling-origin backtest against ${backtest.models.length} candidate models.`
      );
      if (bestModelMetrics) {
        methodologyNotes.push(
          `Backtest out-of-sample performance: WAPE = ${bestModelMetrics.wape.toFixed(1)}%, Bias = ${bestModelMetrics.bias.toFixed(1)}%, RMSE = ${bestModelMetrics.rmse.toFixed(2)}.`
        );
      }

      switch (selectedModelName) {
        case 'HoltWinters_Additive':
          chosenForecaster = new HoltWintersModel(7);
          break;
        case 'SeasonalNaive_Weekly':
          chosenForecaster = new SeasonalNaiveModel(7);
          break;
        case 'ExponentialSmoothing_EWMA':
          chosenForecaster = new EWMAModel(0.3);
          break;
        default:
          chosenForecaster = new SimpleMovingAverageModel(7);
          break;
      }
    }

    // Fit model on full available historical points
    chosenForecaster.fit(series);
    const forecastPoints = chosenForecaster.predict(horizonDays, eventWindows);

    if (eventWindows.length > 0) {
      const activeSurges = eventWindows.map((e) => `${e.name} (${e.multiplier}x from ${e.startDate} to ${e.endDate})`).join(', ');
      methodologyNotes.push(`Applied seasonal event adjustments: ${activeSurges}.`);
    }

    return {
      ingredientId,
      ingredientName,
      modelUsed: selectedModelName,
      horizonDays,
      generatedAt: new Date().toISOString(),
      historicalPointsCount: n,
      forecast: forecastPoints,
      methodologyNotes,
    };
  }
}
