import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNutritionTargets } from '@/lib/use-nutrition-targets';
import { useProfile } from '@/lib/use-profile';

export default function OnboardingTargetsStep() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { update } = useProfile();
  const { targets, refresh } = useNutritionTargets();
  const [saving, setSaving] = useState(false);

  // Re-fetch targets when this screen comes into focus (the trigger writes them
  // when activity step saved the profile). May need a brief retry.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const t = setTimeout(() => refresh(), 800);
      return () => clearTimeout(t);
    }, [refresh]),
  );

  async function handleFinish() {
    setSaving(true);
    try {
      await update({ onboarded_at: new Date().toISOString() as any });
      // Auth guard redirects to /today
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={6}
      total={6}
      title="Tes apports quotidiens"
      subtitle="Calculés à partir de ton profil. Tu pourras les ajuster depuis tes paramètres."
      ctaLabel="Terminer"
      ctaLoading={saving}
      onCta={handleFinish}
      onBack={() => router.back()}
    >
      {targets ? (
        <View style={{ gap: Spacing.md }}>
          <BigCard
            label="CALORIES PAR JOUR"
            value={`${targets.calories ?? '—'}`}
            unit="kcal"
            hint="Énergie totale à viser sur la journée"
            palette={palette}
          />

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <MacroCard label="PROTÉINES" value={targets.protein_g} unit="g" sub={`soit ${(targets.protein_g ?? 0) * 4} kcal`} palette={palette} />
            <MacroCard label="LIPIDES" value={targets.fats_g} unit="g" sub={`soit ${(targets.fats_g ?? 0) * 9} kcal`} palette={palette} />
            <MacroCard label="GLUCIDES" value={targets.carbs_g} unit="g" sub={`soit ${(targets.carbs_g ?? 0) * 4} kcal`} palette={palette} />
          </View>

          <BigCard
            label="HYDRATATION"
            value={`${((targets.water_ml ?? 0) / 1000).toFixed(1).replace('.', ',')}`}
            unit="L"
            hint="par jour"
            palette={palette}
          />
        </View>
      ) : (
        <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sans, fontSize: 14 }}>
          Calcul en cours…
        </Text>
      )}
    </OnboardingScaffold>
  );
}

function BigCard({
  label,
  value,
  unit,
  hint,
  palette,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
  palette: any;
}) {
  return (
    <View style={[styles.bigCard, { backgroundColor: palette.surface }]}>
      <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.bigValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {value}
        </Text>
        <Text style={[styles.unit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {unit}
        </Text>
      </View>
      <Text style={[styles.hint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {hint}
      </Text>
    </View>
  );
}

function MacroCard({
  label,
  value,
  unit,
  sub,
  palette,
}: {
  label: string;
  value: number | null;
  unit: string;
  sub: string;
  palette: any;
}) {
  return (
    <View style={[styles.macroCard, { backgroundColor: palette.surface }]}>
      <Text style={[styles.macroLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <View style={[styles.tinyRule, { backgroundColor: palette.text }]} />
      <View style={styles.macroRow}>
        <Text style={[styles.macroValue, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {value ?? '—'}
        </Text>
        <Text style={[styles.macroUnit, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {unit}
        </Text>
      </View>
      <Text style={[styles.macroSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        {sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bigCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bigValue: { fontSize: 56, lineHeight: 56, letterSpacing: -1 },
  unit: { fontSize: 16 },
  hint: { fontSize: 12, marginTop: 6 },
  macroCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 4,
  },
  macroLabel: { fontSize: 9, letterSpacing: 1.4 },
  tinyRule: { width: 36, height: 1, marginVertical: 6 },
  macroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  macroValue: { fontSize: 28, letterSpacing: -0.5 },
  macroUnit: { fontSize: 12 },
  macroSub: { fontSize: 11, marginTop: 2 },
});
