import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuth, TenantMembership } from '../../stores/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { theme } from '../../theme/colors';

export const TenantSelectionScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'TenantSelection'>>();
  const { tenants, activeTenant, selectTenant, logout } = useAuth();

  const handleSelect = async (tenant: TenantMembership) => {
    await selectTenant(tenant.id);
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={28} color={theme.colors.accentOrange} />
        </View>
        <Text style={styles.title}>Select Apothecary Shop</Text>
        <Text style={styles.subtitle}>
          Choose the tenant workspace you wish to manage on this device.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tenants.map((t) => {
          const isSelected = activeTenant?.id === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.7}
              onPress={() => handleSelect(t)}
            >
              <Card style={[styles.card, isSelected && styles.activeCard]}>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.name}>{t.name}</Text>
                    <Text style={styles.slug}>Tenant ID: {t.slug}</Text>
                  </View>
                  <View style={styles.rightSide}>
                    <Badge label={t.role} variant={t.role === 'OWNER' ? 'warning' : 'purple'} />
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.cauldronGreen}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Establish New Apothecary"
          variant="accent"
          onPress={() => navigation.navigate('Onboarding')}
          icon={<Ionicons name="add-circle" size={18} color={theme.colors.cloudWhite} />}
        />
        <Button
          title="Sign Out"
          variant="ghost"
          size="sm"
          onPress={logout}
          style={styles.signOutBtn}
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 117, 24, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
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
  list: {
    gap: 12,
  },
  card: {
    padding: theme.spacing.md,
  },
  activeCard: {
    borderColor: theme.colors.accentOrange,
    backgroundColor: 'rgba(255, 117, 24, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.colors.cloudWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  slug: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  checkIcon: {
    marginTop: 2,
  },
  actions: {
    gap: 8,
    marginTop: theme.spacing.md,
  },
  signOutBtn: {
    marginTop: 4,
  },
});
