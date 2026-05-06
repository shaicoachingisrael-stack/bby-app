import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocale } from '@/lib/locale-provider';

const FLAGS: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  he: '🇮🇱',
  es: '🇪🇸',
  ru: '🇷🇺',
};

export function LanguageButton() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { locale } = useLocale();

  return (
    <Pressable
      onPress={() => router.push('/language' as any)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Changer de langue"
    >
      <Text style={styles.flag}>{FLAGS[locale] ?? '🇫🇷'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: { fontSize: 20 },
});
