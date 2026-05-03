import { Apple, Brain, Dumbbell } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { AvatarButton } from '@/components/ui/avatar-button';
import { HeroVideoCard } from '@/components/ui/hero-video-card';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard } from '@/components/ui/stat-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TRAINING_VIDEO = require('@/assets/videos/exercise.mp4');

function formatToday() {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatter.format(new Date());
}

export default function TodayScreen() {
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
            {formatToday().toUpperCase()}
          </Text>
          <AvatarButton />
        </View>
        <Text style={[styles.greeting, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Bonjour 👋
        </Text>
        <Text style={[styles.intro, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Voici ton plan du jour. Une séance, trois repas, une intention.
        </Text>

        <View style={{ marginTop: Spacing.xl }}>
          <HeroVideoCard
            source={TRAINING_VIDEO}
            eyebrow="SÉANCE DU JOUR"
            title="Full body — focus glutes & core"
            meta="35 min · Niveau intermédiaire"
          />
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Cette semaine" />
          <View style={styles.statsRow}>
            <StatCard value="3" label="Séances" />
            <StatCard value="6 j" label="Série" />
            <StatCard value="82 %" label="Constance" />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Ma journée" action="Tout voir" />
          <View style={{ gap: Spacing.md }}>
            <ActivityCard
              icon={Dumbbell}
              title="Full body — 35 min"
              subtitle="Séance prévue · 09:00"
              status="pending"
            />
            <ActivityCard
              icon={Apple}
              title="Petit-déjeuner protéiné"
              subtitle="540 kcal · 38 g de protéines"
              status="done"
            />
            <ActivityCard
              icon={Brain}
              title="Intention du jour"
              subtitle="« Je fais ce qui est bon pour moi. »"
              status="pending"
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
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    flex: 1,
  },
  greeting: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: Spacing.sm,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.sm,
    maxWidth: '92%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
