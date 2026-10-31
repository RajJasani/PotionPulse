import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
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

export const MovementsHistoryScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.request<any[]>('/inventory/movements?limit=30');
      setMovements(res.data || []);
      setLastUpdated(res.cachedAt || new Date().toISOString());
    } catch {
      // offline handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <View style={styles.container}>
      <Header title="Movement Ledger" showBack onBack={() => navigation.goBack()} />
      <OfflineBanner lastUpdated={lastUpdated} onRefresh={fetchMovements} />

      <FlatList
        data={movements}
        keyExtractor={(item) => item.id || `${item.createdAt}-${item.ingredientId}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMovements}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={44} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No ledger transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Movements will appear as you receive stock, record sales, or make adjustments.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const qty = Number(item.quantity || 0);
          const isPositive = qty > 0;
          const formattedDate = new Date(item.createdAt || Date.now()).toLocaleString();

          return (
            <Card style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.meta}>
                  <Text style={styles.ingName}>
                    {item.ingredientName || item.ingredient?.name || `Item #${(item.ingredientId || '').slice(-6)}`}
                  </Text>
                  <Text style={styles.timestamp}>{formattedDate}</Text>
                </View>
                <Text
                  style={[
                    styles.delta,
                    { color: isPositive ? theme.colors.cauldronGreen : theme.colors.accentOrange },
                  ]}
                >
                  {isPositive ? `+${qty}` : qty} {item.unit || ''}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <Badge
                  label={item.movementType || 'ADJUSTMENT'}
                  variant={isPositive ? 'success' : 'warning'}
                />
                {item.notes ? (
                  <Text style={styles.notes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
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
  meta: {
    flex: 1,
    marginRight: 8,
  },
  ingName: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  timestamp: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  delta: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
  notes: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  empty: {
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

