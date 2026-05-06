import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocale } from '@/lib/locale-provider';
import type { Locale } from '@/lib/i18n';

const LANGUAGES: { value: Locale; flag: string; name: string }[] = [
  { value: 'fr', flag: '🇫🇷', name: 'Français' },
  { value: 'en', flag: '🇬🇧', name: 'English' },
  { value: 'he', flag: '🇮🇱', name: 'עברית' },
  { value: 'es', flag: '🇪🇸', name: 'Español' },
  { value: 'ru', flag: '🇷🇺', name: 'Русский' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  async function handlePick(l: Locale) {
    await setLocale(l);
    router.back();
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('language.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('language.subtitle')}
        </Text>

        <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
          {LANGUAGES.map((l) => {
            const selected = locale === l.value;
            return (
              <Pressable
                key={l.value}
                onPress={() => handlePick(l.value)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: selected ? palette.text : palette.surface,
                    borderColor: selected ? palette.text : palette.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.flag}>{l.flag}</Text>
                <Text
                  style={[
                    styles.name,
                    {
                      color: selected ? palette.background : palette.text,
                      fontFamily: Fonts.sansSemibold,
                    },
                  ]}
                >
                  {l.name}
                </Text>
                {selected && (
                  <View style={[styles.check, { backgroundColor: palette.background }]}>
                    <Check size={14} color={palette.text} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  flag: { fontSize: 32 },
  name: { flex: 1, fontSize: 16 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
