import { Coffee, Droplet, UtensilsCrossed } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { HeroVideoCard } from '@/components/ui/hero-video-card';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard } from '@/components/ui/stat-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const NUTRITION_VIDEO = require('@/assets/videos/nutrition.mp4');

export default function NutritionScreen() {
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
          OBJECTIF · 1 980 KCAL
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Nutrition
        </Text>

        <View style={{ marginTop: Spacing.xl }}>
          <HeroVideoCard
            source={NUTRITION_VIDEO}
            eyebrow="RECETTE DU JOUR"
            title="Bowl protéiné — saumon, riz, avocat"
            meta="620 kcal · 42 g de protéines"
          />
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Aujourd'hui" />
          <View style={styles.statsRow}>
            <StatCard value="540" label="Kcal pris" />
            <StatCard value="38 g" label="Protéines" />
            <StatCard value="1,2 L" label="Hydratation" />
          </View>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <SectionTitle title="Mes repas" action="Ajouter" />
          <View style={{ gap: Spacing.md }}>
            <ActivityCard
              icon={Coffee}
              title="Petit-déjeuner"
              subtitle="540 kcal · 38 g de protéines"
              status="done"
            />
            <ActivityCard
              icon={UtensilsCrossed}
              title="Déjeuner"
              subtitle="Bowl protéiné saumon · à venir"
              status="pending"
            />
            <ActivityCard
              icon={Droplet}
              title="Hydratation"
              subtitle="1,2 L sur 2,5 L objectif"
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
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  title: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginTop: Spacing.sm,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
});
