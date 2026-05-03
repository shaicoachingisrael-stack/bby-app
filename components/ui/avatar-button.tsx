import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Palette, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

export function AvatarButton() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const { profile } = useProfile();

  const name = profile?.display_name?.trim() || user?.email || '';
  const initial = name ? name[0].toUpperCase() : '?';

  return (
    <Pressable
      onPress={() => router.push('/account' as any)}
      hitSlop={10}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.text,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Mon compte"
    >
      <Text style={[styles.initial, { color: palette.background, fontFamily: Fonts.sansBold }]}>
        {initial}
      </Text>
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
  initial: {
    fontSize: 16,
  },
});
