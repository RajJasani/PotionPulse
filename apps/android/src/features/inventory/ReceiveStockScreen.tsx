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
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

export const ReceiveStockScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReceiveStock'>>();
  const preselected = route.params?.preselectedIngredientId;

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState(preselected || '');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [quantity, setQuantity] = useState('25');
  const [costPerUnit, setCostPerUnit] = useState('10');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.request<any[]>('/ingredients'),
      api.request<any[]>('/locations'),
    ]).then(([ingRes, locRes]) => {
      const ings = ingRes.data || [];
      const locs = locRes.data || [];
      setIngredients(ings);
      setLocations(locs);

      if (!selectedIngredientId && ings.length > 0) {
        setSelectedIngredientId(ings[0].id);
        setCostPerUnit(String(ings[0].costPerUnit || '10'));
      }
      if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      }
    });
  }, [selectedIngredientId]);

  const handleReceive = async () => {
    if (!networkService.isOnline) {
      Alert.alert('Offline Mode', 'Stock receipt requires an active internet connection.');
      return;
    }

    const qty = parseFloat(quantity);
    if (!selectedIngredientId || isNaN(qty) || qty <= 0) {
      setError('Please select an ingredient and enter a positive quantity.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ingredientId: selectedIngredientId,
      locationId: selectedLocationId || undefined,
      movementType: StockMovementType.RECEIPT,
      quantity: qty,
      costPerUnit: parseFloat(costPerUnit) || undefined,
      notes: notes.trim() || 'Vendor shipment receipt',
      idempotencyKey: `rcv-${selectedIngredientId}-${Date.now()}`,
    };

    try {
      await api.request('/inventory/movements', {
        method: 'POST',
        body: payload,
      });
      Alert.alert('Success', `Received ${qty} units into stock ledger!`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to post receipt movement.');
    } finally {
      setLoading(false);
    }
  };

  const activeIngredient = ingredients.find((i) => i.id === selectedIngredientId);

  return (
    <View style={styles.container}>
      <Header title="Receive Stock" showBack onBack={() => navigation.goBack()} />
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Select Ingredient to Restock</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
            {ingredients.map((ing) => {
              const isSelected = ing.id === selectedIngredientId;
              return (
                <TouchableOpacity
                  key={ing.id}
                  onPress={() => {
                    setSelectedIngredientId(ing.id);
                    setCostPerUnit(String(ing.costPerUnit || '10'));
                  }}
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

          {activeIngredient && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentLabel}>Current On Hand:</Text>
              <Text style={styles.currentVal}>
                {activeIngredient.onHand} {activeIngredient.unit}
              </Text>
            </View>
          )}

          <Input
            label="Quantity Received"
            placeholder="25"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Input
            label="Cost Per Unit ($)"
            placeholder="10.00"
            value={costPerUnit}
            onChangeText={setCostPerUnit}
            keyboardType="numeric"
          />

          <Input
            label="Vendor Reference / Shipment Note"
            placeholder="e.g. PO-2026-081 Northern Foragers"
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            title="Post Receipt to Ledger"
            onPress={handleReceive}
            loading={loading}
            disabled={!networkService.isOnline}
            icon={<Ionicons name="checkmark-circle" size={18} color={theme.colors.cloudWhite} />}
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
    borderColor: theme.colors.cauldronGreen,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  ingTileName: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  ingTileNameActive: {
    color: theme.colors.cauldronGreen,
  },
  ingTileSku: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBackground,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  currentLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  currentVal: {
    color: theme.colors.cloudWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  btn: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.cauldronGreen,
  },
});
