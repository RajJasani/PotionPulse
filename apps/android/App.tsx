import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HealthResponseData } from '@potionpulse/contracts';
import { colors } from '@potionpulse/ui-tokens';

export default function App() {
  const [health, setHealth] = useState<HealthResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHealth(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'API connection failed';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>PHASE 0 BOOTSTRAP</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>PotionPulse</Text>
        <Text style={styles.subtitle}>Predict. Manage. Thrive.</Text>
        <Text style={styles.description}>
          Android Inventory Intelligence Client connected to unified NestJS backend.
        </Text>

        {/* Diagnostics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobile Diagnostics</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Client:</Text>
            <Text style={styles.rowValue}>React Native (Expo SDK 52)</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Contracts:</Text>
            <Text style={styles.rowValue}>@potionpulse/contracts linked</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Design Tokens:</Text>
            <Text style={styles.rowValue}>@potionpulse/ui-tokens linked</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Backend Status:</Text>
            <Text
              style={[
                styles.rowValue,
                { color: health ? colors.successGreen : colors.warningAmber },
              ]}
            >
              {loading
                ? 'Probing...'
                : health
                ? `● ${health.status.toUpperCase()} (${health.version})`
                : '● Offline / Pending'}
            </Text>
          </View>

          {error && <Text style={styles.errorText}>Notice: {error}</Text>}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={checkApiHealth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.refreshButtonText}>Probe Backend API</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            MSOT Track 01 — Shared Backend, Single Source of Truth
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  badgeContainer: {
    backgroundColor: 'rgba(112, 70, 200, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(112, 70, 200, 0.4)',
    marginBottom: 12,
  },
  badgeText: {
    color: colors.violetGlow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.violetGlow,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
    maxWidth: 280,
  },
  card: {
    width: '100%',
    backgroundColor: colors.midnightPlum,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.mutedText,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cloudWhite,
  },
  errorText: {
    fontSize: 12,
    color: colors.dangerRed,
    marginTop: 6,
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: colors.potionPurple,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  infoBox: {
    marginTop: 24,
    padding: 12,
  },
  infoText: {
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
  },
});

