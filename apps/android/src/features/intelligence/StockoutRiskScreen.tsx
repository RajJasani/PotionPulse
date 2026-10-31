import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

type RiskLevel = 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'HEALTHY';

export const StockoutRiskScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [filter, setFilter] = useState<RiskLevel>('ALL');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any[]>('/ingredients');
      setIngredients(res.data || []);
      setLastUpdated(res.cachedAt || new Date().toISOString());
    } catch {
      // offline handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const evaluated = ingredients.map((ing) => {
    const onHand = Number(ing.onHand || 0);
    const baseVelocity = ing.reorderPoint ? Math.max(1, Math.round(ing.reorderPoint / 6)) : 2;
    const daysOfCover = baseVelocity > 0 ? Math.round((onHand / baseVelocity) * 10) / 10 : 999;

    let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'HEALTHY' = 'HEALTHY';
    if (daysOfCover <= 2 || onHand === 0) riskLevel = 'CRITICAL';
    else if (daysOfCover <= 5) riskLevel = 'HIGH';
    else if (daysOfCover <= 10) riskLevel = 'MODERATE';

    return {
      ...ing,
      onHand,
      baseVelocity,
      daysOfCover,
      riskLevel,
    };
  });

  const filtered = evaluated.filter((item) => filter === 'ALL' || item.riskLevel === filter);

  return (
    <View style={styles.container}>
      <Header
        title="Stockout Risk Center"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="Reorders"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('RestockRecommendations')}
          />
        }
      />

      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchData} />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'HEALTHY'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setFilter(r)}
            style={[styles.tabBtn, filter === r && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, filter === r && styles.tabTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => {
          return (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sku}>SKU: {item.sku}</Text>
                </View>

                {item.riskLevel === 'CRITICAL' ? (
                  <Badge label="Critical (&le;48h)" variant="danger" />
                ) : item.riskLevel === 'HIGH' ? (
                  <Badge label="High (2-5d)" variant="warning" />
                ) : item.riskLevel === 'MODERATE' ? (
                  <Badge label="Moderate" variant="neutral" />
                ) : (
                  <Badge label="Healthy" variant="success" />
                )}
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>Days of Cover</Text>
                  <Text
                    style={[
                      styles.coverVal,
                      item.riskLevel === 'CRITICAL' && { color: theme.colors.crimson },
                      item.riskLevel === 'HIGH' && { color: theme.colors.accentOrange },
                    ]}
                  >
                    {item.daysOfCover} Days
                  </Text>
                </View>

                <View style={styles.alignRight}>
                  <Text style={styles.statLabel}>On Hand Balance</Text>
                  <Text style={styles.onHandVal}>
                    {item.onHand} {item.unit}
                  </Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 6,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: theme.colors.cloudWhite,
  },
  list: {
    padding: theme.spacing.md,
    gap: 10,
  },
  card: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  sku: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  coverVal: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  onHandVal: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
});
