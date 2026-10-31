import { TimeSeriesPoint, BacktestResult, ModelComparisonResult } from '../types';
import { Forecaster } from '../models/base';
import { SimpleMovingAverageModel, EWMAModel } from '../models/moving-average';
import { SeasonalNaiveModel } from '../models/seasonal-naive';
import { HoltWintersModel } from '../models/holt-winters';
import { EvaluationEngine } from './metrics';

export interface BacktestOptions {
  minTrainSize?: number;
  horizonDays?: number;
  stepSize?: number;
  models?: Forecaster[];
}

export class RollingOriginBacktester {
  public static runBacktest(
    ingredientId: string,
    ingredientName: string,
    series: TimeSeriesPoint[],
    options: BacktestOptions = {}
  ): BacktestResult {
    const defaultModels: Forecaster[] = [
      new SeasonalNaiveModel(7),
      new SimpleMovingAverageModel(7),
      new SimpleMovingAverageModel(14),
      new EWMAModel(0.3),
      new HoltWintersModel(7),
    ];

    const {
      minTrainSize = 28,
      horizonDays = 7,
      stepSize = 1,
      models = defaultModels,
    } = options;

    const n = series.length;
    // Check if there are enough points for rolling validation
    if (n < minTrainSize + horizonDays) {
      // Fallback for short series: simple split or empty
      return {
        ingredientId,
        ingredientName,
        validationMethod: 'rolling-origin',
        trainingWindowSize: minTrainSize,
        testHorizon: horizonDays,
        models: [
          {
            modelName: 'SeasonalNaive_Weekly',
            metrics: {
              mae: 0,
              rmse: 0,
              wape: 0,
              bias: 0,
              meanActual: 0,
              meanPredicted: 0,
              sampleCount: 0,
            },
            isBest: true,
          },
        ],
        recommendedModel: 'SeasonalNaive_Weekly',
      };
    }

    // Accumulators for each model: modelName -> { actuals: number[], preds: number[] }
    const modelResults = new Map<string, { actuals: number[]; preds: number[] }>();
    for (const m of models) {
      modelResults.set(m.name, { actuals: [], preds: [] });
    }

    // Rolling-origin loop
    for (let origin = minTrainSize; origin + horizonDays <= n; origin += stepSize) {
      const trainSeries = series.slice(0, origin);
      const testSeries = series.slice(origin, origin + horizonDays);
      const testActuals = testSeries.map((p) => p.value);

      for (const model of models) {
        // Clone or create fresh model instance
        const modelInstance = this.instantiateModel(model);
        modelInstance.fit(trainSeries);
        const forecast = modelInstance.predict(horizonDays);
        const preds = forecast.map((f) => f.predictedDemand);

        const record = modelResults.get(model.name)!;
        for (let i = 0; i < horizonDays; i++) {
          const act = testActuals[i];
          const prd = preds[i];
          if (act !== undefined && prd !== undefined) {
            record.actuals.push(act);
            record.preds.push(prd);
          }
        }
      }
    }

    // Compute metrics
    const comparisonResults: ModelComparisonResult[] = [];
    let lowestWape = Number.MAX_VALUE;
    let bestModelName = models[0]?.name ?? 'SeasonalNaive_Weekly';

    for (const model of models) {
      const record = modelResults.get(model.name)!;
      const metrics = EvaluationEngine.computeMetrics(record.actuals, record.preds);

      comparisonResults.push({
        modelName: model.name,
        metrics,
        isBest: false,
      });

      if (metrics.wape < lowestWape) {
        lowestWape = metrics.wape;
        bestModelName = model.name;
      }
    }

    // Mark isBest
    for (const comp of comparisonResults) {
      if (comp.modelName === bestModelName) {
        comp.isBest = true;
      }
    }

    return {
      ingredientId,
      ingredientName,
      validationMethod: 'rolling-origin',
      trainingWindowSize: minTrainSize,
      testHorizon: horizonDays,
      models: comparisonResults,
      recommendedModel: bestModelName,
    };
  }

  private static instantiateModel(model: Forecaster): Forecaster {
    if (model instanceof SimpleMovingAverageModel) {
      // @ts-ignore
      return new SimpleMovingAverageModel(model.windowSize || 7);
    }
    if (model instanceof EWMAModel) {
      return new EWMAModel(0.3);
    }
    if (model instanceof SeasonalNaiveModel) {
      return new SeasonalNaiveModel(7);
    }
    if (model instanceof HoltWintersModel) {
      return new HoltWintersModel(7);
    }
    return new SimpleMovingAverageModel(7);
  }
}
