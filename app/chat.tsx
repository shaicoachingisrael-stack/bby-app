import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: palette.text }]}>
          <Sparkles size={32} color={palette.background} />
        </View>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Coach IA
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Bientôt disponible. Tu pourras poser tes questions, ajuster ton plan
          et parler de ta journée à un coach virtuel.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
            Compris
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: 32, letterSpacing: -0.6 },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    height: 52,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  ctaText: { fontSize: 16 },
});
