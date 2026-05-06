import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

const SEX_OPTIONS = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
] as const;

type Sex = (typeof SEX_OPTIONS)[number]['value'];

export default function OnboardingBioStep() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, update } = useProfile();
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.sex) setSex(profile.sex as Sex);
    if (profile.age) setAge(String(profile.age));
    if (profile.height_cm) setHeight(String(profile.height_cm));
    if (profile.weight_kg) setWeight(String(profile.weight_kg));
  }, [profile]);

  function num(s: string) {
    const n = Number.parseFloat(s.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  const ageN = num(age);
  const heightN = num(height);
  const weightN = num(weight);

  const ok =
    sex !== null &&
    ageN !== null && ageN >= 16 && ageN <= 90 &&
    heightN !== null && heightN >= 120 && heightN <= 220 &&
    weightN !== null && weightN >= 35 && weightN <= 200;

  async function handleNext() {
    if (!ok) return;
    setSaving(true);
    try {
      await update({
        sex,
        age: Math.round(ageN!),
        height_cm: Math.round(heightN!),
        weight_kg: weightN!,
      });
      router.push('/(onboarding)/activity' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={4}
      total={6}
      title="Quelques infos pour calculer tes apports"
      subtitle="Utilisé uniquement pour estimer tes besoins. Modifiable à tout moment."
      ctaDisabled={!ok}
      ctaLoading={saving}
      onCta={handleNext}
      onBack={() => router.back()}
    >
      <View style={{ gap: Spacing.lg }}>
        <Field label="Sexe biologique" palette={palette}>
          <Segmented
            value={sex}
            options={SEX_OPTIONS as any}
            onChange={(v: Sex) => setSex(v)}
          />
        </Field>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Âge" palette={palette}>
              <Input value={age} onChangeText={setAge} suffix="ans" palette={palette} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Taille" palette={palette}>
              <Input value={height} onChangeText={setHeight} suffix="cm" palette={palette} />
            </Field>
          </View>
        </View>

        <Field label="Poids actuel" palette={palette}>
          <Input value={weight} onChangeText={setWeight} suffix="kg" palette={palette} />
        </Field>
      </View>
    </OnboardingScaffold>
  );
}

function Field({ label, children, palette }: any) {
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
      {children}
    </View>
  );
}

function Input({
  value,
  onChangeText,
  suffix,
  palette,
}: {
  value: string;
  onChangeText: (s: string) => void;
  suffix: string;
  palette: any;
}) {
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={[styles.input, { color: palette.text, fontFamily: Fonts.sans }]}
      />
      <Text
        style={{
          color: palette.textSecondary,
          fontFamily: Fonts.sansMedium,
          fontSize: 13,
        }}
      >
        {suffix}
      </Text>
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
});
