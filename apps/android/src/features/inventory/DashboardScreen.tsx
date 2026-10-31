import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../stores/AuthContext';
import { api } from '../../services/api';
import { networkService } from '../../services/network';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { activeTenant } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalIngredients: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any[]>('/ingredients');
      const ingredients = res.data || [];

      let value = 0;
      let low = 0;
      let out = 0;

      ingredients.forEach((ing) => {
        const onHand = Number(ing.onHand || 0);
        const cost = Number(ing.costPerUnit || 0);
        value += onHand * cost;
        if (onHand <= 0) out++;
        else if (onHand <= (ing.safetyStock || 5)) low++;
      });

      setMetrics({
        totalIngredients: ingredients.length,
        totalValue: value,
        lowStockCount: low,
        outOfStockCount: out,
      });
      setLastUpdated(res.cachedAt || new Date().toISOString());
    } catch {
      // offline fallback handled by api client
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notifBtn}
          >
            <Ionicons name="notifications" size={20} color={theme.colors.cloudWhite} />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        }
      />

      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchDashboardData} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchDashboardData}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Midnight Curse Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MidnightCurse')}
        >
          <Card style={styles.curseCard}>
            <View style={styles.curseHeader}>
              <View style={styles.curseBadge}>
                <Ionicons name="flame" size={14} color="#000" />
                <Text style={styles.curseBadgeText}>APEX CURSE ACTIVE</Text>
              </View>
              <Text style={styles.multiplierText}>3.0x Demand</Text>
            </View>
            <Text style={styles.curseTitle}>The Midnight Curse</Text>
            <Text style={styles.curseDesc}>
              Bat Wings, Mandrake Root & Ghost Pepper demand tripled. Tap to inspect risk.
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Primary KPIs */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Ionicons name="layers" size={20} color={theme.colors.primary} />
            <Text style={styles.kpiValue}>{metrics.totalIngredients}</Text>
            <Text style={styles.kpiLabel}>Ingredients</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Ionicons name="cash" size={20} color={theme.colors.cauldronGreen} />
            <Text style={styles.kpiValue}>${metrics.totalValue.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Stock Value</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.accentOrange} />
            <Text style={[styles.kpiValue, { color: theme.colors.accentOrange }]}>
              {metrics.lowStockCount}
            </Text>
            <Text style={styles.kpiLabel}>Low Stock</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <Ionicons name="close-circle" size={20} color={theme.colors.crimson} />
            <Text style={[styles.kpiValue, { color: theme.colors.crimson }]}>
              {metrics.outOfStockCount}
            </Text>
            <Text style={styles.kpiLabel}>Out of Stock</Text>
          </Card>
        </View>

        {/* Quick Operations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Operations</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('RecordSale')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 117, 24, 0.2)' }]}>
                <Ionicons name="cart" size={22} color={theme.colors.accentOrange} />
              </View>
              <Text style={styles.actionTitle}>Record Sale</Text>
              <Text style={styles.actionSubtitle}>Dispense potions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('ReceiveStock', {})}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                <Ionicons name="download" size={22} color={theme.colors.cauldronGreen} />
              </View>
              <Text style={styles.actionTitle}>Receive Stock</Text>
              <Text style={styles.actionSubtitle}>Post vendor shipment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('AdjustStock', {})}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(112, 70, 200, 0.2)' }]}>
                <Ionicons name="swap-vertical" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Adjust Stock</Text>
              <Text style={styles.actionSubtitle}>Cycle count audit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MovementsHistory')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(167, 139, 250, 0.2)' }]}>
                <Ionicons name="list" size={22} color={theme.colors.violetGlow} />
              </View>
              <Text style={styles.actionTitle}>Ledger</Text>
              <Text style={styles.actionSubtitle}>Audit movement history</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Intelligence Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Predictive Intelligence</Text>
          <Card style={styles.intelCard}>
            <TouchableOpacity
              style={styles.intelRow}
              onPress={() => navigation.navigate('StockoutRisk')}
            >
              <View style={styles.intelInfo}>
                <Ionicons name="warning" size={20} color={theme.colors.accentOrange} />
                <View>
                  <Text style={styles.intelTitle}>Stockout Risk Evaluation</Text>
                  <Text style={styles.intelSubtitle}>
                    {metrics.lowStockCount} items nearing safety threshold (&le;48h)
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.intelDivider} />

            <TouchableOpacity
              style={styles.intelRow}
              onPress={() => navigation.navigate('ForecastSummary')}
            >
              <View style={styles.intelInfo}>
                <Ionicons name="trending-up" size={20} color={theme.colors.cauldronGreen} />
                <View>
                  <Text style={styles.intelTitle}>Demand Forecast Models</Text>
                  <Text style={styles.intelSubtitle}>
                    7d, 14d, and 30d projected velocity curves
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.intelDivider} />

            <TouchableOpacity
              style={styles.intelRow}
              onPress={() => navigation.navigate('AnomalyAlerts')}
            >
              <View style={styles.intelInfo}>
                <Ionicons name="shield" size={20} color={theme.colors.crimson} />
                <View>
                  <Text style={styles.intelTitle}>Anomaly Detection Center</Text>
                  <Text style={styles.intelSubtitle}>
                    Statistical shrinkage &amp; spike monitoring
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  notifBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.cardBackground,
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accentOrange,
  },
  curseCard: {
    backgroundColor: '#261208',
    borderColor: theme.colors.accentOrange,
    borderWidth: 1.5,
  },
  curseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  curseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  curseBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  multiplierText: {
    color: theme.colors.accentOrange,
    fontWeight: '800',
    fontSize: 13,
  },
  curseTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 17,
    fontWeight: '800',
  },
  curseDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
  },
  kpiValue: {
    color: theme.colors.cloudWhite,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  intelCard: {
    padding: 0,
    overflow: 'hidden',
  },
  intelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  intelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  intelTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  intelSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  intelDivider: {
    height: 1,
    backgroundColor: theme.colors.cardBorder,
  },
});
