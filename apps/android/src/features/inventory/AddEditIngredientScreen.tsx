import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../services/api';
import { networkService } from '../../services/network';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { theme } from '../../theme/colors';

const CATEGORIES = ['BOTANICAL', 'MINERAL', 'CREATURE', 'ESSENCE', 'SOLVENT'];

export const AddEditIngredientScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditIngredient'>>();
  const id = route.params?.id;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('BOTANICAL');
  const [unit, setUnit] = useState('g');
  const [costPerUnit, setCostPerUnit] = useState('10');
  const [safetyStock, setSafetyStock] = useState('20');
  const [reorderPoint, setReorderPoint] = useState('30');
  const [leadTimeDays, setLeadTimeDays] = useState('4');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      api.request<any>(`/ingredients/${id}`).then((res) => {
        if (res.data) {
          setName(res.data.name || '');
          setSku(res.data.sku || '');
          setCategory(res.data.category || 'BOTANICAL');
          setUnit(res.data.unit || 'g');
          setCostPerUnit(String(res.data.costPerUnit || '10'));
          setSafetyStock(String(res.data.safetyStock || '20'));
          setReorderPoint(String(res.data.reorderPoint || '30'));
          setLeadTimeDays(String(res.data.leadTimeDays || '4'));
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!networkService.isOnline) {
      Alert.alert(
        'Offline Mode',
        'Inventory mutations require an active internet connection. Operation prevented by Online-Only Policy.',
      );
      return;
    }

    if (!name.trim() || !sku.trim()) {
      setError('Ingredient name and SKU are mandatory.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      unit: unit.trim(),
      costPerUnit: parseFloat(costPerUnit) || 0,
      safetyStock: parseFloat(safetyStock) || 0,
      reorderPoint: parseFloat(reorderPoint) || 0,
      leadTimeDays: parseInt(leadTimeDays, 10) || 4,
    };

    try {
      if (id) {
        await api.request(`/ingredients/${id}`, {
          method: 'PATCH',
          body: payload,
        });
      } else {
        await api.request('/ingredients', {
          method: 'POST',
          body: payload,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save ingredient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={id ? 'Edit Ingredient' : 'New Ingredient'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Ingredient Name"
            placeholder="e.g. Mandrake Root"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="SKU Identifier"
            placeholder="e.g. BOT-MAN-01"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  title={cat}
                  size="sm"
                  variant={category === cat ? 'primary' : 'ghost'}
                  onPress={() => setCategory(cat)}
                  style={styles.pillBtn}
                  textStyle={styles.pillText}
                />
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Input
              label="Base Unit"
              placeholder="g, ml, pairs"
              value={unit}
              onChangeText={setUnit}
              containerStyle={styles.halfField}
            />
            <Input
              label="Cost Per Unit ($)"
              placeholder="10.00"
              value={costPerUnit}
              onChangeText={setCostPerUnit}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Safety Stock"
              placeholder="20"
              value={safetyStock}
              onChangeText={setSafetyStock}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
            <Input
              label="Reorder Point"
              placeholder="30"
              value={reorderPoint}
              onChangeText={setReorderPoint}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
          </View>

          <Input
            label="Vendor Lead Time (Days)"
            placeholder="4"
            value={leadTimeDays}
            onChangeText={setLeadTimeDays}
            keyboardType="numeric"
          />

          <Button
            title={id ? 'Update Ingredient' : 'Create Ingredient'}
            onPress={handleSave}
            loading={submitting}
            disabled={!networkService.isOnline}
            style={styles.saveBtn}
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
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  saveBtn: {
    marginTop: theme.spacing.md,
  },
});
