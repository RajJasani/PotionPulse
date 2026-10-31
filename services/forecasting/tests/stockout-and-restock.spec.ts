import { StockoutPredictor } from '../src/stockout/stockout-predictor';
import { RestockOptimizer } from '../src/restock/restock-optimizer';
import { ForecastPoint } from '../src/types';

describe('Stockout Predictor & Restock Optimizer Suite', () => {
  const dummyForecast: ForecastPoint[] = Array.from({ length: 14 }).map((_, i) => ({
    date: `2026-11-0${i + 1}`,
    predictedDemand: 10, // 10 units consumed per day
    lowerBound: 8,
    upperBound: 12,
    confidenceLevel: 0.9,
    eventMultiplierApplied: 1.0,
  }));

  it('StockoutPredictor should flag CRITICAL risk when days of cover is <= lead time', () => {
    // Current stock: 25 units. Lead time: 5 days. Daily demand: 10 units.
    // Days of cover = 2.5 days. Stockout expected on day 3 (2026-11-03).
    const assessment = StockoutPredictor.assessRisk({
      ingredientId: 'bat_wings',
      ingredientName: 'Bat Wings',
      currentStock: 25,
      unit: 'pieces',
      incomingStock: 0,
      leadTimeDays: 5,
      safetyStock: 15,
      forecast: dummyForecast,
    });

    expect(assessment.riskLevel).toBe('CRITICAL');
    expect(assessment.daysOfCover).toBe(2.5);
    expect(assessment.projectedStockoutDate).toBe('2026-11-03');
    expect(assessment.projectedDeficitAtLeadTime).toBe(40); // 50 (LTD) + 15 (SS) - 25 = 40
    expect(assessment.explanation).toContain('CRITICAL RISK');
  });

  it('StockoutPredictor should flag LOW risk when stock comfortably exceeds lead time coverage', () => {
    const assessment = StockoutPredictor.assessRisk({
      ingredientId: 'obsidian_dust',
      ingredientName: 'Obsidian Dust',
      currentStock: 200,
      unit: 'grams',
      incomingStock: 50,
      leadTimeDays: 3,
      safetyStock: 20,
      forecast: dummyForecast,
    });

    expect(assessment.riskLevel).toBe('LOW');
    expect(assessment.daysOfCover).toBeGreaterThan(10);
    expect(assessment.projectedStockoutDate).toBeNull();
  });

  it('RestockOptimizer should compute exact reorder quantity rounded up to vendor pack size and MOQ', () => {
    // Daily demand: 10.
    // Lead time: 5 days (LTD = 50).
    // Review cycle: 7 days (Coverage = 70).
    // Safety stock: 20.
    // Gross required = 50 + 70 + 20 = 140.
    // Current stock: 30. Incoming: 0.
    // Net deficit = 140 - 30 = 110 units.
    // Pack size: 25 units. MOQ: 50 units.
    // Ceiling(110 / 25) * 25 = 5 * 25 = 125 units (which is > MOQ 50).
    const plan = RestockOptimizer.calculateRecommendation({
      ingredientId: 'bat_wings',
      ingredientName: 'Bat Wings',
      currentStock: 30,
      unit: 'pieces',
      incomingStock: 0,
      leadTimeDays: 5,
      safetyStock: 20,
      reviewCycleDays: 7,
      packSize: 25,
      moq: 50,
      unitCost: 2.0,
      forecast: dummyForecast,
    });

    expect(plan.leadTimeDemand).toBe(50);
    expect(plan.coverageDemand).toBe(70);
    expect(plan.grossRequired).toBe(140);
    expect(plan.netDeficit).toBe(110);
    expect(plan.recommendedQuantity).toBe(125);
    expect(plan.estimatedCost).toBe(250.0);
    expect(plan.stepByStepExplanation.length).toBeGreaterThanOrEqual(6);
  });

  it('RestockOptimizer should recommend 0 when inventory covers gross requirement', () => {
    const plan = RestockOptimizer.calculateRecommendation({
      ingredientId: 'bat_wings',
      ingredientName: 'Bat Wings',
      currentStock: 300,
      unit: 'pieces',
      incomingStock: 0,
      leadTimeDays: 3,
      safetyStock: 20,
      forecast: dummyForecast,
    });

    expect(plan.netDeficit).toBe(0);
    expect(plan.recommendedQuantity).toBe(0);
  });
});

