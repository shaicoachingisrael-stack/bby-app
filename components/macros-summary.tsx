import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';

export type MacrosConsumed = { kcal: number; protein: number; carbs: number; fats: number };

// Brief Nutrition de Shy §1 : les macros sont l'information principale, le total
// calorique vient en dessous, nettement plus petit. Sans `consumed` = simple repère
// (on ne compte rien) ; avec `consumed` = suivi au fil de la journée.
export function MacrosSummary({ consumed }: { consumed?: MacrosConsumed }) {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const { targets } = useNutritionTargets();

  if (!targets || targets.calories === null) return null;

  const calories = targets.calories ?? 0;
  const protein = targets.protein_g ?? 0;
  const fats = targets.fats_g ?? 0;
  const carbs = targets.carbs_g ?? 0;
  const water = targets.water_ml ?? 0;
  const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0,]/g, ' ');

  return (
    <View style={[styles.outer, { backgroundColor: palette.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {t('tabs.nutrition').toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.h1, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        {t('nutrition.macros.title')}{' '}
        <Text style={[styles.h1Italic, { fontFamily: Fonts.display }]}>{t('nutrition.macros.titleItalic')}</Text>
      </Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {t('nutrition.macros.subtitle')}
      </Text>

      <View style={[styles.row3, { marginTop: Spacing.lg }]}>
        <Macro label={t('nutrition.macros.protein')} target={protein} consumed={consumed?.protein} palette={palette} />
        <Macro label={t('nutrition.macros.fats')} target={fats} consumed={consumed?.fats} palette={palette} />
        <Macro label={t('nutrition.macros.carbs')} target={carbs} consumed={consumed?.carbs} palette={palette} />
      </View>

      <Text style={[styles.kcalLine, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {consumed
          ? t('nutrition.kcalProgress', { current: fmt(consumed.kcal), target: fmt(calories) })
          : t('nutrition.macros.kcalPerDay', { kcal: fmt(calories) })}
      </Text>

      <View style={[styles.bigCard, { backgroundColor: palette.surface, marginTop: Spacing.md }]}>
        <Text style={[styles.bigEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {t('nutrition.hydration').toUpperCase()}
        </Text>
        <View style={styles.bigRow}>
          <Text style={[styles.midValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {(water / 1000).toFixed(1).replace('.', ',')}
          </Text>
          <Text style={[styles.bigUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('common.L')}
          </Text>
          <Text style={[styles.bigHint, { color: palette.textSecondary, fontFamily: Fonts.sans, marginLeft: 'auto' }]}>
            {t('nutrition.macros.perDay')}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/macros-help' as any)}
        style={({ pressed }) => [
          styles.linkRow,
          { borderTopColor: palette.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.linkText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
          {t('nutrition.macros.understand')}
        </Text>
        <ChevronRight size={16} color={palette.text} />
      </Pressable>
    </View>
  );
}

function Macro({
  label,
  target,
  consumed,
  palette,
}: {
  label: string;
  target: number;
  consumed?: number;
  palette: any;
}) {
  const { t } = useTranslation();
  const tracking = consumed !== undefined;
  return (
    <View style={[styles.macroCard, { backgroundColor: palette.surface }]}>
      <Text style={[styles.macroLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <View style={[styles.macroRule, { backgroundColor: palette.text }]} />
      <View style={styles.macroRow}>
        <Text style={[styles.macroValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {tracking ? consumed : target}
        </Text>
        <Text style={[styles.macroUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('common.g')}
        </Text>
      </View>
      <Text style={[styles.macroSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {tracking ? t('nutrition.macros.ofTarget', { target }) : t('nutrition.macros.perDay')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  h1: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginTop: Spacing.sm,
  },
  h1Italic: { fontStyle: 'italic', fontWeight: '400' },
  subtitle: { fontSize: 13, marginTop: 4 },
  bigCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  bigEyebrow: { fontSize: 11, letterSpacing: 1.6, marginBottom: 8 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  midValue: { fontSize: 36, lineHeight: 38, letterSpacing: -0.6 },
  bigUnit: { fontSize: 16 },
  bigHint: { fontSize: 12, marginTop: 4 },
  kcalLine: { fontSize: 12, marginTop: Spacing.sm },
  row3: { flexDirection: 'row', gap: Spacing.sm },
  macroCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  macroLabel: { fontSize: 10, letterSpacing: 1.4 },
  macroRule: { width: 32, height: 1, marginVertical: 8 },
  macroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  macroValue: { fontSize: 32, letterSpacing: -0.6 },
  macroUnit: { fontSize: 12 },
  macroSub: { fontSize: 11, marginTop: 4 },
  linkRow: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: { fontSize: 14 },
});
