import { ForecastPoint, RestockRecommendation } from '../types';

export interface RestockOptimizerInput {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  incomingStock?: number;
  leadTimeDays: number;
  safetyStock: number;
  reviewCycleDays?: number;
  packSize?: number;
  moq?: number;
  unitCost?: number;
  vendorId?: string;
  forecast: ForecastPoint[];
}

export class RestockOptimizer {
  public static calculateRecommendation(input: RestockOptimizerInput): RestockRecommendation {
    const {
      ingredientId,
      ingredientName,
      currentStock,
      unit,
      incomingStock = 0,
      leadTimeDays,
      safetyStock,
      reviewCycleDays = 7,
      packSize = 1,
      moq = 0,
      unitCost = 0,
      vendorId,
      forecast,
    } = input;

    const explanation: string[] = [];

    // Step 1: Compute Lead-Time Demand (LTD)
    let leadTimeDemand = 0;
    const effectiveLeadDays = Math.min(leadTimeDays, forecast.length);
    for (let i = 0; i < effectiveLeadDays; i++) {
      const pt = forecast[i];
      if (pt) {
        leadTimeDemand += pt.predictedDemand;
      }
    }
    explanation.push(
      `1. Calculated Lead-Time Demand (LTD): Expected ${Math.round(leadTimeDemand * 10) / 10} ${unit} consumed over ${leadTimeDays} supplier lead days.`
    );

    // Step 2: Compute Review-Period / Cycle Demand
    let coverageDemand = 0;
    const startCoverage = effectiveLeadDays;
    const endCoverage = Math.min(effectiveLeadDays + reviewCycleDays, forecast.length);
    for (let i = startCoverage; i < endCoverage; i++) {
      const pt = forecast[i];
      if (pt) {
        coverageDemand += pt.predictedDemand;
      }
    }
    explanation.push(
      `2. Cycle Coverage Demand: Expected ${Math.round(coverageDemand * 10) / 10} ${unit} required for the ${reviewCycleDays}-day review interval.`
    );

    // Step 3: Gross Inventory Requirement
    const grossRequired = leadTimeDemand + safetyStock + coverageDemand;
    explanation.push(
      `3. Target Gross Position: LTD (${Math.round(leadTimeDemand)}) + Safety Stock (${safetyStock}) + Cycle (${Math.round(coverageDemand)}) = ${Math.round(grossRequired)} ${unit}.`
    );

    // Step 4: Net Deficit
    const totalEffectiveStock = currentStock + incomingStock;
    const netDeficit = Math.max(0, grossRequired - totalEffectiveStock);
    explanation.push(
      `4. Net Requirement: Gross Target (${Math.round(grossRequired)}) - [On-Hand (${currentStock}) + Incoming (${incomingStock})] = ${Math.round(netDeficit * 10) / 10} ${unit}.`
    );

    // Step 5: Vendor Pack Size and MOQ Rounding
    let recommendedQuantity = 0;
    if (netDeficit > 0) {
      const effectivePack = Math.max(1, packSize);
      const unitsPerPack = Math.ceil(netDeficit / effectivePack) * effectivePack;
      recommendedQuantity = Math.max(moq, unitsPerPack);

      explanation.push(
        `5. Vendor Constraints: Net deficit ${Math.round(netDeficit)} rounded up to pack size (${effectivePack}) and MOQ (${moq}) -> Recommended Order = ${recommendedQuantity} ${unit}.`
      );
    } else {
      explanation.push(
        `5. Vendor Constraints: Current and scheduled inventory is sufficient; no reorder required (Recommended Order = 0 ${unit}).`
      );
    }

    // Step 6: Order timing calculation
    let daysOfCover = 0;
    let tempStock = totalEffectiveStock;
    for (const pt of forecast) {
      if (tempStock >= pt.predictedDemand) {
        tempStock -= pt.predictedDemand;
        daysOfCover += 1;
      } else {
        daysOfCover += tempStock / Math.max(0.1, pt.predictedDemand);
        break;
      }
    }

    const today = new Date();
    let recommendedOrderDate = today.toISOString().slice(0, 10);
    const slackDays = Math.floor(daysOfCover - leadTimeDays);

    if (slackDays <= 0) {
      recommendedOrderDate = today.toISOString().slice(0, 10);
      explanation.push(
        `6. Timing: Days of cover (${Math.round(daysOfCover * 10) / 10}d) is within lead time (${leadTimeDays}d). Place order IMMEDIATELY today (${recommendedOrderDate}).`
      );
    } else {
      const orderDateObj = new Date(today.getTime() + slackDays * 86400000);
      recommendedOrderDate = orderDateObj.toISOString().slice(0, 10);
      explanation.push(
        `6. Timing: ${slackDays} days of buffer remaining before reorder point. Recommended order date: ${recommendedOrderDate}.`
      );
    }

    const estimatedCost = Math.round(recommendedQuantity * unitCost * 100) / 100;

    return {
      ingredientId,
      ingredientName,
      currentStock,
      unit,
      incomingStock,
      leadTimeDays,
      safetyStock,
      leadTimeDemand: Math.round(leadTimeDemand * 10) / 10,
      coverageDemand: Math.round(coverageDemand * 10) / 10,
      grossRequired: Math.round(grossRequired * 10) / 10,
      netDeficit: Math.round(netDeficit * 10) / 10,
      recommendedQuantity,
      packSize,
      moq,
      recommendedOrderDate,
      vendorId,
      unitCost,
      estimatedCost,
      stepByStepExplanation: explanation,
    };
  }
}
