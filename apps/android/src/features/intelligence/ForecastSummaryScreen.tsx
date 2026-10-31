import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

export const ForecastSummaryScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [horizon, setHorizon] = useState<7 | 14 | 30>(14);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [curseActive, setCurseActive] = useState(true);
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

  const curseItems = ['Bat Wings', 'Mandrake Root', 'Ghost Pepper', 'Dragon Scale'];

  return (
    <View style={styles.container}>
      <Header
        title="Demand Forecasting"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.curseToggle}
            onPress={() => setCurseActive(!curseActive)}
          >
            <Ionicons
              name="flame"
              size={18}
              color={curseActive ? theme.colors.accentOrange : theme.colors.textMuted}
            />
          </TouchableOpacity>
        }
      />

      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchData} />

      {/* Horizon Selector Header */}
      <View style={styles.horizonBar}>
        <Text style={styles.horizonLabel}>Forecast Window:</Text>
        <View style={styles.horizonPills}>
          {([7, 14, 30] as const).map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => setHorizon(h)}
              style={[styles.horizonBtn, horizon === h && styles.horizonBtnActive]}
            >
              <Text style={[styles.horizonText, horizon === h && styles.horizonTextActive]}>
                {h} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={ingredients}
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
          const isCurse = curseItems.some((c) =>
            item.name?.toLowerCase().includes(c.toLowerCase()),
          );
          const multiplier = curseActive && isCurse ? 3.0 : 1.0;
          const baseVelocity = item.reorderPoint ? Math.max(1, Math.round(item.reorderPoint / 6)) : 2;
          const dailyVelocity = Math.round(baseVelocity * multiplier * 10) / 10;
          const projectedDemand = Math.round(dailyVelocity * horizon);

          return (
            <Card style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.nameBlock}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sku}>{item.sku}</Text>
                </View>
                {multiplier > 1 ? (
                  <Badge label="3.0x Surge" variant="warning" />
                ) : (
                  <Badge label="Normal" variant="neutral" />
                )}
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Daily Velocity</Text>
                  <Text style={styles.statVal}>
                    {dailyVelocity} {item.unit}/d
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{horizon}d Forecast</Text>
                  <Text style={[styles.statVal, { color: theme.colors.accentOrange }]}>
                    {projectedDemand} {item.unit}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Current Stock</Text>
                  <Text style={styles.statVal}>
                    {item.onHand || 0} {item.unit}
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
  curseToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.cardBackground,
  },
  horizonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  horizonLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  horizonPills: {
    flexDirection: 'row',
    gap: 6,
  },
  horizonBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  horizonBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  horizonText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  horizonTextActive: {
    color: theme.colors.cloudWhite,
  },
  list: {
    padding: theme.spacing.md,
    gap: 10,
  },
  card: {
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameBlock: {
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statVal: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
});
