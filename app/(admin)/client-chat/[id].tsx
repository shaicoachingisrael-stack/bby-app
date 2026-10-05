import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachChat } from '@/components/ui/coach-chat';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ClientChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={palette.text} />
        </Pressable>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>Messagerie</Text>
        <View style={{ width: 24 }} />
      </View>
      <CoachChat clientId={id} role="coach" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16 },
});
