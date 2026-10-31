import { SimpleMovingAverageModel, EWMAModel } from '../src/models/moving-average';
import { SeasonalNaiveModel } from '../src/models/seasonal-naive';
import { HoltWintersModel } from '../src/models/holt-winters';
import { AdaptiveForecastSelector } from '../src/models/adaptive-selector';
import { TimeSeriesPoint, SeasonalEventWindow } from '../src/types';

describe('Forecasting Models Suite', () => {
  const generateSeries = (n: number, pattern: (i: number) => number): TimeSeriesPoint[] => {
    const start = new Date('2026-09-01T00:00:00Z');
    return Array.from({ length: n }).map((_, i) => {
      const d = new Date(start.getTime() + i * 86400000);
      return {
        date: d.toISOString().slice(0, 10),
        timestamp: d.getTime(),
        value: pattern(i),
      };
    });
  };

  it('SimpleMovingAverageModel should compute moving window average and prediction bounds', () => {
    const series = generateSeries(14, () => 20); // Constant 20
    const model = new SimpleMovingAverageModel(7);
    model.fit(series);

    const forecast = model.predict(7);
    expect(forecast).toHaveLength(7);
    expect(forecast[0]?.predictedDemand).toBe(20);
    expect(forecast[0]?.lowerBound).toBeLessThanOrEqual(20);
    expect(forecast[0]?.upperBound).toBeGreaterThanOrEqual(20);
  });

  it('EWMAModel should smoothly track series level', () => {
    const series = generateSeries(14, (i) => 10 + i * 2);
    const model = new EWMAModel(0.4);
    model.fit(series);

    const forecast = model.predict(5);
    expect(forecast).toHaveLength(5);
    expect(forecast[0]?.predictedDemand).toBeGreaterThan(20);
  });

  it('SeasonalNaiveModel should forecast values from the identical weekday lag', () => {
    // 7-day cyclical series: 1, 2, 3, 4, 5, 6, 7, 1, 2, 3...
    const series = generateSeries(21, (i) => (i % 7) + 1);
    const model = new SeasonalNaiveModel(7);
    model.fit(series);

    const forecast = model.predict(7);
    expect(forecast).toHaveLength(7);
    // Horizon day 1 should match slot 0 (value 1)
    expect(forecast[0]?.predictedDemand).toBe(1);
    expect(forecast[1]?.predictedDemand).toBe(2);
    expect(forecast[6]?.predictedDemand).toBe(7);
  });

  it('HoltWintersModel should capture seasonal variations and baseline level', () => {
    const series = generateSeries(28, (i) => 50 + ((i % 7) === 5 || (i % 7) === 6 ? 25 : 0));
    const model = new HoltWintersModel(7);
    model.fit(series);

    const forecast = model.predict(7);
    expect(forecast).toHaveLength(7);
    expect(forecast.some((f) => f.predictedDemand > 55)).toBe(true);
  });

  it('AdaptiveForecastSelector should fallback to SMA for short series (< 7 days)', () => {
    const series = generateSeries(4, () => 15);
    const result = AdaptiveForecastSelector.generateForecast('ing_1', 'Test Ingredient', series, 7);
    expect(result.modelUsed).toContain('FallbackColdStart');
    expect(result.forecast).toHaveLength(7);
  });

  it('should apply SeasonalEventWindow multiplier during surge periods', () => {
    const series = generateSeries(30, () => 30);
    const eventWindow: SeasonalEventWindow = {
      id: 'curse',
      name: 'Midnight Curse',
      startDate: '2026-10-02',
      endDate: '2026-10-04',
      multiplier: 3.0,
    };

    const result = AdaptiveForecastSelector.generateForecast('bat_wings', 'Bat Wings', series, 7, [eventWindow]);
    const surgePoint = result.forecast.find((f) => f.date === '2026-10-02');
    if (surgePoint) {
      expect(surgePoint.eventMultiplierApplied).toBe(3.0);
      expect(surgePoint.predictedDemand).toBeCloseTo(90, 0); // 30 * 3.0
    }
  });
});

