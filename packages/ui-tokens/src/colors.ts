export const colors = {
  ink: '#171321',
  midnightPlum: '#241638',
  potionPurple: '#7046C8',
  violetGlow: '#A78BFA',
  emberOrange: '#F28C28',
  paleLavender: '#F4F0FA',
  cloudWhite: '#FFFFFF',
  successGreen: '#23865B',
  warningAmber: '#B96B12',
  dangerRed: '#C23D4B',
  mutedText: '#6B6575',
} as const;

export type ColorToken = keyof typeof colors;

