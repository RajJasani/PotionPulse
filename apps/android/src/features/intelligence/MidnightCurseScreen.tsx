import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { theme } from '../../theme/colors';

export const MidnightCurseScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const affectedIngredients = [
    { name: 'Bat Wings', normalDaily: 12, curseDaily: 36, unit: 'pairs' },
    { name: 'Mandrake Root', normalDaily: 15, curseDaily: 45, unit: 'g' },
    { name: 'Ghost Pepper Essence', normalDaily: 10, curseDaily: 30, unit: 'ml' },
    { name: 'Dragon Scale', normalDaily: 2, curseDaily: 6, unit: 'scales' },
  ];

  return (
    <View style={styles.container}>
      <Header title="The Midnight Curse" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner */}
        <Card style={styles.banner}>
          <View style={styles.bannerTop}>
            <View style={styles.badge}>
              <Ionicons name="flame" size={14} color="#000" />
              <Text style={styles.badgeText}>APEX MYSTICAL EVENT</Text>
            </View>
            <Badge label="Active Oct 28 - Nov 2" variant="warning" />
          </View>

          <Text style={styles.bannerTitle}>The Midnight Curse is Unleashed</Text>
          <Text style={styles.bannerDesc}>
            Spooky season peak increases realm apothecary customer demand by 300%. All safety buffers and restock calculations automatically apply a 3.0x deterministic multiplier to prevent cauldrons from running dry.
          </Text>

          <View style={styles.multiplierBox}>
            <Text style={styles.multiplierLabel}>Current Demand Surge Multiplier</Text>
            <Text style={styles.multiplierVal}>3.0x</Text>
          </View>
        </Card>

        {/* Impact List */}
        <Text style={styles.sectionHeader}>Surge-Impacted Ingredients</Text>
        <View style={styles.list}>
          {affectedIngredients.map((item) => (
            <Card key={item.name} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Badge label="3.0x Surge" variant="warning" />
              </View>

              <View style={styles.rateRow}>
                <View style={styles.rateCol}>
                  <Text style={styles.rateLabel}>Normal Velocity</Text>
                  <Text style={styles.rateVal}>
                    {item.normalDaily} {item.unit} / day
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.accentOrange} />
                <View style={styles.rateCol}>
                  <Text style={styles.rateLabel}>Curse Velocity</Text>
                  <Text style={[styles.rateVal, { color: theme.colors.accentOrange }]}>
                    {item.curseDaily} {item.unit} / day
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Button
          title="Inspect Reorder Recommendations"
          variant="accent"
          onPress={() => navigation.navigate('RestockRecommendations')}
          icon={<Ionicons name="cart" size={18} color={theme.colors.cloudWhite} />}
          style={styles.actionBtn}
        />
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
  banner: {
    backgroundColor: '#261208',
    borderColor: theme.colors.accentOrange,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  bannerTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 20,
    fontWeight: '800',
  },
  bannerDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 10,
  },
  multiplierBox: {
    backgroundColor: theme.colors.inputBackground,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  multiplierLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  multiplierVal: {
    color: theme.colors.accentOrange,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionHeader: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  list: {
    gap: 10,
  },
  itemCard: {
    padding: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: theme.colors.cloudWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  rateCol: {
    flex: 1,
  },
  rateLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  rateVal: {
    color: theme.colors.cloudWhite,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  actionBtn: {
    marginTop: 4,
  },
});
