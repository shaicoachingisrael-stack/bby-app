// Kit visuel de la refonte de Shaï (novembre 2026) : noir, blanc cassé, jaune.
// Toutes les couleurs et polices passent par `Bby` / `BFont` : quand la charte
// définitive arrivera (couleurs, typos), on ne change que ces deux objets.
import { useRouter } from 'expo-router';
import { Check, Settings, type LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Bby = {
  bg: '#0A0A0A',
  card: '#1C1C1B',
  cardAlt: '#2A2A28',
  light: '#FAFAF8',
  lightAlt: '#EAEAE6',
  yellow: '#E8F27C',
  ink: '#0A0A0A',
  text: '#FAFAF8',
  muted: '#A8A8A4',
  mutedOnLight: '#5F5F5C',
  line: 'rgba(250,250,248,0.18)',
  lineOnLight: 'rgba(10,10,10,0.10)',
  plateVeg: '#4A4A48',
} as const;

export const BFont = {
  display: 'Syne_800ExtraBold',
  displayBold: 'Syne_700Bold',
  serif: 'Fraunces_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

/** Espace à laisser sous le contenu pour la barre du bas flottante. */
export const TAB_BAR_SPACE = 120;

// ---------------------------------------------------------------------------
// Écran

export function BbyScreen({
  children,
  scroll = true,
  contentStyle,
  bottomSpace = TAB_BAR_SPACE,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bottomSpace?: number;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 12, paddingBottom: insets.bottom + bottomSpace };
  if (!scroll) return <View style={[s.screen, pad, s.inner, contentStyle]}>{children}</View>;
  return (
    <View style={s.screen}>
      <ScrollView style={s.screen} contentContainerStyle={[pad, s.inner, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <StatusFill />
    </View>
  );
}

/** Bande opaque sous l'heure et la batterie : le contenu qui défile passe dessous sans s'y mélanger. */
export function StatusFill({ color = Bby.bg }: { color?: string }) {
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[s.statusFill, { height: insets.top, backgroundColor: color }]} />;
}

/** « Bonjour Camille » + réglages + pastille jaune avec l'initiale. */
export function TopBar({ name, onSettings }: { name: string; onSettings?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const initial = (name || ' ')[0].toUpperCase();
  return (
    <View style={s.topBar}>
      <Text style={s.hello} numberOfLines={1}>
        {name ? t('v2today.hello', { name }) : ' '}
      </Text>
      <View style={s.row8}>
        {onSettings ? (
          <RoundButton icon={Settings} variant="outline" size={48} onPress={onSettings} label={t('account.title')} />
        ) : null}
        <Pressable
          onPress={() => router.push('/account' as any)}
          accessibilityRole="button"
          accessibilityLabel={t('account.title')}
          style={[s.avatar, { width: 52, height: 52 }]}
        >
          <Text style={s.avatarText}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function BigTitle({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[s.bigTitle, style]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
      {children}
    </Text>
  );
}

export function SectionHeader({ title, right, onRight }: { title: string; right?: string; onRight?: () => void }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right ? (
        <Pressable onPress={onRight} disabled={!onRight} hitSlop={10}>
          <Text style={s.sectionRight}>{right}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Puces

export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  activeYellow = false,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
  activeYellow?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills} style={s.pillsWrap}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[s.pill, on && { backgroundColor: activeYellow ? Bby.yellow : Bby.light, borderColor: 'transparent' }]}
          >
            <Text style={[s.pillText, on && { color: Bby.ink }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Chip({ label, yellow, dark }: { label: string; yellow?: boolean; dark?: boolean }) {
  return (
    <View style={[s.chip, yellow && { backgroundColor: Bby.yellow, borderColor: 'transparent' }, dark && { borderColor: Bby.lineOnLight }]}>
      <Text style={[s.chipText, (yellow || dark) && { color: Bby.ink }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cartes

/** La carte jaune légèrement inclinée : une seule par écran. */
export function TiltCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.tilt, style]}>{children}</View>;
}

export function Card({
  children,
  tone = 'dark',
  style,
  onPress,
  dashed,
}: {
  children: ReactNode;
  tone?: 'dark' | 'alt' | 'light' | 'yellow';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  dashed?: boolean;
}) {
  const bg =
    tone === 'light' ? Bby.light : tone === 'yellow' ? Bby.yellow : tone === 'alt' ? Bby.cardAlt : Bby.card;
  const body = (
    <View style={[s.card, { backgroundColor: dashed ? 'transparent' : bg }, dashed && s.dashed, style]}>{children}</View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {body}
    </Pressable>
  );
}

/** Couleur du texte à poser sur une carte selon son ton. */
export function onTone(tone: 'dark' | 'alt' | 'light' | 'yellow') {
  const light = tone === 'light' || tone === 'yellow';
  return { text: light ? Bby.ink : Bby.text, muted: light ? Bby.mutedOnLight : Bby.muted };
}

/** Carte « Ta journée » : photo en haut, libellé, grand titre, bouton rond. */
export function PhotoCard({
  label,
  title,
  sub,
  tone = 'dark',
  photo,
  photoHint,
  button,
  onPress,
}: {
  label: string;
  title: string;
  sub?: string;
  tone?: 'dark' | 'light';
  photo?: string | null;
  photoHint?: string;
  button: ReactNode;
  onPress?: () => void;
}) {
  const c = onTone(tone);
  return (
    <Card tone={tone} onPress={onPress} style={{ padding: 10 }}>
      <View style={[s.photo, { backgroundColor: tone === 'light' ? Bby.lightAlt : '#151514' }]}>
        {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        {!photo && photoHint ? <Text style={[s.photoHint, { color: c.muted }]}>{photoHint}</Text> : null}
      </View>
      <View style={s.photoBody}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardLabel, { color: c.muted }]}>{label}</Text>
          <Text style={[s.cardTitle, { color: c.text }]} numberOfLines={2}>
            {title}
          </Text>
          {sub ? <Text style={[s.cardSub, { color: c.muted }]}>{sub}</Text> : null}
        </View>
        {button}
      </View>
    </Card>
  );
}

/** Carte simple : libellé, titre, sous-titre, bouton rond à droite. */
export function RowCard({
  label,
  title,
  sub,
  tone = 'dark',
  right,
  onPress,
  left,
  badge,
}: {
  label?: string;
  badge?: ReactNode;
  title: string;
  sub?: string;
  tone?: 'dark' | 'alt' | 'light' | 'yellow';
  right?: ReactNode;
  onPress?: () => void;
  left?: ReactNode;
}) {
  const c = onTone(tone);
  return (
    <Card tone={tone} onPress={onPress}>
      <View style={s.rowCard}>
        {left}
        <View style={{ flex: 1 }}>
          {label ? <Text style={[s.cardLabel, { color: c.muted }]}>{label}</Text> : null}
          {badge ? <View style={{ marginBottom: 8 }}>{badge}</View> : null}
          <Text style={[s.rowTitle, { color: c.text }]} numberOfLines={3}>
            {title}
          </Text>
          {sub ? <Text style={[s.cardSub, { color: c.muted }]}>{sub}</Text> : null}
        </View>
        {right}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Boutons

export function RoundButton({
  icon: Icon,
  variant = 'outline',
  size = 56,
  onPress,
  label,
  iconColor,
  filled,
}: {
  icon: LucideIcon;
  filled?: boolean;
  variant?: 'outline' | 'outlineDark' | 'black' | 'yellow' | 'white';
  size?: number;
  onPress?: () => void;
  label?: string;
  iconColor?: string;
}) {
  const bg = variant === 'black' ? Bby.ink : variant === 'yellow' ? Bby.yellow : variant === 'white' ? Bby.light : 'transparent';
  const fg =
    iconColor ??
    (variant === 'black' ? Bby.yellow : variant === 'yellow' || variant === 'white' || variant === 'outlineDark' ? Bby.ink : Bby.text);
  const border = variant === 'outline' ? Bby.text : variant === 'outlineDark' ? Bby.ink : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: border, borderWidth: border === 'transparent' ? 0 : 1.5 },
        s.center,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      <Icon size={Math.round(size * 0.36)} color={fg} fill={filled ? fg : 'none'} strokeWidth={2} />
    </Pressable>
  );
}

/** Bouton noir en pilule (« C'est fait », « Écrire »). */
export function PillButton({
  label,
  icon: Icon,
  onPress,
  variant = 'black',
  style,
}: {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  variant?: 'black' | 'outline' | 'outlineDark' | 'white' | 'yellow';
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'black' ? Bby.ink : variant === 'white' ? Bby.light : variant === 'yellow' ? Bby.yellow : 'transparent';
  const fg = variant === 'black' ? Bby.yellow : variant === 'outline' ? Bby.text : Bby.ink;
  const border = variant === 'outline' ? Bby.line : variant === 'outlineDark' ? Bby.ink : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.pillBtn,
        { backgroundColor: bg, borderColor: border, borderWidth: border === 'transparent' ? 0 : 1.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {Icon ? <Icon size={18} color={fg} strokeWidth={2.2} /> : null}
      <Text style={[s.pillBtnText, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Grande barre blanche fixée en bas, pastille jaune à gauche (« Terminé »). */
export function ActionBar({
  label,
  icon: Icon = Check,
  onPress,
  disabled,
  note,
  trailing,
}: {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  disabled?: boolean;
  note?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [s.actionBar, disabled && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
      >
        <View style={s.actionDot}>
          <Icon size={20} color={Bby.ink} strokeWidth={2.4} />
        </View>
        <Text style={s.actionText}>{label}</Text>
        <View style={{ width: 48, alignItems: 'center' }}>{trailing}</View>
      </Pressable>
      {note ? <Text style={s.actionNote}>{note}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Textes et chiffres

export function Editorial({ children, style, dark }: { children: string; style?: StyleProp<TextStyle>; dark?: boolean }) {
  return <Text style={[s.editorial, { color: dark ? Bby.ink : Bby.text }, style]}>{children}</Text>;
}

/** Trois tuiles jaunes Protéines / Lipides / Glucides. */
export function MacroTiles({
  values,
  subs,
  labels = ['Protéines', 'Lipides', 'Glucides'],
}: {
  values: [number | string, number | string, number | string];
  subs?: [string, string, string];
  labels?: [string, string, string];
}) {
  // Même taille de chiffre dans les trois tuiles : un « 262 » ne doit pas paraître plus petit qu'un « 96 ».
  const longest = Math.max(...values.map((v) => String(v).length));
  const valueSize = longest >= 4 ? { fontSize: 18 } : longest === 3 ? { fontSize: 22 } : null;
  return (
    <View style={s.tiles}>
      {values.map((v, i) => (
        <View key={i} style={s.tile}>
          <Text style={s.tileLabel}>{labels[i]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={[s.tileValue, valueSize]} numberOfLines={1}>
              {v}
            </Text>
            <Text style={s.tileUnit}>g</Text>
          </View>
          {subs ? <Text style={s.tileSub}>{subs[i]}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Bandeau de la semaine L M M J V S D, jour choisi en rond jaune. */
export function WeekStrip({
  days,
  selected,
  onSelect,
  boxed,
}: {
  days: { key: string; letter: string; num: number }[];
  selected: string;
  onSelect?: (k: string) => void;
  boxed?: boolean;
}) {
  return (
    <View style={s.week}>
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <Pressable key={d.key} onPress={() => onSelect?.(d.key)} disabled={!onSelect} style={[s.weekDay, boxed && s.weekBox, boxed && on && { backgroundColor: Bby.light }]}>
            <Text style={[s.weekLetter, on && { color: boxed ? Bby.ink : Bby.text, fontFamily: BFont.sansBold }]}>{d.letter}</Text>
            {boxed ? (
              <Text style={[s.weekNumBoxed, on && { color: Bby.ink }]}>{d.num}</Text>
            ) : (
              <View style={[s.weekNum, on && { backgroundColor: Bby.yellow }]}>
                <Text style={[s.weekNumText, on && { color: Bby.ink, fontFamily: BFont.sansBold }]}>{d.num}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** La semaine (lundi → dimanche) qui contient `ref`. */
export function weekOf(ref: Date, letters = ['L', 'M', 'M', 'J', 'V', 'S', 'D']) {
  const d = new Date(ref);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return letters.map((letter, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return { key: isoDay(x), letter, num: x.getDate(), date: x };
  });
}

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Case ronde à cocher (28 px, zone tactile 56). */
export function CheckCircle({ checked, onPress, size = 28 }: { checked: boolean; onPress?: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        { width: size, height: size, borderRadius: size / 2, borderWidth: checked ? 0 : 1.5, borderColor: Bby.muted },
        checked && { backgroundColor: Bby.yellow },
        s.center,
      ]}
    >
      {checked ? <Check size={size * 0.55} color={Bby.ink} strokeWidth={3} /> : null}
    </Pressable>
  );
}

export const kit = StyleSheet.create({
  gap10: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Bby.bg },
  statusFill: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Bby.bg },
  inner: { paddingHorizontal: 22, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  hello: { color: Bby.muted, fontFamily: BFont.sans, fontSize: 17, flex: 1 },
  avatar: { borderRadius: 26, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontFamily: BFont.display, fontSize: 22, color: Bby.ink },
  bigTitle: { fontFamily: BFont.display, fontSize: 56, lineHeight: 64, color: Bby.text, letterSpacing: -1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 4 },
  sectionTitle: { fontFamily: BFont.display, fontSize: 20, color: Bby.text, letterSpacing: -0.3, flexShrink: 1 },
  sectionRight: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted },
  pillsWrap: { marginHorizontal: -22, flexGrow: 0 },
  pills: { gap: 6, paddingHorizontal: 22, paddingVertical: 4 },
  pill: { borderWidth: 1.5, borderColor: Bby.line, borderRadius: 999, paddingHorizontal: 13, height: 40, justifyContent: 'center' },
  pillText: { color: Bby.text, fontFamily: BFont.sansSemibold, fontSize: 14, letterSpacing: -0.1 },
  chip: { borderWidth: 1.5, borderColor: Bby.line, borderRadius: 999, paddingHorizontal: 12, height: 30, justifyContent: 'center', alignSelf: 'flex-start' },
  chipText: { color: Bby.text, fontFamily: BFont.sansSemibold, fontSize: 12 },
  tilt: { backgroundColor: Bby.yellow, borderRadius: 30, padding: 24, transform: [{ rotate: '-2deg' }], marginVertical: 10, marginHorizontal: 2 },
  card: { borderRadius: 26, padding: 20, overflow: 'hidden' },
  dashed: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Bby.line },
  photo: { height: 190, borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end', padding: 14 },
  photoHint: { fontFamily: BFont.sansMedium, fontSize: 11, letterSpacing: 1.2 },
  photoBody: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 16, paddingBottom: 10 },
  cardLabel: { fontFamily: BFont.sans, fontSize: 14, marginBottom: 2 },
  cardTitle: { fontFamily: BFont.display, fontSize: 23, lineHeight: 28, letterSpacing: -0.3 },
  cardSub: { fontFamily: BFont.sans, fontSize: 14, marginTop: 4 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowTitle: { fontFamily: BFont.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 999, paddingHorizontal: 22 },
  pillBtnText: { fontFamily: BFont.sansBold, fontSize: 16 },
  actionBar: { height: 64, borderRadius: 999, backgroundColor: Bby.light, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  actionDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, textAlign: 'center', fontFamily: BFont.sansBold, fontSize: 17, color: Bby.ink },
  actionNote: { textAlign: 'center', color: Bby.muted, fontFamily: BFont.sans, fontSize: 13 },
  editorial: { fontFamily: BFont.serif, fontSize: 22, lineHeight: 30 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: Bby.yellow, borderRadius: 18, padding: 12, minHeight: 110, justifyContent: 'space-between' },
  tileLabel: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.ink },
  tileValue: { fontFamily: BFont.display, fontSize: 34, color: Bby.ink, letterSpacing: -1, flexShrink: 1 },
  tileUnit: { fontFamily: BFont.display, fontSize: 16, color: Bby.ink, marginBottom: 8, marginLeft: 1 },
  tileSub: { fontFamily: BFont.sans, fontSize: 11, color: Bby.mutedOnLight },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 8, flex: 1 },
  weekBox: { borderRadius: 16, borderWidth: 1.5, borderColor: Bby.line, paddingVertical: 8, marginHorizontal: 2 },
  weekLetter: { color: Bby.muted, fontFamily: BFont.sansMedium, fontSize: 13 },
  weekNum: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  weekNumText: { color: Bby.muted, fontFamily: BFont.sans, fontSize: 15 },
  weekNumBoxed: { color: Bby.text, fontFamily: BFont.display, fontSize: 20 },
});
