import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { theme } from '../../theme/colors';

interface NotificationItem {
  id: string;
  type: 'STOCK' | 'CURSE' | 'PO' | 'AUDIT';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  targetScreen?: keyof RootStackParamList;
}

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'STOCK',
      title: 'Critical Stockout Risk',
      message: 'Ghost Pepper Essence is below 24h cover. Reorder recommended.',
      time: '12m ago',
      isRead: false,
      targetScreen: 'RestockRecommendations',
    },
    {
      id: '2',
      type: 'CURSE',
      title: 'Midnight Curse Active',
      message: '3.0x multiplier active on Bat Wings and Mandrake Root.',
      time: '1h ago',
      isRead: false,
      targetScreen: 'MidnightCurse',
    },
    {
      id: '3',
      type: 'PO',
      title: 'Shipment Received: PO-2026-079',
      message: 'Obsidian Dust (100g) added to Vault Shelf A-1.',
      time: '4h ago',
      isRead: true,
      targetScreen: 'MovementsHistory',
    },
    {
      id: '4',
      type: 'AUDIT',
      title: 'New Staff Member Added',
      message: 'Apprentice Lyra assigned INVENTORY_STAFF role.',
      time: '1d ago',
      isRead: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="Read All"
            variant="ghost"
            size="sm"
            onPress={markAllRead}
          />
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (item.targetScreen) {
                  navigation.navigate(item.targetScreen as any);
                }
              }}
            >
              <Card style={[styles.card, !item.isRead && styles.cardUnread]}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}>
                    {item.type === 'STOCK' && (
                      <Ionicons name="alert" size={18} color={theme.colors.crimson} />
                    )}
                    {item.type === 'CURSE' && (
                      <Ionicons name="flame" size={18} color={theme.colors.accentOrange} />
                    )}
                    {item.type === 'PO' && (
                      <Ionicons name="checkmark-done" size={18} color={theme.colors.cauldronGreen} />
                    )}
                    {item.type === 'AUDIT' && (
                      <Ionicons name="shield" size={18} color={theme.colors.violetGlow} />
                    )}
                  </View>

                  <View style={styles.contentBlock}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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
    gap: 10,
  },
  card: {
    padding: theme.spacing.md,
  },
  cardUnread: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(112, 70, 200, 0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  contentBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    color: theme.colors.cloudWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

