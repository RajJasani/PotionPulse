import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'purple' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'purple', style }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(0, 230, 118, 0.15)', text: theme.colors.cauldronGreen };
      case 'warning':
        return { bg: 'rgba(255, 117, 24, 0.15)', text: theme.colors.accentOrange };
      case 'danger':
        return { bg: 'rgba(255, 23, 68, 0.15)', text: theme.colors.crimson };
      case 'neutral':
        return { bg: 'rgba(142, 130, 166, 0.15)', text: theme.colors.textMuted };
      case 'purple':
      default:
        return { bg: 'rgba(112, 70, 200, 0.18)', text: theme.colors.violetGlow };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
