import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../stores/AuthContext';
import { networkService } from '../../services/network';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Header } from '../../components/Header';
import { theme } from '../../theme/colors';

export const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeTenant, logout } = useAuth();

  const [isOnlineState, setIsOnlineState] = useState(networkService.isOnline);

  useEffect(() => {
    return networkService.subscribe((online) => {
      setIsOnlineState(online);
    });
  }, []);

  const handleToggleOnline = (val: boolean) => {
    networkService.setOnlineStatus(val);
    setIsOnlineState(val);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you wish to log out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('SignIn');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile & Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.displayName ? user.displayName[0] : 'A'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Alchemist'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'alchemist@potionpulse.io'}</Text>
            {activeTenant && (
              <Badge label={activeTenant.role} variant="warning" style={styles.roleBadge} />
            )}
          </View>
        </Card>

        {/* Tenant Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Apothecary Workspace</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{activeTenant?.name || 'My Shop'}</Text>
              <Text style={styles.rowSubtitle}>Workspace: {activeTenant?.slug || 'shop'}</Text>
            </View>
            <Button
              title="Switch"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('TenantSelection')}
            />
          </View>
        </Card>

        {/* Online-Only Policy Simulation */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Network & Online-Only Policy</Text>
          <View style={styles.row}>
            <View style={styles.networkInfo}>
              <View style={styles.networkStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnlineState ? theme.colors.cauldronGreen : theme.colors.accentOrange },
                  ]}
                />
                <Text style={styles.rowTitle}>
                  {isOnlineState ? 'Network Connected' : 'Offline Mode Active'}
                </Text>
              </View>
              <Text style={styles.rowSubtitle}>
                {isOnlineState
                  ? 'ACID ledger mutations permitted.'
                  : 'Write operations blocked. Read-only cached views enabled.'}
              </Text>
            </View>

            <Switch
              value={isOnlineState}
              onValueChange={handleToggleOnline}
              trackColor={{ false: theme.colors.crimson, true: theme.colors.cauldronGreen }}
              thumbColor={theme.colors.cloudWhite}
            />
          </View>
        </Card>

        {/* System & Architecture Info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Architecture & Synchronization</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Centralized Backend</Text>
            <Text style={styles.infoVal}>NestJS + MongoDB Atlas</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Web / Mobile Parity</Text>
            <Text style={styles.infoVal}>Shared Contracts v1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ledger Integrity</Text>
            <Text style={styles.infoVal}>Strict Non-Negative Invariant</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of PotionPulse"
          variant="danger"
          onPress={handleSignOut}
          icon={<Ionicons name="log-out" size={18} color={theme.colors.cloudWhite} />}
          style={styles.signOutBtn}
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.cloudWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.colors.cloudWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
  },
  sectionCard: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: theme.colors.cloudWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  networkInfo: {
    flex: 1,
    marginRight: 10,
  },
  networkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  infoVal: {
    color: theme.colors.cloudWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: 10,
    marginBottom: 40,
  },
});
