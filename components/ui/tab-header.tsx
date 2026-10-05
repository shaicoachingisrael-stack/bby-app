import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccentFill } from '@/components/ui/accent-fill';
import { AdminButton } from '@/components/ui/admin-button';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

type Props = {
  title: string;
  subtitle?: string;
  // élément propre à l'écran, placé avant la cloche (ex. « Comprendre », « Favoris »)
  action?: ReactNode;
};

// En-tête commun aux onglets (maquette Ember v2) : grand titre + ligne de
// contexte à gauche ; à droite l'action de l'écran, la cloche et l'avatar.
export function TabHeader({ title, subtitle, action }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const initial = (profile?.display_name || user?.email || '?')[0].toUpperCase();

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
      <AdminButton />
      <Pressable
        onPress={() => router.push('/notifications' as any)}
        hitSlop={8}
        style={[styles.round, { backgroundColor: palette.surface }]}
        accessibilityLabel="Notifications"
      >
        <Bell size={18} color={palette.text} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/account' as any)}
        hitSlop={8}
        style={styles.avatar}
        accessibilityLabel={t('account.title')}
      >
        <AccentFill />
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <Text style={{ color: palette.onAccent, fontFamily: Fonts.sansBold, fontSize: 16 }}>{initial}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  title: { fontSize: 26, letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 2 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
