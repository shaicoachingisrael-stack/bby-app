import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachChat } from '@/components/ui/coach-chat';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';

export default function CoachChatScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {t('coaching.messageCoach')}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <CoachChat clientId={user?.id} role="client" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16 },
});
