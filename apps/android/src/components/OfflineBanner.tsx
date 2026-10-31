import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { networkService } from '../services/network';
import { theme } from '../theme/colors';

interface OfflineBannerProps {
  lastUpdated?: string;
  onRefresh?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ lastUpdated, onRefresh }) => {
  const [isOnline, setIsOnline] = useState(networkService.isOnline);

  useEffect(() => {
    return networkService.subscribe((online) => {
      setIsOnline(online);
    });
  }, []);

  if (isOnline) {
    return null;
  }

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color={theme.colors.accentOrange} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>OFFLINE MODE &bull; READ ONLY</Text>
          <Text style={styles.subtitle}>
            Mutations disabled. Showing cached data from {formattedTime}.
          </Text>
        </View>
      </View>
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Ionicons name="refresh" size={16} color={theme.colors.cloudWhite} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#381C06',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accentOrange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.accentOrange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  retryButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 117, 24, 0.25)',
  },
});

