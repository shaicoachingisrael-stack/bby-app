import { Platform } from 'react-native';

export const Palette = {
  encre: '#0A0A0A',
  albatre: '#FAFAF8',
  calcaire: '#F2F2F0',
  gray: {
    50: '#FAFAF8',
    100: '#F2F2F0',
    200: '#EAEAE6',
    300: '#C9C9C5',
    400: '#A8A8A4',
    500: '#757572',
    600: '#4A4A48',
    700: '#2A2A28',
    900: '#0A0A0A',
  },
} as const;

export const Colors = {
  light: {
    text: Palette.encre,
    textSecondary: Palette.gray[500],
    background: Palette.albatre,
    surface: Palette.calcaire,
    border: Palette.gray[200],
    tint: Palette.encre,
    icon: Palette.gray[500],
    tabIconDefault: Palette.gray[400],
    tabIconSelected: Palette.encre,
  },
  dark: {
    text: Palette.albatre,
    textSecondary: Palette.gray[400],
    background: Palette.encre,
    surface: Palette.gray[700],
    border: Palette.gray[600],
    tint: Palette.albatre,
    icon: Palette.gray[400],
    tabIconDefault: Palette.gray[500],
    tabIconSelected: Palette.albatre,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    display: 'Montserrat_600SemiBold',
    displayBold: 'Montserrat_700Bold',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    display: 'Montserrat_600SemiBold',
    displayBold: 'Montserrat_700Bold',
    mono: 'monospace',
  },
  default: {
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    display: 'Montserrat_600SemiBold',
    displayBold: 'Montserrat_700Bold',
    mono: 'monospace',
  },
})!;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;
