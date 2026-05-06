import { useRouter } from 'expo-router';
import { Bed, Bike, Flame, Footprints, Mountain } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas d\'exercice', icon: Bed },
  { value: 'light', label: 'Léger', description: '1 à 3 séances par semaine', icon: Footprints },
  { value: 'moderate', label: 'Modéré', description: '3 à 5 séances par semaine', icon: Bike },
  { value: 'active', label: 'Actif', description: '6 à 7 séances par semaine', icon: Flame },
  { value: 'very_active', label: 'Très actif', description: 'Sport intensif quotidien', icon: Mountain },
] as const;

const INTENSITY_OPTIONS = [
  { value: 'gentle', label: 'Douce' },
  { value: 'moderate', label: 'Modérée' },
  { value: 'intense', label: 'Soutenue' },
] as const;

const SPLIT_OPTIONS = [
  { value: 'balanced', label: 'Équilibrée' },
  { value: 'high_protein', label: 'Riche en protéines' },
] as const;

type Activity = (typeof ACTIVITY_OPTIONS)[number]['value'];
type Intensity = (typeof INTENSITY_OPTIONS)[number]['value'];
type Split = (typeof SPLIT_OPTIONS)[number]['value'];

export default function OnboardingActivityStep() {
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, update } = useProfile();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [split, setSplit] = useState<Split>('balanced');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.activity_level) setActivity(profile.activity_level as Activity);
    if (profile.goal_intensity) setIntensity(profile.goal_intensity as Intensity);
    if (profile.macro_split) setSplit(profile.macro_split as Split);
  }, [profile]);

  // Intensity is only required if goal != "maintenance" (mapped from goal value)
  const goal = profile?.goal ?? null;
  const isMaintenance =
    goal === 'tonification' || goal === 'remise_en_forme' || goal === 'bien_etre';
  const needsIntensity = !isMaintenance && goal !== null;

  const ok = activity !== null && (!needsIntensity || intensity !== null);

  async function handleNext() {
    if (!ok) return;
    setSaving(true);
    try {
      await update({
        activity_level: activity,
        goal_intensity: needsIntensity ? intensity : null,
        macro_split: split,
      });
      router.push('/(onboarding)/targets' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={5}
      total={6}
      title="Ton rythme et tes préférences"
      subtitle="On adapte tes apports en fonction de ton activité quotidienne."
      ctaDisabled={!ok}
      ctaLoading={saving}
      onCta={handleNext}
      onBack={() => router.back()}
    >
      <View style={{ gap: Spacing.xl }}>
        <View style={{ gap: Spacing.sm }}>
          <Text
            style={{
              color: palette.textSecondary,
              fontFamily: Fonts.sansMedium,
              fontSize: 11,
              letterSpacing: 1.4,
            }}
          >
            ACTIVITÉ QUOTIDIENNE
          </Text>
          <View style={{ gap: Spacing.md }}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <OnboardingOption
                key={opt.value}
                icon={opt.icon}
                title={opt.label}
                description={opt.description}
                selected={activity === opt.value}
                onPress={() => setActivity(opt.value)}
              />
            ))}
          </View>
        </View>

        {needsIntensity && (
          <View style={{ gap: Spacing.sm }}>
            <Text
              style={{
                color: palette.textSecondary,
                fontFamily: Fonts.sansMedium,
                fontSize: 11,
                letterSpacing: 1.4,
              }}
            >
              INTENSITÉ DE TON OBJECTIF
            </Text>
            <Segmented
              value={intensity}
              options={INTENSITY_OPTIONS as any}
              onChange={(v: Intensity) => setIntensity(v)}
            />
          </View>
        )}

        <View style={{ gap: Spacing.sm }}>
          <Text
            style={{
              color: palette.textSecondary,
              fontFamily: Fonts.sansMedium,
              fontSize: 11,
              letterSpacing: 1.4,
            }}
          >
            RÉPARTITION DES MACROS
          </Text>
          <Segmented
            value={split}
            options={SPLIT_OPTIONS as any}
            onChange={(v: Split) => setSplit(v)}
          />
        </View>
      </View>
    </OnboardingScaffold>
  );
}
