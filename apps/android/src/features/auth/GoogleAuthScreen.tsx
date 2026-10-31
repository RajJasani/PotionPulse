import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../stores/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../theme/colors';

export const GoogleAuthScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'GoogleAuth'>>();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockGoogleAccounts = [
    { name: 'Archmage Theron', email: 'theron.alchemist@gmail.com' },
    { name: 'Elder Morgana', email: 'morgana.spells@gmail.com' },
  ];

  const handleSelectAccount = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(`mock-google-token-for-${email}`);
      navigation.replace('MainTabs');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.googleIcon}>
            <Ionicons name="logo-google" size={28} color="#EA4335" />
          </View>
          <Text style={styles.title}>Sign in with Google</Text>
          <Text style={styles.subtitle}>Choose an account to continue to PotionPulse</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.accountsList}>
          {mockGoogleAccounts.map((account) => (
            <TouchableOpacity
              key={account.email}
              activeOpacity={0.7}
              disabled={loading}
              onPress={() => handleSelectAccount(account.email)}
              style={styles.accountRow}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{account.name[0]}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountEmail}>{account.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  googleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.cloudWhite,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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
  accountsList: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.cloudWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: theme.colors.cloudWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  accountEmail: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  cancelBtn: {
    marginTop: 8,
  },
});

