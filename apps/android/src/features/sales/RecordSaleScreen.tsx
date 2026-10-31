import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { networkService } from '../../services/network';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

interface CartItem {
  ingredientId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

export const RecordSaleScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [saleNumber] = useState(`SALE-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.request<any[]>('/ingredients').then((res) => {
      setIngredients(res.data || []);
    });
  }, []);

  const addToCart = (ing: any) => {
    const onHand = Number(ing.onHand || 0);
    if (onHand <= 0) {
      Alert.alert('Out of Stock', 'Cannot dispense items with zero inventory.');
      return;
    }

    const existing = cart.find((i) => i.ingredientId === ing.id);
    if (existing) {
      if (existing.quantity + 1 > onHand) {
        Alert.alert('Exceeds Stock', `Only ${onHand} ${ing.unit} available on hand.`);
        return;
      }
      setCart(
        cart.map((i) =>
          i.ingredientId === ing.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      const price = Math.round(Number(ing.costPerUnit || 10) * 1.5 * 100) / 100;
      setCart([
        ...cart,
        {
          ingredientId: ing.id,
          name: ing.name,
          unit: ing.unit,
          quantity: 1,
          unitPrice: price,
          maxStock: onHand,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find((i) => i.ingredientId === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.ingredientId !== id));
    } else if (newQty > item.maxStock) {
      Alert.alert('Stock Limit', `Cannot exceed ${item.maxStock} ${item.unit}.`);
    } else {
      setCart(
        cart.map((i) => (i.ingredientId === id ? { ...i, quantity: newQty } : i)),
      );
    }
  };

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleCheckout = async () => {
    if (!networkService.isOnline) {
      Alert.alert('Offline Mode', 'Point of sale transactions require an active internet connection.');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to ticket first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      saleNumber,
      notes: notes.trim() || undefined,
      items: cart.map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      idempotencyKey: `pos-mob-${saleNumber}-${Date.now()}`,
    };

    try {
      await api.request('/sales', {
        method: 'POST',
        body: payload,
      });
      Alert.alert(
        'Sale Completed!',
        `Recorded ${saleNumber}. Inventory balances deducted in real time.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCart([]);
              navigation.navigate('MainTabs');
            },
          },
        ],
      );
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = ingredients.filter((ing) =>
    ing.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Header title="Point of Sale (POS)" showBack onBack={() => navigation.goBack()} />
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Current Ticket Card */}
        <Card style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketTitleRow}>
              <Ionicons name="receipt" size={20} color={theme.colors.accentOrange} />
              <Text style={styles.ticketTitle}>Current Order Ticket</Text>
            </View>
            <Text style={styles.saleRef}>{saleNumber}</Text>
          </View>

          {cart.length === 0 ? (
            <Text style={styles.emptyCartText}>Ticket is empty. Tap items below to add.</Text>
          ) : (
            <View style={styles.cartItems}>
              {cart.map((item) => (
                <View key={item.ingredientId} style={styles.cartRow}>
                  <View style={styles.cartItemMeta}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${item.unitPrice.toFixed(2)} / {item.unit}
                    </Text>
                  </View>

                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.ingredientId, -1)}
                      style={styles.stepBtn}
                    >
                      <Ionicons name="remove" size={16} color={theme.colors.cloudWhite} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.ingredientId, 1)}
                      style={styles.stepBtn}
                    >
                      <Ionicons name="add" size={16} color={theme.colors.cloudWhite} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotal}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.ticketTotalRow}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalVal}>${subtotal.toFixed(2)}</Text>
              </View>

              <Button
                title={submitting ? 'Deducting Inventory...' : `Complete Sale ($${subtotal.toFixed(2)})`}
                onPress={handleCheckout}
                loading={submitting}
                disabled={!networkService.isOnline}
                icon={<Ionicons name="checkmark-done" size={18} color={theme.colors.cloudWhite} />}
                style={styles.checkoutBtn}
              />
            </View>
          )}
        </Card>

        {/* Catalog Selector Section */}
        <View style={styles.catalogSection}>
          <Text style={styles.sectionTitle}>Add From Catalog</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              placeholder="Search catalog items..."
              placeholderTextColor={theme.colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.itemsGrid}>
            {filtered.map((ing) => {
              const onHand = Number(ing.onHand || 0);
              const isOut = onHand <= 0;
              const price = Math.round(Number(ing.costPerUnit || 10) * 1.5 * 100) / 100;

              return (
                <TouchableOpacity
                  key={ing.id}
                  disabled={isOut}
                  onPress={() => addToCart(ing)}
                  style={[styles.catalogTile, isOut && styles.catalogTileOut]}
                >
                  <Text style={styles.catalogName} numberOfLines={1}>
                    {ing.name}
                  </Text>
                  <Text style={styles.catalogPrice}>${price.toFixed(2)}</Text>
                  <Text
                    style={[
                      styles.catalogStock,
                      isOut ? { color: theme.colors.crimson } : { color: theme.colors.cauldronGreen },
                    ]}
                  >
                    {isOut ? 'Out of Stock' : `${onHand} ${ing.unit} left`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  errorBox: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  errorText: {
    color: theme.colors.crimson,
    fontSize: 12,
  },
  ticketCard: {
    padding: theme.spacing.md,
    borderColor: theme.colors.accentOrange,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingBottom: 8,
    marginBottom: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  saleRef: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyCartText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  cartItems: {
    gap: 8,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
  },
  cartItemMeta: {
    flex: 1,
  },
  cartItemName: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  cartItemPrice: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 10,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  qtyText: {
    color: theme.colors.cloudWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  itemTotal: {
    color: theme.colors.accentOrange,
    fontWeight: '800',
    fontSize: 13,
    minWidth: 50,
    textAlign: 'right',
  },
  ticketTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  totalVal: {
    color: theme.colors.accentOrange,
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutBtn: {
    marginTop: 10,
    backgroundColor: theme.colors.cauldronGreen,
  },
  catalogSection: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catalogTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.md,
    padding: 10,
  },
  catalogTileOut: {
    opacity: 0.5,
  },
  catalogName: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  catalogPrice: {
    color: theme.colors.accentOrange,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  catalogStock: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

