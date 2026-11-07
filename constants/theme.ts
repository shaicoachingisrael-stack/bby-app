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

// Trois apparences. `light` et `dark` = identité d'origine de Shy (encre / albâtre).
// `ember` = proposition de refonte : nuit prune, lumière chaude.
// Jetons d'action communs aux trois :
//   accent → accentMid → accentEnd : la « zone lumineuse », une seule par écran
//   onAccent : texte posé dessus ; done : ce qui est fait ; surfaceAlt : creux d'une carte
export const Colors = {
  light: {
    text: Palette.encre,
    textSecondary: Palette.gray[500],
    background: Palette.albatre,
    surface: Palette.calcaire,
    surfaceAlt: Palette.gray[200],
    border: Palette.gray[200],
    tint: Palette.encre,
    icon: Palette.gray[500],
    tabIconDefault: Palette.gray[400],
    tabIconSelected: Palette.encre,
    accent: Palette.encre,
    accentMid: Palette.encre,
    accentEnd: Palette.encre,
    accentSoft: 'rgba(10,10,10,0.06)',
    onAccent: Palette.albatre,
    done: Palette.encre,
    tabBar: 'rgba(250,250,248,0.82)',
  },
  dark: {
    text: Palette.albatre,
    textSecondary: Palette.gray[400],
    background: Palette.encre,
    surface: Palette.gray[700],
    surfaceAlt: Palette.gray[600],
    border: Palette.gray[600],
    tint: Palette.albatre,
    icon: Palette.gray[400],
    tabIconDefault: Palette.gray[500],
    tabIconSelected: Palette.albatre,
    accent: Palette.albatre,
    accentMid: Palette.albatre,
    accentEnd: Palette.albatre,
    accentSoft: 'rgba(250,250,248,0.08)',
    onAccent: Palette.encre,
    done: Palette.albatre,
    tabBar: 'rgba(20,20,18,0.7)',
  },
  // « ember » = l'apparence par défaut, devenue la charte de la refonte de Shaï
  // (nov. 2026) : noir, blanc cassé, jaune. Mêmes valeurs que `Bby` (components/bby/kit.tsx).
  ember: {
    text: '#FAFAF8',
    textSecondary: '#A8A8A4',
    background: '#0A0A0A',
    surface: '#1C1C1B',
    surfaceAlt: '#2A2A28',
    border: 'rgba(250,250,248,0.16)',
    tint: '#E8F27C',
    icon: '#A8A8A4',
    tabIconDefault: '#A8A8A4',
    tabIconSelected: '#0A0A0A',
    accent: '#E8F27C',
    accentMid: '#E8F27C',
    accentEnd: '#E8F27C',
    accentSoft: 'rgba(232,242,124,0.14)',
    onAccent: '#0A0A0A',
    done: '#E8F27C',
    tabBar: '#1E1E1D',
  },
};

export type SchemeName = keyof typeof Colors;

const DISPLAY_FONTS = {
  ember: { display: 'Syne_700Bold', displayBold: 'Syne_800ExtraBold' },
  encre: { display: 'Montserrat_600SemiBold', displayBold: 'Montserrat_700Bold' },
} as const;

// Les écrans lisent `Fonts.display` au rendu : changer d'apparence = changer ces
// deux entrées, puis remonter l'arbre (voir app/_layout.tsx).
export const Fonts: {
  sans: string;
  sansMedium: string;
  sansSemibold: string;
  sansBold: string;
  display: string;
  displayBold: string;
  mono: string;
} = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  ...DISPLAY_FONTS.ember,
  mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace',
};

export function applyDisplayFonts(appearance: keyof typeof DISPLAY_FONTS) {
  Fonts.display = DISPLAY_FONTS[appearance].display;
  Fonts.displayBold = DISPLAY_FONTS[appearance].displayBold;
}

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
