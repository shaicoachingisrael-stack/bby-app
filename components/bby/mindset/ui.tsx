// Petits composants propres à l'onglet Mindset (le kit commun reste intact).
import { useRouter } from 'expo-router';
import { Bookmark, BookmarkCheck, Lock, Share2 } from 'lucide-react-native';
import { ArrowLeft } from '@/lib/rtl-icons';
import { ReactNode, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { Text, TextInput } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BFont, Bby, PillTabs, RoundButton, StatusFill } from '@/components/bby/kit';
import { shareText } from '@/lib/mindset/core';
import { type PhraseSource, useSavedPhrases } from '@/lib/mindset/use-saved-phrases';

export type MindsetFilter = 'all' | 'parcours' | 'journal' | 'rituals';

/** Écran défilant qui laisse la place au clavier (sous-écrans sans barre du bas). */
export const MScreen = forwardRef<ScrollView, { children?: ReactNode; bottomSpace?: number; contentStyle?: StyleProp<ViewStyle> }>(
  function MScreen({ children, bottomSpace = 40, contentStyle }, ref) {
    const insets = useSafeAreaInsets();
    return (
      <KeyboardAvoidingView style={m.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={ref}
          style={m.screen}
          contentContainerStyle={[m.inner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + bottomSpace }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <StatusFill />
      </KeyboardAvoidingView>
    );
  },
);

/** Rangée du haut : retour à gauche, contenu libre à droite. */
export function BackRow({ right, onBack }: { right?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={m.backRow}>
      <RoundButton
        icon={ArrowLeft}
        variant="outline"
        size={48}
        label={t('v2mindset.common.back')}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/mindset' as any)))}
      />
      <View style={m.row8}>{right}</View>
    </View>
  );
}

/** Les puces Tous · Parcours · Journal · Rituels. */
export function useFilterItems() {
  const { t } = useTranslation();
  return [
    { key: 'all' as const, label: t('v2mindset.filters.all') },
    { key: 'parcours' as const, label: t('v2mindset.filters.parcours') },
    { key: 'journal' as const, label: t('v2mindset.filters.journal') },
    { key: 'rituals' as const, label: t('v2mindset.filters.rituals') },
  ];
}

/** Puces sur un sous-écran : situent la cliente, et ramènent à la page Mindset. */
export function MindsetFilters({ value }: { value: MindsetFilter }) {
  const router = useRouter();
  const items = useFilterItems();
  return (
    <PillTabs
      items={items}
      value={value}
      onChange={(k) => router.navigate({ pathname: '/(tabs)/mindset', params: { filter: k } } as any)}
    />
  );
}

/** Pastille ronde noire « 4/7 ». */
export function DayBadge({ label, size = 58, light }: { label: string; size?: number; light?: boolean }) {
  return (
    <View
      style={[
        m.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: light ? Bby.light : Bby.ink },
      ]}
    >
      <Text style={[m.badgeText, { color: light ? Bby.ink : Bby.yellow, fontSize: size * 0.3 }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

/** « Garder » + « Partager » d'une phrase. */
export function PhraseButtons({
  text,
  source,
  variant = 'black',
  size = 44,
}: {
  text: string | null | undefined;
  source: PhraseSource;
  variant?: 'black' | 'outline';
  size?: number;
}) {
  const { t } = useTranslation();
  const { has, toggle } = useSavedPhrases();
  if (!text) return null;
  const kept = has(text);
  return (
    <View style={m.row8}>
      <RoundButton
        icon={kept ? BookmarkCheck : Bookmark}
        variant={variant}
        size={size}
        label={kept ? t('v2mindset.common.kept') : t('v2mindset.common.keep')}
        onPress={() => toggle(text, source)}
      />
      <RoundButton icon={Share2} variant={variant} size={size} label={t('v2mindset.common.share')} onPress={() => shareText(text)} />
    </View>
  );
}

export function Small({ children, style, dark }: { children: ReactNode; style?: StyleProp<TextStyle>; dark?: boolean }) {
  return <Text style={[m.small, { color: dark ? Bby.mutedOnLight : Bby.muted }, style]}>{children}</Text>;
}

export function CardTitle({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[m.cardTitle, { color: dark ? Bby.ink : Bby.text }, style]}>{children}</Text>;
}

export function Body({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[m.body, { color: dark ? Bby.ink : Bby.text }, style]}>{children}</Text>;
}

export const MInput = forwardRef<TextInput, TextInputProps & { onLight?: boolean }>(function MInput({ style, onLight, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={onLight ? Bby.mutedOnLight : '#6E6E6A'}
      selectionColor={Bby.yellow}
      {...props}
      style={[m.input, onLight && { backgroundColor: Bby.lightAlt, color: Bby.ink }, props.multiline && m.inputMulti, style]}
    />
  );
});

export function PrivateNote({ text }: { text: string }) {
  return (
    <View style={m.private}>
      <Lock size={13} color={Bby.muted} strokeWidth={2} />
      <Text style={m.privateText}>{text}</Text>
    </View>
  );
}

export const mstyles = StyleSheet.create({
  bigTitle: { fontFamily: BFont.display, fontSize: 32, lineHeight: 36, color: Bby.text, letterSpacing: -0.6 },
  serif: { fontFamily: BFont.serif, fontSize: 22, lineHeight: 30 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sep: { height: 1, backgroundColor: Bby.line },
  sepLight: { height: 1, backgroundColor: Bby.lineOnLight },
});

const m = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Bby.bg },
  inner: { paddingHorizontal: 22, gap: 10, maxWidth: 640, width: '100%', alignSelf: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: BFont.display, letterSpacing: -0.3 },
  small: { fontFamily: BFont.sans, fontSize: 13, lineHeight: 18 },
  cardTitle: { fontFamily: BFont.display, fontSize: 17, lineHeight: 21, letterSpacing: -0.2 },
  body: { fontFamily: BFont.sans, fontSize: 15, lineHeight: 22 },
  input: {
    backgroundColor: Bby.bg,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Bby.line,
    color: Bby.text,
    fontFamily: BFont.sans,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
  private: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  privateText: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
});
