import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StockMovementType } from '@potionpulse/contracts';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { networkService } from '../../services/network';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

export const AdjustStockScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdjustStock'>>();
  const preselected = route.params?.preselectedIngredientId;

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState(preselected || '');
  const [direction, setDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState('5');
  const [reason, setReason] = useState('Physical count discrepancy');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.request<any[]>('/ingredients').then((res) => {
      const ings = res.data || [];
      setIngredients(ings);
      if (!selectedIngredientId && ings.length > 0) {
        setSelectedIngredientId(ings[0].id);
      }
    });
  }, [selectedIngredientId]);

  const activeIngredient = ingredients.find((i) => i.id === selectedIngredientId);
  const currentOnHand = Number(activeIngredient?.onHand || 0);
  const numQty = parseFloat(quantity) || 0;
  const delta = direction === 'INCREASE' ? numQty : -numQty;
  const projectedBalance = currentOnHand + delta;
  const isNegative = projectedBalance < 0;

  const handleAdjust = async () => {
    if (!networkService.isOnline) {
      Alert.alert('Offline Mode', 'Stock adjustments require an active internet connection.');
      return;
    }

    if (isNegative) {
      setError('Cannot adjust below zero. Negative balance blocked by ACID constraint.');
      return;
    }

    if (!selectedIngredientId || numQty <= 0) {
      setError('Please provide a valid ingredient and positive adjustment amount.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ingredientId: selectedIngredientId,
      movementType: direction === 'INCREASE' ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT,
      quantity: Math.abs(delta),
      notes: reason.trim() || 'Manual stock adjustment audit',
      idempotencyKey: `adj-${selectedIngredientId}-${Date.now()}`,
    };

    try {
      await api.request('/inventory/movements', {
        method: 'POST',
        body: payload,
      });
      Alert.alert('Ledger Updated', `Adjusted balance to ${projectedBalance} ${activeIngredient?.unit || 'units'}!`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to record adjustment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Adjust Stock Count" showBack onBack={() => navigation.goBack()} />
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Target Ingredient</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
            {ingredients.map((ing) => {
              const isSelected = ing.id === selectedIngredientId;
              return (
                <TouchableOpacity
                  key={ing.id}
                  onPress={() => setSelectedIngredientId(ing.id)}
                  style={[styles.ingTile, isSelected && styles.ingTileActive]}
                >
                  <Text style={[styles.ingTileName, isSelected && styles.ingTileNameActive]}>
                    {ing.name}
                  </Text>
                  <Text style={styles.ingTileSku}>{ing.sku}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Direction Toggle */}
          <Text style={styles.label}>Adjustment Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => setDirection('INCREASE')}
              style={[styles.toggleBtn, direction === 'INCREASE' && styles.toggleBtnInc]}
            >
              <Ionicons
                name="add-circle"
                size={18}
                color={direction === 'INCREASE' ? theme.colors.cauldronGreen : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.toggleText,
                  direction === 'INCREASE' && { color: theme.colors.cauldronGreen },
                ]}
              >
                Increase (+)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDirection('DECREASE')}
              style={[styles.toggleBtn, direction === 'DECREASE' && styles.toggleBtnDec]}
            >
              <Ionicons
                name="remove-circle"
                size={18}
                color={direction === 'DECREASE' ? theme.colors.crimson : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.toggleText,
                  direction === 'DECREASE' && { color: theme.colors.crimson },
                ]}
              >
                Decrease (-)
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Adjustment Amount"
            placeholder="5"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Input
            label="Audit Justification / Note"
            placeholder="Cycle count, spillage, correction..."
            value={reason}
            onChangeText={setReason}
          />

          {/* Projected Balance Display */}
          <View style={[styles.previewBox, isNegative && styles.previewBoxError]}>
            <View>
              <Text style={styles.previewLabel}>Projected Balance</Text>
              <Text style={[styles.previewVal, isNegative && { color: theme.colors.crimson }]}>
                {currentOnHand} &rarr; {projectedBalance} {activeIngredient?.unit || ''}
              </Text>
            </View>
            {isNegative ? (
              <Badge label="Negative Blocked" variant="danger" />
            ) : (
              <Badge label="Valid" variant="success" />
            )}
          </View>

          <Button
            title="Commit Adjustment to Ledger"
            onPress={handleAdjust}
            loading={loading}
            disabled={!networkService.isOnline || isNegative}
            style={styles.btn}
          />
        </Card>
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
  },
  card: {
    padding: theme.spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.crimson,
    fontSize: 12,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  horizScroll: {
    marginBottom: theme.spacing.md,
  },
  ingTile: {
    padding: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginRight: 8,
    minWidth: 110,
  },
  ingTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(112, 70, 200, 0.15)',
  },
  ingTileName: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  ingTileNameActive: {
    color: theme.colors.violetGlow,
  },
  ingTileSku: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  toggleBtnInc: {
    borderColor: theme.colors.cauldronGreen,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  toggleBtnDec: {
    borderColor: theme.colors.crimson,
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginVertical: theme.spacing.md,
  },
  previewBoxError: {
    borderColor: theme.colors.crimson,
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
  },
  previewLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  previewVal: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  btn: {
    marginTop: 4,
  },
});
