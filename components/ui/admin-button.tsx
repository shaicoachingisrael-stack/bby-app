import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

export function AdminButton() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile } = useProfile();

  if (!profile?.is_admin) return null;

  return (
    <Pressable
      onPress={() => router.push('/(admin)' as any)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.text,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Panneau admin"
    >
      <Sparkles size={14} color={palette.background} strokeWidth={2.2} />
      <Text style={[styles.label, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
        Admin
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
