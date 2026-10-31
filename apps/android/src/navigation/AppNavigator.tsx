import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from './types';
import { theme } from '../theme/colors';

// Auth Screens
import { SplashScreen } from '../features/auth/SplashScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { GoogleAuthScreen } from '../features/auth/GoogleAuthScreen';
import { TenantSelectionScreen } from '../features/auth/TenantSelectionScreen';
import { OnboardingScreen } from '../features/auth/OnboardingScreen';

// Core Inventory & Sales Screens
import { DashboardScreen } from '../features/inventory/DashboardScreen';
import { InventoryListScreen } from '../features/inventory/InventoryListScreen';
import { IngredientDetailScreen } from '../features/inventory/IngredientDetailScreen';
import { AddEditIngredientScreen } from '../features/inventory/AddEditIngredientScreen';
import { ReceiveStockScreen } from '../features/inventory/ReceiveStockScreen';
import { AdjustStockScreen } from '../features/inventory/AdjustStockScreen';
import { MovementsHistoryScreen } from '../features/inventory/MovementsHistoryScreen';
import { RecordSaleScreen } from '../features/sales/RecordSaleScreen';

// Intelligence & Operations Screens
import { ForecastSummaryScreen } from '../features/intelligence/ForecastSummaryScreen';
import { StockoutRiskScreen } from '../features/intelligence/StockoutRiskScreen';
import { RestockRecommendationsScreen } from '../features/intelligence/RestockRecommendationsScreen';
import { AnomalyAlertsScreen } from '../features/intelligence/AnomalyAlertsScreen';
import { MidnightCurseScreen } from '../features/intelligence/MidnightCurseScreen';
import { NotificationsScreen } from '../features/intelligence/NotificationsScreen';
import { ProfileSettingsScreen } from '../features/settings/ProfileSettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.cardBackground,
          borderTopColor: theme.colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.accentOrange,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'cube';
          if (route.name === 'HomeTab') iconName = 'grid';
          else if (route.name === 'InventoryTab') iconName = 'file-tray-stacked';
          else if (route.name === 'SalesTab') iconName = 'cart';
          else if (route.name === 'IntelligenceTab') iconName = 'trending-up';
          else if (route.name === 'MoreTab') iconName = 'ellipsis-horizontal-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="InventoryTab" component={InventoryListScreen} options={{ title: 'Inventory' }} />
      <Tab.Screen name="SalesTab" component={RecordSaleScreen} options={{ title: 'POS' }} />
      <Tab.Screen name="IntelligenceTab" component={ForecastSummaryScreen} options={{ title: 'Forecast' }} />
      <Tab.Screen name="MoreTab" component={ProfileSettingsScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="GoogleAuth" component={GoogleAuthScreen} />
      <Stack.Screen name="TenantSelection" component={TenantSelectionScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Operation screens */}
      <Stack.Screen name="IngredientDetail" component={IngredientDetailScreen} />
      <Stack.Screen name="AddEditIngredient" component={AddEditIngredientScreen} />
      <Stack.Screen name="ReceiveStock" component={ReceiveStockScreen} />
      <Stack.Screen name="AdjustStock" component={AdjustStockScreen} />
      <Stack.Screen name="MovementsHistory" component={MovementsHistoryScreen} />
      <Stack.Screen name="RecordSale" component={RecordSaleScreen} />
      <Stack.Screen name="ForecastSummary" component={ForecastSummaryScreen} />
      <Stack.Screen name="StockoutRisk" component={StockoutRiskScreen} />
      <Stack.Screen name="RestockRecommendations" component={RestockRecommendationsScreen} />
      <Stack.Screen name="AnomalyAlerts" component={AnomalyAlertsScreen} />
      <Stack.Screen name="MidnightCurse" component={MidnightCurseScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    </Stack.Navigator>
  );
};
