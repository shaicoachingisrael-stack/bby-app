import type { LucideIcon } from 'lucide-react-native';
import { useId, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Fonts } from '@/constants/theme';

// Maquette « en tuiles » (05/11/2026) : moins d'écrit, des carrés à grosse icône.
// Chaque famille de couleur = un dégradé clair → profond + une ombre de sa teinte.
export const TileColors = {
  rose: { from: '#FF8DB5', to: '#E8336F', soft: '#FF8DB5' },
  orange: { from: '#FFB27A', to: '#F0621C', soft: '#FFB27A' },
  mint: { from: '#7DF3C6', to: '#14AE74', soft: '#7DF3C6' },
  violet: { from: '#C9B3FF', to: '#7451EE', soft: '#C9B3FF' },
  blue: { from: '#97D5FF', to: '#2A86E0', soft: '#97D5FF' },
  ember: { from: '#FF5C93', to: '#FFA24A', soft: '#FF8DB5' },
} as const;

export type TileColor = keyof typeof TileColors;

export const TileText = {
  primary: '#FFF4EE',
  secondary: '#D9CFD8',
  muted: '#A99DAA',
} as const;

// Carré (ou rond) en dégradé portant une icône blanche.
export function IconBadge({
  icon: Icon,
  color,
  size = 48,
  iconSize,
  round = false,
  strokeWidth = 1.9,
}: {
  icon: LucideIcon;
  color: TileColor;
  size?: number;
  iconSize?: number;
  round?: boolean;
  strokeWidth?: number;
}) {
  const c = TileColors[color];
  const id = useId().replace(/:/g, '');
  const radius = round ? size / 2 : Math.round(size * 0.33);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        shadowColor: c.to,
        shadowOpacity: 0.7,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.from} />
              <Stop offset="1" stopColor={c.to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
        {/* reflet en haut du carré */}
        <View style={styles.sheen} />
      </View>
      <View style={styles.center}>
        <Icon size={iconSize ?? Math.round(size * 0.5)} color="#FFFFFF" strokeWidth={strokeWidth} />
      </View>
    </View>
  );
}

// Carte sombre légèrement bombée : fond dégradé, liseré clair d'un pixel.
export function TileCard({
  children,
  onPress,
  style,
  accessibilityLabel,
  radius = 22,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  radius?: number;
}) {
  const id = useId().replace(/:/g, '');
  const body = (
    <>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1E1627" />
              <Stop offset="1" stopColor="#140E1B" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </>
  );
  const base = [styles.card, { borderRadius: radius }, style];
  if (!onPress) return <View style={base}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
    >
      {body}
    </Pressable>
  );
}

// Petit carré « icône + un mot », la brique de base des grilles.
export function IconTile({
  icon,
  color,
  label,
  onPress,
  badge,
  size = 48,
}: {
  icon: LucideIcon;
  color: TileColor;
  label: string;
  onPress?: () => void;
  badge?: ReactNode;
  size?: number;
}) {
  return (
    <TileCard onPress={onPress} accessibilityLabel={label} style={styles.tile}>
      <IconBadge icon={icon} color={color} size={size} />
      <Text numberOfLines={1} style={styles.tileLabel}>
        {label}
      </Text>
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </TileCard>
  );
}

// Titre de section en petites capitales espacées.
export function SectionLabel({ children, right }: { children: string; right?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children.toUpperCase()}</Text>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  tile: { flex: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 12, paddingHorizontal: 4, gap: 10 },
  tileLabel: { color: TileText.primary, fontSize: 12, fontFamily: Fonts.sansSemibold },
  badge: { position: 'absolute', top: 7, right: 7 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 26,
    marginBottom: 12,
  },
  section: { fontSize: 11, letterSpacing: 1.6, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  sectionRight: { fontSize: 12, color: TileText.muted, fontFamily: Fonts.sans },
});
