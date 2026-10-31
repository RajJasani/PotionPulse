import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

export const RestockRecommendationsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [ingredients, setIngredients] = useState<any[]>([]);
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

  const recommendations = ingredients
    .map((ing) => {
      const onHand = Number(ing.onHand || 0);
      const leadTime = Number(ing.leadTimeDays || 4);
      const costPerUnit = Number(ing.costPerUnit || 10);
      const packSize = Number(ing.packSize || 10);
      const baseVelocity = ing.reorderPoint ? Math.max(1, Math.round(ing.reorderPoint / 6)) : 2;
      const safetyStock = Number(ing.safetyStock || Math.round(baseVelocity * 2));

      // LTD + SafetyStock + 14d coverage - OnHand
      const ltd = Math.round(leadTime * baseVelocity);
      const targetCoverage = Math.round(14 * baseVelocity);
      const gross = ltd + safetyStock + targetCoverage;
      const netShortfall = Math.max(0, gross - onHand);

      const packs = netShortfall > 0 ? Math.ceil(netShortfall / packSize) : 0;
      const recommendedOrder = packs * packSize;
      const totalCost = recommendedOrder * costPerUnit;

      return {
        ...ing,
        onHand,
        recommendedOrder,
        packs,
        packSize,
        totalCost,
      };
    })
    .filter((item) => item.recommendedOrder > 0);

  const handleDraftPO = (item: any) => {
    Alert.alert(
      'Purchase Order Staged',
      `Draft PO for ${item.recommendedOrder} ${item.unit} (${item.packs} packs of ${item.packSize}) queued for ${item.name}.`,
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Restock Optimizer" showBack onBack={() => navigation.goBack()} />
      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchData} />

      <View style={styles.summaryBar}>
        <Ionicons name="cart" size={18} color={theme.colors.accentOrange} />
        <Text style={styles.summaryText}>
          {recommendations.length} items require vendor reordering based on lead times.
        </Text>
      </View>

      <FlatList
        data={recommendations}
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
              <View style={styles.topRow}>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sku}>
                    On Hand: {item.onHand} {item.unit} &bull; Pack: {item.packSize}
                  </Text>
                </View>
                <View style={styles.costBox}>
                  <Text style={styles.costLabel}>Est. Cost</Text>
                  <Text style={styles.costVal}>${item.totalCost.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.reorderRow}>
                <View>
                  <Text style={styles.recLabel}>Recommended Order</Text>
                  <Text style={styles.recVal}>
                    +{item.recommendedOrder} {item.unit} ({item.packs} packs)
                  </Text>
                </View>

                <Button
                  title="Draft PO"
                  size="sm"
                  variant="accent"
                  onPress={() => handleDraftPO(item)}
                  icon={<Ionicons name="document-text" size={14} color={theme.colors.cloudWhite} />}
                />
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
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 117, 24, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  summaryText: {
    color: theme.colors.accentOrange,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
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
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  sku: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  costBox: {
    alignItems: 'flex-end',
  },
  costLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  costVal: {
    color: theme.colors.cauldronGreen,
    fontSize: 15,
    fontWeight: '800',
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
  recLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  recVal: {
    color: theme.colors.accentOrange,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});
