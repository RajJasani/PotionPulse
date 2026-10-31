import { DataPreprocessor } from '../src/preprocessing/preprocessor';

describe('DataPreprocessor Suite', () => {
  it('should normalize ISO date strings, aggregate intra-day duplicate sales and sort chronologically', () => {
    const raw = [
      { date: '2026-10-02T15:30:00Z', value: 5 },
      { date: '2026-10-01T08:00:00Z', value: 10 },
      { date: '2026-10-02T18:45:00Z', value: 7 }, // Duplicate on 2026-10-02
    ];

    const result = DataPreprocessor.preprocess(raw, { aggregateDuplicates: true });
    expect(result.points).toHaveLength(2);
    expect(result.points[0]?.date).toBe('2026-10-01');
    expect(result.points[0]?.value).toBe(10);
    expect(result.points[1]?.date).toBe('2026-10-02');
    expect(result.points[1]?.value).toBe(12); // 5 + 7
    expect(result.metadata.duplicatesAggregated).toBe(1);
  });

  it('should fill missing calendar dates with true zeros when shop had zero sales', () => {
    const raw = [
      { date: '2026-10-01', value: 15 },
      // 2026-10-02 missing
      // 2026-10-03 missing
      { date: '2026-10-04', value: 20 },
    ];

    const result = DataPreprocessor.preprocess(raw, {
      fillMissingDates: true,
      missingDateStrategy: 'zero',
    });

    expect(result.points).toHaveLength(4);
    expect(result.points[1]?.date).toBe('2026-10-02');
    expect(result.points[1]?.value).toBe(0);
    expect(result.points[1]?.metadata?.isImputed).toBe(true);
    expect(result.points[2]?.date).toBe('2026-10-03');
    expect(result.points[2]?.value).toBe(0);
    expect(result.metadata.missingDatesFilled).toBe(2);
  });

  it('should clamp negative values to zero when enforceNonNegative is true', () => {
    const raw = [
      { date: '2026-10-01', value: -8 },
      { date: '2026-10-02', value: 14 },
    ];

    const result = DataPreprocessor.preprocess(raw, { enforceNonNegative: true });
    expect(result.points[0]?.value).toBe(0);
    expect(result.metadata.negativeValuesClamped).toBe(1);
  });

  it('should compute descriptive statistics (mean, stdev, min, max)', () => {
    const points = [
      { date: '2026-10-01', timestamp: 1, value: 10 },
      { date: '2026-10-02', timestamp: 2, value: 20 },
      { date: '2026-10-03', timestamp: 3, value: 30 },
    ];

    const stats = DataPreprocessor.calculateSummary(points);
    expect(stats.count).toBe(3);
    expect(stats.mean).toBe(20);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(30);
    expect(stats.stdev).toBe(10);
  });
});
