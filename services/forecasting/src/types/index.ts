export interface TimeSeriesPoint {
  date: string; // ISO format 'YYYY-MM-DD'
  timestamp: number; // Unix ms
  value: number;
  metadata?: Record<string, any>;
}

export interface IngredientSalesHistory {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  points: TimeSeriesPoint[];
}

export interface SeasonalEventWindow {
  id: string;
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  multiplier: number; // e.g. 3.0 for Midnight Curse
  affectedIngredientIds?: string[];
}

export interface ForecastInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g., 0.80 or 0.95
}

export interface ForecastPoint {
  date: string;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  eventMultiplierApplied: number;
}

export interface ForecastResult {
  ingredientId: string;
  ingredientName: string;
  modelUsed: string;
  horizonDays: number;
  generatedAt: string;
  historicalPointsCount: number;
  metrics?: {
    wape: number;
    mae: number;
    rmse: number;
    bias: number;
  };
  forecast: ForecastPoint[];
  methodologyNotes: string[];
}

export interface EvaluationMetrics {
  mae: number;
  rmse: number;
  wape: number; // percentage (0 - 100+)
  bias: number; // percentage (-100 to +100)
  meanActual: number;
  meanPredicted: number;
  sampleCount: number;
}

export interface ModelComparisonResult {
  modelName: string;
  metrics: EvaluationMetrics;
  isBest: boolean;
}

export interface BacktestResult {
  ingredientId: string;
  ingredientName: string;
  validationMethod: 'rolling-origin';
  trainingWindowSize: number;
  testHorizon: number;
  models: ModelComparisonResult[];
  recommendedModel: string;
}

export interface StockoutRiskAssessment {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  incomingStock: number;
  leadTimeDays: number;
  safetyStock: number;
  daysOfCover: number;
  projectedStockoutDate: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectedDeficitAtLeadTime: number;
  explanation: string;
}

export interface RestockRecommendation {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unit: string;
  incomingStock: number;
  leadTimeDays: number;
  safetyStock: number;
  leadTimeDemand: number;
  coverageDemand: number; // Demand during review/cycle coverage period
  grossRequired: number; // LTD + SS + Coverage
  netDeficit: number; // grossRequired - (currentStock + incomingStock)
  recommendedQuantity: number; // netDeficit rounded up to MOQ / pack size
  packSize: number;
  moq: number;
  recommendedOrderDate: string;
  vendorId?: string;
  estimatedCost?: number;
  unitCost?: number;
  stepByStepExplanation: string[];
}

export interface AnomalyReport {
  id: string;
  ingredientId: string;
  ingredientName: string;
  date: string;
  anomalyType: 'DEMAND_SPIKE' | 'DEMAND_DROP' | 'UNEXPLAINED_SHRINKAGE' | 'LEDGER_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  observedValue: number;
  expectedValue: number;
  deviationScore: number; // Robust modified Z-score
  mad: number; // Median Absolute Deviation
  isSeasonalEvent: boolean;
  explanation: string;
  recommendedAction: string;
}

