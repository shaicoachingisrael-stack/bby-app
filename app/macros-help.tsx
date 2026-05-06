import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

export default function MacrosHelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile } = useProfile();
  const { targets } = useNutritionTargets();

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('macrosHelp.title')}
        </Text>
        <Text style={[styles.body, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('macrosHelp.intro')}
        </Text>

        <Section title={t('macrosHelp.step1Title')} palette={palette}>
          {t('macrosHelp.step1Body')}
        </Section>
        {targets?.bmr && (
          <Stat label={t('macrosHelp.step1Stat')} value={t('macrosHelp.kcalPerDay', { count: targets.bmr })} palette={palette} />
        )}

        <Section title={t('macrosHelp.step2Title')} palette={palette}>
          {t('macrosHelp.step2Body')}
        </Section>
        {targets?.tdee && (
          <Stat label={t('macrosHelp.step2Stat')} value={t('macrosHelp.kcalPerDay', { count: targets.tdee })} palette={palette} />
        )}

        <Section title={t('macrosHelp.step3Title')} palette={palette}>
          {t('macrosHelp.step3Body')}
        </Section>
        {targets?.calories && (
          <Stat
            label={t('macrosHelp.step3Stat')}
            value={t('macrosHelp.kcalPerDay', { count: targets.calories })}
            palette={palette}
          />
        )}

        <Section title={t('macrosHelp.step4Title')} palette={palette}>
          {t('macrosHelp.step4Body')}
        </Section>

        <Section title={t('macrosHelp.step5Title')} palette={palette}>
          {t('macrosHelp.step5Body')}
        </Section>

        <View style={[styles.disclaimer, { backgroundColor: palette.surface }]}>
          <Text style={[styles.disclaimerText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('macrosHelp.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: any;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.sectionTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {children}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: any;
}) {
  return (
    <View style={[styles.statRow, { backgroundColor: palette.surface }]}>
      <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.statValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg },
  body: { fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 16, marginTop: Spacing.sm },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  statLabel: { fontSize: 11, letterSpacing: 1.4 },
  statValue: { fontSize: 14 },
  disclaimer: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  disclaimerText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
});
