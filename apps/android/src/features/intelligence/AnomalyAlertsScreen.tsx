import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { theme } from '../../theme/colors';

interface Anomaly {
  id: string;
  title: string;
  ingredient: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'OPEN' | 'RESOLVED';
  expected: string;
  observed: string;
  description: string;
}

export const AnomalyAlertsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: '1',
      title: 'Sudden Consumption Spike',
      ingredient: 'Bat Wings',
      severity: 'CRITICAL',
      status: 'OPEN',
      expected: '12 units / day',
      observed: '68 units / 4h (+466%)',
      description: 'Consumption velocity jumped > 3.8σ above 30-day baseline.',
    },
    {
      id: '2',
      title: 'Unexplained Stock Shrinkage',
      ingredient: 'Phoenix Feather',
      severity: 'WARNING',
      status: 'OPEN',
      expected: '25 units on shelf',
      observed: '18 units found (-28%)',
      description: 'Physical audit on Vault Shelf A-1 lower than ledger balance.',
    },
    {
      id: '3',
      title: 'Negative Balance Attempt Blocked',
      ingredient: 'Ghost Pepper Essence',
      severity: 'CRITICAL',
      status: 'OPEN',
      expected: '>= 0 invariant',
      observed: 'Attempted -15 with 4 on hand',
      description: 'ACID ledger constraint safely aborted invalid stock deduction.',
    },
  ]);

  const handleResolve = (id: string) => {
    setAnomalies(
      anomalies.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)),
    );
    Alert.alert('Resolved', 'Anomaly investigation noted and marked resolved.');
  };

  return (
    <View style={styles.container}>
      <Header title="Anomaly Integrity Center" showBack onBack={() => navigation.goBack()} />

      <FlatList
        data={anomalies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <Card
              style={[
                styles.card,
                item.severity === 'CRITICAL' && styles.cardCritical,
              ]}
            >
              <View style={styles.topRow}>
                <View style={styles.meta}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.ing}>{item.ingredient}</Text>
                </View>
                <Badge
                  label={item.severity}
                  variant={item.severity === 'CRITICAL' ? 'danger' : 'warning'}
                />
              </View>

              <Text style={styles.desc}>{item.description}</Text>

              <View style={styles.evidenceBox}>
                <View style={styles.evidenceItem}>
                  <Text style={styles.evidenceLabel}>Expected</Text>
                  <Text style={styles.evidenceVal}>{item.expected}</Text>
                </View>
                <View style={styles.evidenceItem}>
                  <Text style={styles.evidenceLabel}>Observed</Text>
                  <Text style={[styles.evidenceVal, { color: theme.colors.accentOrange }]}>
                    {item.observed}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Badge
                  label={item.status}
                  variant={item.status === 'OPEN' ? 'warning' : 'success'}
                />
                {item.status === 'OPEN' && (
                  <Button
                    title="Mark Resolved"
                    size="sm"
                    variant="ghost"
                    onPress={() => handleResolve(item.id)}
                    icon={<Ionicons name="checkmark" size={14} color={theme.colors.cloudWhite} />}
                  />
                )}
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
    gap: 12,
  },
  card: {
    padding: theme.spacing.md,
  },
  cardCritical: {
    borderColor: 'rgba(255, 23, 68, 0.4)',
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  meta: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  ing: {
    color: theme.colors.accentOrange,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  desc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  evidenceBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.inputBackground,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 10,
  },
  evidenceItem: {
    flex: 1,
  },
  evidenceLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  evidenceVal: {
    color: theme.colors.cloudWhite,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 8,
  },
});
