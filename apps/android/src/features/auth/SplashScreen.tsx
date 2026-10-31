import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../stores/AuthContext';
import { theme } from '../../theme/colors';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Splash'>>();
  const { isAuthenticated, isLoading, activeTenant, tenants } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        if (!activeTenant && tenants.length > 1) {
          navigation.replace('TenantSelection');
        } else if (!activeTenant && tenants.length === 0) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        navigation.replace('SignIn');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, activeTenant, tenants, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={44} color={theme.colors.accentOrange} />
        </View>
        <Text style={styles.title}>PotionPulse</Text>
        <Text style={styles.tagline}>PREDICT &bull; MANAGE &bull; THRIVE</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerText}>Connecting to Apothecary Core...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(112, 70, 200, 0.25)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.cloudWhite,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: theme.colors.accentOrange,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});

