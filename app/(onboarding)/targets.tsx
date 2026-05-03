import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { computeDefaults } from '@/lib/onboarding-defaults';
import { useProfile } from '@/lib/use-profile';

export default function OnboardingTargetsStep() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, update } = useProfile();

  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [hydration, setHydration] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill smart defaults from goal + level once profile is loaded
  useEffect(() => {
    if (!profile) return;
    if (kcal || protein || hydration) return;
    const defaults = computeDefaults(
      (profile.goal as any) || 'bien_etre',
      (profile.fitness_level as any) || 'debutant',
    );
    setKcal(String(profile.daily_kcal_target ?? defaults.daily_kcal_target));
    setProtein(String(profile.protein_target_g ?? defaults.protein_target_g));
    setHydration(String(profile.hydration_target_ml ?? defaults.hydration_target_ml));
  }, [profile, kcal, protein, hydration]);

  const num = (s: string) => {
    const n = Number.parseInt(s.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  async function handleFinish() {
    setSaving(true);
    try {
      await update({
        daily_kcal_target: num(kcal),
        protein_target_g: num(protein),
        hydration_target_ml: num(hydration),
        onboarded_at: new Date().toISOString() as any,
      });
      // Auth guard will redirect to /today automatically
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={4}
      total={4}
      title="Tes cibles quotidiennes"
      subtitle="Pré-rempli selon ton objectif. Tu peux ajuster à tout moment depuis ton profil."
      ctaLabel="Terminer"
      ctaLoading={saving}
      onCta={handleFinish}
      onBack={() => router.back()}
    >
      <View style={{ gap: Spacing.lg }}>
        <Field
          label="Calories"
          suffix="kcal / jour"
          value={kcal}
          onChange={setKcal}
          palette={palette}
        />
        <Field
          label="Protéines"
          suffix="g / jour"
          value={protein}
          onChange={setProtein}
          palette={palette}
        />
        <Field
          label="Hydratation"
          suffix="ml / jour"
          value={hydration}
          onChange={setHydration}
          palette={palette}
        />
      </View>
    </OnboardingScaffold>
  );
}

function Field({
  label,
  suffix,
  value,
  onChange,
  palette,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (s: string) => void;
  palette: any;
}) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text
        style={{
          color: palette.textSecondary,
          fontFamily: Fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 1.4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <View
        style={[
          styles.wrap,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          style={[styles.input, { color: palette.text, fontFamily: Fonts.sans }]}
        />
        <Text
          style={[styles.suffix, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}
        >
          {suffix}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  input: { flex: 1, fontSize: 18 },
  suffix: { fontSize: 13 },
});
