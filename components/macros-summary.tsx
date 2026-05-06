import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';

export function MacrosSummary() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { targets } = useNutritionTargets();

  if (!targets || targets.calories === null) return null;

  const calories = targets.calories ?? 0;
  const protein = targets.protein_g ?? 0;
  const fats = targets.fats_g ?? 0;
  const carbs = targets.carbs_g ?? 0;
  const water = targets.water_ml ?? 0;

  return (
    <View style={[styles.outer, { backgroundColor: palette.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          NUTRITION
        </Text>
      </View>
      <Text style={[styles.h1, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        Tes apports{' '}
        <Text style={[styles.h1Italic, { fontFamily: Fonts.display }]}>quotidiens</Text>
      </Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        Calculés selon ton profil et ton objectif
      </Text>

      <View style={[styles.bigCard, { backgroundColor: palette.surface }]}>
        <Text style={[styles.bigEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          CALORIES PAR JOUR
        </Text>
        <View style={styles.bigRow}>
          <Text style={[styles.bigValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {calories.toLocaleString('fr-FR').replace(',', ' ')}
          </Text>
          <Text style={[styles.bigUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            kcal
          </Text>
        </View>
        <Text style={[styles.bigHint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Énergie totale à viser sur la journée
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        Répartition
      </Text>
      <View style={styles.row3}>
        <Macro label="PROTÉINES" value={protein} kcal={protein * 4} palette={palette} />
        <Macro label="LIPIDES" value={fats} kcal={fats * 9} palette={palette} />
        <Macro label="GLUCIDES" value={carbs} kcal={carbs * 4} palette={palette} />
      </View>

      <View style={[styles.bigCard, { backgroundColor: palette.surface, marginTop: Spacing.md }]}>
        <Text style={[styles.bigEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          HYDRATATION
        </Text>
        <View style={styles.bigRow}>
          <Text style={[styles.midValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {(water / 1000).toFixed(1).replace('.', ',')}
          </Text>
          <Text style={[styles.bigUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            L
          </Text>
          <Text style={[styles.bigHint, { color: palette.textSecondary, fontFamily: Fonts.sans, marginLeft: 'auto' }]}>
            par jour
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
          Comprendre mon calcul
        </Text>
        <ChevronRight size={16} color={palette.text} />
      </Pressable>
    </View>
  );
}

function Macro({
  label,
  value,
  kcal,
  palette,
}: {
  label: string;
  value: number;
  kcal: number;
  palette: any;
}) {
  return (
    <View style={[styles.macroCard, { backgroundColor: palette.surface }]}>
      <Text style={[styles.macroLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <View style={[styles.macroRule, { backgroundColor: palette.text }]} />
      <View style={styles.macroRow}>
        <Text style={[styles.macroValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {value}
        </Text>
        <Text style={[styles.macroUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          g
        </Text>
      </View>
      <Text style={[styles.macroSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        soit {kcal} kcal
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
  bigValue: { fontSize: 64, lineHeight: 64, letterSpacing: -1.2 },
  midValue: { fontSize: 36, lineHeight: 38, letterSpacing: -0.6 },
  bigUnit: { fontSize: 16 },
  bigHint: { fontSize: 12, marginTop: 4 },
  sectionLabel: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
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
