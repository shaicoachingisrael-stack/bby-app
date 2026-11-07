// Petits composants propres à l'onglet Nutrition, posés sur le kit commun.
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Minus, Plus, Utensils } from 'lucide-react-native';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { BFont, Bby, Card, onTone, PillButton, RoundButton, StatusFill } from '@/components/bby/kit';
import { fractionValue, type PlateTemplate } from '@/lib/nutrition/plate';

// ---------------------------------------------------------------------------
// Écran défilant avec un bouton principal fixé en bas (« Terminé », « Ajouter à mon menu »).

export function FooterScreen({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={st.screen}
        contentContainerStyle={[st.inner, { paddingTop: insets.top + 12, paddingBottom: 150 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <StatusFill />
      <View style={[st.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Assiette en parts de disque

const PLATE_DARK = { veg: Bby.plateVeg, protein: Bby.yellow, starch: Bby.light };
const PLATE_LIGHT = { veg: '#CFCFCA', protein: Bby.yellow, starch: Bby.ink };
export const plateColors = (onLight?: boolean) => (onLight ? PLATE_LIGHT : PLATE_DARK);

function wedge(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Légumes à droite depuis midi, puis protéines, puis féculents (sens horaire). */
export function PlateChart({ plate, size = 96, onLight }: { plate: PlateTemplate; size?: number; onLight?: boolean }) {
  const c = plateColors(onLight);
  const r = size / 2;
  const parts = [
    { v: fractionValue(plate.veg), color: c.veg },
    { v: fractionValue(plate.protein), color: c.protein },
    { v: fractionValue(plate.starch), color: c.starch },
  ];
  let a = -Math.PI / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {parts.map((p, i) => {
        const a0 = a;
        a += p.v * Math.PI * 2;
        return <Path key={i} d={wedge(r, r, r - 1, a0, a)} fill={p.color} stroke={onLight ? Bby.light : Bby.card} strokeWidth={1.5} />;
      })}
      <Circle cx={r} cy={r} r={r - 1} fill="none" stroke={onLight ? Bby.lineOnLight : Bby.line} strokeWidth={1} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Vignette de recette : photo, sinon l'icône couverts dans un cadre.

export function RecipeThumb({ uri, size = 72, onLight }: { uri?: string | null; size?: number; onLight?: boolean }) {
  return (
    <View
      style={[
        st.thumb,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: onLight ? Bby.lightAlt : Bby.cardAlt },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Utensils size={size * 0.33} color={onLight ? Bby.mutedOnLight : Bby.muted} strokeWidth={1.6} />
      )}
    </View>
  );
}

/** Carte de recette (écrans 1 et 5) : vignette, créneau/catégorie, nom, « durée · P · L · G ». */
export function RecipeCard({
  label,
  title,
  meta,
  cover,
  tone = 'dark',
  onPress,
  right,
}: {
  label?: string;
  title: string;
  meta?: string;
  cover?: string | null;
  tone?: 'dark' | 'light';
  onPress?: () => void;
  right?: ReactNode;
}) {
  const c = onTone(tone);
  return (
    <Card tone={tone} onPress={onPress} style={{ padding: 12 }}>
      <View style={st.row}>
        <RecipeThumb uri={cover} onLight={tone === 'light'} />
        <View style={{ flex: 1 }}>
          {label ? <Text style={[st.label, { color: c.muted }]}>{label}</Text> : null}
          <Text style={[st.recipeTitle, { color: c.text }]} numberOfLines={3}>
            {title}
          </Text>
          {meta ? <Text style={[st.meta, { color: c.muted }]}>{meta}</Text> : null}
        </View>
        {right}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// En-tête d'écran secondaire : retour 48 px à gauche, élément libre à droite.

export function NavHeader({ right, onBack }: { right?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={st.nav}>
      <RoundButton
        icon={ArrowLeft}
        variant="outline"
        size={48}
        label={t('v2nutrition.common.back')}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/nutrition' as any)))}
      />
      {right ?? <View />}
    </View>
  );
}

export function ScreenTitle({ children, sub }: { children: string; sub?: string }) {
  return (
    <View style={{ gap: 6, marginTop: 8, marginBottom: 6 }}>
      <Text style={st.title}>{children}</Text>
      {sub ? <Text style={st.sub}>{sub}</Text> : null}
    </View>
  );
}

/** Petit libellé de champ ou de rayon. */
export function FieldLabel({ children, caps }: { children: string; caps?: boolean }) {
  return <Text style={[st.fieldLabel, caps && st.caps]}>{caps ? children.toLocaleUpperCase() : children}</Text>;
}

// ---------------------------------------------------------------------------
// Stepper « 2 personnes »

export function Stepper({ label, onMinus, onPlus, minusDisabled }: { label: string; onMinus: () => void; onPlus: () => void; minusDisabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={st.stepper}>
      <Text style={st.stepperText}>{label}</Text>
      <View style={st.row8}>
        <View style={minusDisabled && { opacity: 0.35 }}>
          <RoundButton icon={Minus} variant="outline" size={40} onPress={minusDisabled ? undefined : onMinus} label={t('v2nutrition.common.less')} />
        </View>
        <RoundButton icon={Plus} variant="yellow" size={40} onPress={onPlus} label={t('v2nutrition.common.more')} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Carte à choix unique (réglages) et interrupteur

export function ChoiceCard({
  title,
  sub,
  tag,
  selected,
  onPress,
  compact,
}: {
  title: string;
  sub?: string;
  tag?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const fg = selected ? Bby.ink : Bby.text;
  const muted = selected ? Bby.mutedOnLight : Bby.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [st.choice, { backgroundColor: selected ? Bby.light : Bby.card, padding: compact ? 16 : 20 }, pressed && { opacity: 0.85 }]}
    >
      <View style={[st.radio, selected ? { backgroundColor: Bby.ink, borderWidth: 0 } : { borderColor: Bby.muted }]}>
        {selected ? <Check size={14} color={Bby.light} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={st.rowBetween}>
          <Text style={[st.choiceTitle, { color: fg, fontSize: compact ? 18 : 22 }]}>{title}</Text>
          {tag ? <Text style={[st.tag, { color: muted }]}>{tag}</Text> : null}
        </View>
        {sub ? <Text style={[st.choiceSub, { color: muted }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[st.toggle, { backgroundColor: value ? Bby.yellow : Bby.cardAlt }]}
    >
      <View style={[st.knob, { backgroundColor: value ? Bby.ink : Bby.muted, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Champ de saisie pilule (52 px)

export function Field({ style, multiline, ...rest }: TextInputProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.field, multiline && st.fieldMulti, style]}>
      <TextInput
        placeholderTextColor={Bby.muted}
        style={[st.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Petite fenêtre « Bientôt disponible »

export function SoonModal({ visible, onClose, body }: { visible: boolean; onClose: () => void; body?: string }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.modal} onPress={() => {}}>
          <Text style={st.modalTitle}>{t('v2nutrition.soon.title')}</Text>
          <Text style={st.modalBody}>{body ?? t('v2nutrition.soon.body')}</Text>
          <PillButton label={t('v2nutrition.common.ok')} variant="black" onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Bby.bg },
  inner: { paddingHorizontal: 22, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 14, backgroundColor: 'rgba(10,10,10,0.96)', maxWidth: 640, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  thumb: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  label: { fontFamily: BFont.sans, fontSize: 13, marginBottom: 2 },
  recipeTitle: { fontFamily: BFont.display, fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  meta: { fontFamily: BFont.sans, fontSize: 13, marginTop: 4 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  title: { fontFamily: BFont.display, fontSize: 44, lineHeight: 50, color: Bby.text, letterSpacing: -0.8 },
  sub: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 21, color: Bby.muted },
  fieldLabel: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 8 },
  caps: { fontFamily: BFont.sansSemibold, fontSize: 12, letterSpacing: 1.2, marginTop: 16 },
  stepper: {
    height: 64,
    borderRadius: 999,
    backgroundColor: Bby.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 12,
  },
  stepperText: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  choice: { borderRadius: 26, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  choiceTitle: { fontFamily: BFont.display, letterSpacing: -0.2, flexShrink: 1 },
  choiceSub: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 20 },
  tag: { fontFamily: BFont.sans, fontSize: 13 },
  toggle: { width: 56, height: 32, borderRadius: 16, padding: 4, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12 },
  field: { minHeight: 52, borderRadius: 26, backgroundColor: Bby.card, paddingHorizontal: 18, justifyContent: 'center' },
  fieldMulti: { borderRadius: 22, paddingVertical: 14 },
  fieldInput: { fontFamily: BFont.sans, fontSize: 16, color: Bby.text, paddingVertical: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modal: { backgroundColor: Bby.light, borderRadius: 28, padding: 24, gap: 12, width: '100%', maxWidth: 360 },
  modalTitle: { fontFamily: BFont.display, fontSize: 24, color: Bby.ink },
  modalBody: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 22, color: Bby.mutedOnLight, marginBottom: 6 },
});
