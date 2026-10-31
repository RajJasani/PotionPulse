import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../theme/colors';

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Onboarding'>>();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [shopName, setShopName] = useState('My Apex Apothecary');
  const [currency, setCurrency] = useState('USD');
  const [primaryShelf, setPrimaryShelf] = useState('Vault Shelf A-1');
  const [safetyBufferDays, setSafetyBufferDays] = useState('14');

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as any);
    } else {
      navigation.replace('MainTabs');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP {step} OF 3</Text>
        </View>
        <Text style={styles.title}>Apothecary Onboarding</Text>
        <Text style={styles.subtitle}>
          Configure your storage zones, default units, and stock safety buffers.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={24} color={theme.colors.accentOrange} />
              <Text style={styles.cardTitle}>Shop Identity & Currency</Text>
            </View>
            <Input
              label="Apothecary Shop Name"
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Starfall Elixirs"
            />
            <Input
              label="Standard Valuation Currency"
              value={currency}
              onChangeText={setCurrency}
              placeholder="USD ($), EUR (€), or CRYSTAL (✦)"
            />
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube" size={24} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Primary Receiving Shelf</Text>
            </View>
            <Input
              label="Initial Warehouse Shelf / Zone"
              value={primaryShelf}
              onChangeText={setPrimaryShelf}
              placeholder="e.g. Vault Shelf A-1"
            />
            <Text style={styles.hint}>
              Incoming shipments will be automatically posted to this shelf location until moved.
            </Text>
          </Card>
        )}

        {step === 3 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.cauldronGreen} />
              <Text style={styles.cardTitle}>Buffer & Seasonal Rules</Text>
            </View>
            <Input
              label="Target Coverage Horizon (Days)"
              value={safetyBufferDays}
              onChangeText={setSafetyBufferDays}
              keyboardType="numeric"
              placeholder="14"
            />
            <View style={styles.curseBox}>
              <Ionicons name="flame" size={20} color={theme.colors.accentOrange} />
              <Text style={styles.curseText}>
                Midnight Curse seasonal multiplier (3.0x) is pre-configured and enabled for spooky season.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === 3 ? 'Launch Apothecary Dashboard' : 'Continue'}
          onPress={handleNext}
          icon={
            step === 3 ? (
              <Ionicons name="sparkles" size={18} color={theme.colors.cloudWhite} />
            ) : (
              <Ionicons name="arrow-forward" size={18} color={theme.colors.cloudWhite} />
            )
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  stepBadge: {
    backgroundColor: 'rgba(112, 70, 200, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
  },
  stepBadgeText: {
    color: theme.colors.violetGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.cloudWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  curseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 117, 24, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accentOrange,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
  },
  curseText: {
    color: theme.colors.accentOrange,
    fontSize: 12,
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
  },
});
