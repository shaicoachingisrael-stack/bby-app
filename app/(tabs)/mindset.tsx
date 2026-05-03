import { BookOpen, Heart, Sparkles } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { AvatarButton } from '@/components/ui/avatar-button';
import { SectionTitle } from '@/components/ui/section-title';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MindsetScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingHorizontal: Spacing.xl,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            INTENTION DU JOUR
          </Text>
          <AvatarButton />
        </View>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Mindset
        </Text>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Aujourd'hui" />
          <View style={{ gap: Spacing.md }}>
            <ActivityCard
              icon={Sparkles}
              title="Affirmation"
              subtitle="« Je fais ce qui est bon pour moi. »"
            />
            <ActivityCard
              icon={Heart}
              title="Méditation 5 min"
              subtitle="Respiration consciente"
            />
            <ActivityCard
              icon={BookOpen}
              title="Journal"
              subtitle="Note tes ressentis du jour"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, flex: 1 },
  title: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: Spacing.sm,
  },
});
