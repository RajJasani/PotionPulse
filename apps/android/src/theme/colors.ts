import { colors as baseColors } from '@potionpulse/ui-tokens';

export const theme = {
  colors: {
    ...baseColors,
    // Specialized Apothecary UI accents
    background: '#0D0614',
    cardBackground: '#171321',
    cardBorder: 'rgba(112, 70, 200, 0.25)',
    inputBackground: '#120D1C',
    inputBorder: 'rgba(112, 70, 200, 0.35)',
    primary: '#7046C8', // Potion Purple
    primaryDark: '#4A1D7A',
    accentOrange: '#FF7518', // Pumpkin / Ember
    cauldronGreen: '#00E676', // Toxic / Success Green
    crimson: '#FF1744', // Danger / Critical Red
    amethyst: '#9933FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#D1C4E9',
    textMuted: '#8E82A6',
    overlay: 'rgba(13, 6, 20, 0.85)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};

