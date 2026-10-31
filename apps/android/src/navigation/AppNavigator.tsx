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

// Core & Intelligence Screens (imported dynamically or via feature components)
import { ScreenPlaceholder } from '../features/ScreenPlaceholder';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const PlaceholderDashboard = () => <ScreenPlaceholder title="Home Dashboard" />;
const PlaceholderInventory = () => <ScreenPlaceholder title="Inventory Catalog" />;
const PlaceholderSale = () => <ScreenPlaceholder title="Point of Sale Register" />;
const PlaceholderForecast = () => <ScreenPlaceholder title="Demand Forecasting" />;
const PlaceholderSettings = () => <ScreenPlaceholder title="Profile & Settings" />;

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
      <Tab.Screen name="HomeTab" component={PlaceholderDashboard} options={{ title: 'Overview' }} />
      <Tab.Screen name="InventoryTab" component={PlaceholderInventory} options={{ title: 'Inventory' }} />
      <Tab.Screen name="SalesTab" component={PlaceholderSale} options={{ title: 'POS' }} />
      <Tab.Screen name="IntelligenceTab" component={PlaceholderForecast} options={{ title: 'Forecast' }} />
      <Tab.Screen name="MoreTab" component={PlaceholderSettings} options={{ title: 'More' }} />
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
      <Stack.Screen name="IngredientDetail">
        {() => <ScreenPlaceholder title="Ingredient Details" />}
      </Stack.Screen>
      <Stack.Screen name="AddEditIngredient">
        {() => <ScreenPlaceholder title="Add / Edit Ingredient" />}
      </Stack.Screen>
      <Stack.Screen name="ReceiveStock">
        {() => <ScreenPlaceholder title="Receive Stock" />}
      </Stack.Screen>
      <Stack.Screen name="AdjustStock">
        {() => <ScreenPlaceholder title="Adjust Stock" />}
      </Stack.Screen>
      <Stack.Screen name="MovementsHistory">
        {() => <ScreenPlaceholder title="Stock Movement History" />}
      </Stack.Screen>
      <Stack.Screen name="RecordSale">
        {() => <ScreenPlaceholder title="Record Sale" />}
      </Stack.Screen>
      <Stack.Screen name="ForecastSummary">
        {() => <ScreenPlaceholder title="Forecast Summary" />}
      </Stack.Screen>
      <Stack.Screen name="StockoutRisk">
        {() => <ScreenPlaceholder title="Stockout Risk" />}
      </Stack.Screen>
      <Stack.Screen name="RestockRecommendations">
        {() => <ScreenPlaceholder title="Restock Recommendations" />}
      </Stack.Screen>
      <Stack.Screen name="AnomalyAlerts">
        {() => <ScreenPlaceholder title="Anomaly Alerts" />}
      </Stack.Screen>
      <Stack.Screen name="MidnightCurse">
        {() => <ScreenPlaceholder title="Midnight Curse" />}
      </Stack.Screen>
      <Stack.Screen name="Notifications">
        {() => <ScreenPlaceholder title="Notifications" />}
      </Stack.Screen>
      <Stack.Screen name="ProfileSettings">
        {() => <ScreenPlaceholder title="Profile & Settings" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
