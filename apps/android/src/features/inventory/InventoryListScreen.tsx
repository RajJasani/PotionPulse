import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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

const CATEGORIES = ['ALL', 'BOTANICAL', 'MINERAL', 'CREATURE', 'ESSENCE', 'SOLVENT'];

export const InventoryListScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any[]>('/ingredients');
      setIngredients(res.data || []);
      setLastUpdated(res.cachedAt || new Date().toISOString());
    } catch {
      // Handled via cache in api client
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const filtered = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ing.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Inventory Catalog"
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('MovementsHistory')}
          >
            <Ionicons name="time" size={20} color={theme.colors.cloudWhite} />
          </TouchableOpacity>
        }
      />

      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchIngredients} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by ingredient name or SKU..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Ingredients List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchIngredients}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No ingredients found</Text>
              <Text style={styles.emptySubtitle}>Try changing your search or category filter.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const onHand = Number(item.onHand || 0);
          const safetyStock = Number(item.safetyStock || 5);
          const isOutOfStock = onHand <= 0;
          const isLowStock = onHand <= safetyStock;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('IngredientDetail', { id: item.id })}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.itemTitleBlock}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>{item.sku}</Text>
                  </View>
                  {isOutOfStock ? (
                    <Badge label="Out of Stock" variant="danger" />
                  ) : isLowStock ? (
                    <Badge label="Low Stock" variant="warning" />
                  ) : (
                    <Badge label="Healthy" variant="success" />
                  )}
                </View>

                <View style={styles.itemBottom}>
                  <View>
                    <Text style={styles.propLabel}>On Hand</Text>
                    <Text
                      style={[
                        styles.stockValue,
                        isOutOfStock && { color: theme.colors.crimson },
                        isLowStock && !isOutOfStock && { color: theme.colors.accentOrange },
                      ]}
                    >
                      {onHand} {item.unit}
                    </Text>
                  </View>

                  <View style={styles.alignRight}>
                    <Text style={styles.propLabel}>Cost Per Unit</Text>
                    <Text style={styles.costValue}>${item.costPerUnit || '0.00'}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddEditIngredient', {})}
      >
        <Ionicons name="add" size={28} color={theme.colors.cloudWhite} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.cardBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  categoryScroll: {
    paddingVertical: theme.spacing.sm,
  },
  categoryList: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: theme.colors.cloudWhite,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: 10,
    paddingBottom: 80,
  },
  itemCard: {
    padding: theme.spacing.md,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    color: theme.colors.cloudWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  itemSku: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 10,
  },
  propLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  stockValue: {
    color: theme.colors.cloudWhite,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  costValue: {
    color: theme.colors.accentOrange,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
