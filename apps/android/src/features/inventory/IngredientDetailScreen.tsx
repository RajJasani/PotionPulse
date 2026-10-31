import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { theme } from '../../theme/colors';

export const IngredientDetailScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'IngredientDetail'>>();
  const { id } = route.params;

  const [ingredient, setIngredient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any>(`/ingredients/${id}`);
      setIngredient(res.data);
    } catch (err: any) {
      console.error('Failed to load ingredient detail', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading || !ingredient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const onHand = Number(ingredient.onHand || 0);
  const safetyStock = Number(ingredient.safetyStock || 5);
  const isOutOfStock = onHand <= 0;
  const isLowStock = onHand <= safetyStock;

  return (
    <View style={styles.container}>
      <Header
        title="Ingredient Details"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="Edit"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('AddEditIngredient', { id })}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.topRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{ingredient.name}</Text>
              <Text style={styles.sku}>SKU: {ingredient.sku}</Text>
            </View>
            <Badge label={ingredient.category} variant="purple" />
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Current On-Hand Balance</Text>
            <Text
              style={[
                styles.balanceValue,
                isOutOfStock && { color: theme.colors.crimson },
                isLowStock && !isOutOfStock && { color: theme.colors.accentOrange },
              ]}
            >
              {onHand} {ingredient.unit}
            </Text>
            {isOutOfStock ? (
              <Badge label="Out of Stock - Immediate Action Required" variant="danger" style={styles.stockBadge} />
            ) : isLowStock ? (
              <Badge label="Low Stock - Below Safety Threshold" variant="warning" style={styles.stockBadge} />
            ) : (
              <Badge label="Stock Level Healthy" variant="success" style={styles.stockBadge} />
            )}
          </View>
        </Card>

        {/* Inventory Parameters Card */}
        <Card style={styles.paramsCard}>
          <Text style={styles.sectionHeader}>Procurement & Stock Parameters</Text>
          <View style={styles.paramGrid}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Unit Valuation</Text>
              <Text style={styles.paramValue}>${ingredient.costPerUnit || '0.00'}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Reorder Point</Text>
              <Text style={styles.paramValue}>{ingredient.reorderPoint || '—'} {ingredient.unit}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Safety Buffer</Text>
              <Text style={styles.paramValue}>{ingredient.safetyStock || '—'} {ingredient.unit}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Lead Time</Text>
              <Text style={styles.paramValue}>{ingredient.leadTimeDays || '4'} Days</Text>
            </View>
          </View>
        </Card>

        {/* Actions Grid */}
        <View style={styles.actions}>
          <Button
            title="Receive Stock"
            variant="accent"
            onPress={() => navigation.navigate('ReceiveStock', { preselectedIngredientId: id })}
            icon={<Ionicons name="download" size={18} color={theme.colors.cloudWhite} />}
          />
          <Button
            title="Adjust Stock Count"
            variant="secondary"
            onPress={() => navigation.navigate('AdjustStock', { preselectedIngredientId: id })}
            icon={<Ionicons name="swap-vertical" size={18} color={theme.colors.cloudWhite} />}
          />
          <Button
            title="View Stock Ledger History"
            variant="ghost"
            onPress={() => navigation.navigate('MovementsHistory')}
            icon={<Ionicons name="time" size={18} color={theme.colors.textSecondary} />}
          />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  overviewCard: {
    padding: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: theme.colors.cloudWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  sku: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  balanceBox: {
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  balanceLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  balanceValue: {
    color: theme.colors.cloudWhite,
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  stockBadge: {
    marginTop: 4,
  },
  paramsCard: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paramItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.inputBackground,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  paramLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  paramValue: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    gap: 10,
    marginTop: theme.spacing.sm,
  },
});

