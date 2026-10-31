import { ForecastPoint, StockoutRiskAssessment } from '../types';

export interface StockoutPredictorInput {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  incomingStock: number;
  leadTimeDays: number;
  safetyStock: number;
  forecast: ForecastPoint[];
}

export class StockoutPredictor {
  public static assessRisk(input: StockoutPredictorInput): StockoutRiskAssessment {
    const {
      ingredientId,
      ingredientName,
      currentStock,
      unit,
      incomingStock,
      leadTimeDays,
      safetyStock,
      forecast,
    } = input;

    if (!forecast || forecast.length === 0) {
      return {
        ingredientId,
        ingredientName,
        currentStock,
        unit,
        incomingStock,
        leadTimeDays,
        safetyStock,
        daysOfCover: 999,
        projectedStockoutDate: null,
        riskLevel: 'LOW',
        projectedDeficitAtLeadTime: 0,
        explanation: 'No forecast points available to evaluate stockout risk.',
      };
    }

    let remainingStock = currentStock + incomingStock;
    let cumulativeDemand = 0;
    let projectedStockoutDate: string | null = null;
    let daysOfCover = 0;

    let leadTimeDemand = 0;
    for (let i = 0; i < forecast.length; i++) {
      const pt = forecast[i];
      if (!pt) continue;

      const dayIndex = i + 1;

      if (dayIndex <= leadTimeDays) {
        leadTimeDemand += pt.predictedDemand;
      }

      cumulativeDemand += pt.predictedDemand;

      if (projectedStockoutDate === null && cumulativeDemand >= currentStock) {
        projectedStockoutDate = pt.date;
      }

      if (remainingStock >= pt.predictedDemand) {
        remainingStock -= pt.predictedDemand;
        daysOfCover += 1;
      } else if (remainingStock > 0) {
        // Fractional day coverage
        daysOfCover += remainingStock / Math.max(0.01, pt.predictedDemand);
        remainingStock = 0;
      }
    }

    // If remainingStock is still > 0 after the whole horizon:
    if (remainingStock > 0) {
      const avgDailyDemand = cumulativeDemand / Math.max(1, forecast.length);
      daysOfCover += avgDailyDemand > 0 ? remainingStock / avgDailyDemand : 999;
    }

    daysOfCover = Math.round(daysOfCover * 10) / 10;
    const projectedDeficitAtLeadTime = Math.max(0, leadTimeDemand + safetyStock - (currentStock + incomingStock));

    // Risk classification based on lead time and safety thresholds
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (daysOfCover <= leadTimeDays) {
      riskLevel = 'CRITICAL';
    } else if (daysOfCover <= leadTimeDays * 1.5) {
      riskLevel = 'HIGH';
    } else if (daysOfCover <= leadTimeDays * 2.5) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    const explanationParts: string[] = [];
    explanationParts.push(
      `Current on-hand: ${currentStock} ${unit}${incomingStock > 0 ? ` (+${incomingStock} incoming)` : ''}.`
    );
    explanationParts.push(
      `Supplier lead time is ${leadTimeDays} days, with expected lead-time demand of ${Math.round(leadTimeDemand)} ${unit} and safety buffer of ${safetyStock} ${unit}.`
    );

    if (projectedStockoutDate) {
      explanationParts.push(
        `On-hand inventory is projected to be fully exhausted by ${projectedStockoutDate} (${daysOfCover} days of cover).`
      );
    } else {
      explanationParts.push(`Inventory is sufficient for the entire ${forecast.length}-day forecast window (${daysOfCover} days of cover).`);
    }

    if (riskLevel === 'CRITICAL') {
      explanationParts.push(
        `CRITICAL RISK: Days of cover (${daysOfCover}d) is less than lead time (${leadTimeDays}d). An emergency restock order must be issued immediately to avoid operational downtime.`
      );
    } else if (riskLevel === 'HIGH') {
      explanationParts.push(
        `HIGH RISK: Days of cover (${daysOfCover}d) is approaching supplier lead time (${leadTimeDays}d). Restock recommended.`
      );
    }

    return {
      ingredientId,
      ingredientName,
      currentStock,
      unit,
      incomingStock,
      leadTimeDays,
      safetyStock,
      daysOfCover,
      projectedStockoutDate,
      riskLevel,
      projectedDeficitAtLeadTime: Math.round(projectedDeficitAtLeadTime * 10) / 10,
      explanation: explanationParts.join(' '),
    };
  }
}
