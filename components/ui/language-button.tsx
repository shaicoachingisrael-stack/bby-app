import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import type { Locale } from '@/lib/i18n';
import { useLocale } from '@/lib/locale-provider';

export const LANGUAGES: { value: Locale; flag: string; name: string }[] = [
  { value: 'fr', flag: '🇫🇷', name: 'Français' },
  { value: 'en', flag: '🇬🇧', name: 'English' },
  { value: 'he', flag: '🇮🇱', name: 'עברית' },
  { value: 'es', flag: '🇪🇸', name: 'Español' },
  { value: 'ru', flag: '🇷🇺', name: 'Русский' },
];

// Le drapeau de la langue en cours ; le toucher ouvre le choix des langues sur
// place. Marche aussi avant la connexion (l'écran /language, lui, demande une
// session) : on peut donc le poser dès l'écran d'accueil.
export function LanguageButton({ light = false }: { light?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.button,
          light ? styles.buttonLight : styles.buttonDark,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('language.title')}
      >
        <Text style={styles.flag}>{current.flag}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t('common.close')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={[styles.title, { fontFamily: Fonts.displayBold }]}>{t('language.title')}</Text>
          {LANGUAGES.map((l) => {
            const selected = l.value === locale;
            return (
              <Pressable
                key={l.value}
                onPress={async () => {
                  setOpen(false);
                  await setLocale(l.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.rowFlag}>{l.flag}</Text>
                <Text style={styles.rowName}>{l.name}</Text>
                {selected ? <Check size={20} color="#7DF3C6" strokeWidth={2.4} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonDark: { backgroundColor: '#1A1222', borderColor: 'rgba(255,255,255,0.07)' },
  buttonLight: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.32)' },
  flag: { fontSize: 22 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#160F1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  title: { fontSize: 20, color: '#FFF4EE', marginTop: 10, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowSelected: { backgroundColor: 'rgba(125,243,198,0.12)' },
  rowFlag: { fontSize: 24 },
  rowName: { flex: 1, fontSize: 16, color: '#FFF4EE', fontFamily: Fonts.sansMedium },
});
