import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171321',
        midnightPlum: '#241638',
        potionPurple: {
          DEFAULT: '#7046C8',
          hover: '#5D37B0',
          light: '#8E6BE0',
        },
        violetGlow: '#A78BFA',
        emberOrange: '#F28C28',
        paleLavender: '#F4F0FA',
        cloudWhite: '#FFFFFF',
        successGreen: '#23865B',
        warningAmber: '#B96B12',
        dangerRed: '#C23D4B',
        mutedText: '#6B6575',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

