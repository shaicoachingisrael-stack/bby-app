import { Clock, Flame, History } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { HeroVideoCard } from '@/components/ui/hero-video-card';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard } from '@/components/ui/stat-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const EXERCISE_VIDEO = require('@/assets/videos/exercise.mp4');

export default function TrainingScreen() {
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
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          PROGRAMME · SEMAINE 3
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Training
        </Text>

        <View style={{ marginTop: Spacing.xl }}>
          <HeroVideoCard
            source={EXERCISE_VIDEO}
            eyebrow="REPRENDRE"
            title="Full body — focus glutes & core"
            meta="35 min · Niveau intermédiaire"
          />
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Aperçu" />
          <View style={styles.statsRow}>
            <StatCard value="12" label="Séances faites" />
            <StatCard value="4h35" label="Cette semaine" />
            <StatCard value="6" label="Programmes" />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Ma bibliothèque" action="Tout voir" />
          <View style={{ gap: Spacing.md }}>
            <ActivityCard
              icon={Flame}
              title="HIIT brûle-graisses"
              subtitle="20 min · 8 séances"
            />
            <ActivityCard
              icon={Clock}
              title="Mobilité matinale"
              subtitle="10 min · 15 séances"
            />
            <ActivityCard
              icon={History}
              title="Historique complet"
              subtitle="Tes 30 dernières séances"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  title: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: Spacing.sm,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
});
