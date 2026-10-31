export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  Register: undefined;
  GoogleAuth: undefined;
  TenantSelection: undefined;
  Onboarding: undefined;
  MainTabs: undefined;

  // Detail / Modal Screens
  IngredientDetail: { id: string };
  AddEditIngredient: { id?: string };
  ReceiveStock: { preselectedIngredientId?: string };
  AdjustStock: { preselectedIngredientId?: string };
  MovementsHistory: undefined;
  RecordSale: undefined;
  ForecastSummary: undefined;
  StockoutRisk: undefined;
  RestockRecommendations: undefined;
  AnomalyAlerts: undefined;
  MidnightCurse: undefined;
  Notifications: undefined;
  ProfileSettings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  InventoryTab: undefined;
  SalesTab: undefined;
  IntelligenceTab: undefined;
  MoreTab: undefined;
};
