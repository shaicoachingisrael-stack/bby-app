import { useRouter } from 'expo-router';
import { Bed, Bike, Flame, Footprints, Mountain } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

const ACTIVITY_DEFS = [
  { value: 'sedentary', labelKey: 'onboarding.activity.sedentary', descKey: 'onboarding.activity.sedentary_desc', icon: Bed },
  { value: 'light', labelKey: 'onboarding.activity.light', descKey: 'onboarding.activity.light_desc', icon: Footprints },
  { value: 'moderate', labelKey: 'onboarding.activity.moderate', descKey: 'onboarding.activity.moderate_desc', icon: Bike },
  { value: 'active', labelKey: 'onboarding.activity.active', descKey: 'onboarding.activity.active_desc', icon: Flame },
  { value: 'very_active', labelKey: 'onboarding.activity.very_active', descKey: 'onboarding.activity.very_active_desc', icon: Mountain },
] as const;

const INTENSITY_VALUES = ['gentle', 'moderate', 'intense'] as const;
const SPLIT_VALUES = ['balanced', 'high_protein'] as const;

type Activity = (typeof ACTIVITY_DEFS)[number]['value'];
type Intensity = (typeof INTENSITY_VALUES)[number];
type Split = (typeof SPLIT_VALUES)[number];

export default function OnboardingActivityStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, update } = useProfile();

  const INTENSITY_OPTIONS = [
    { value: 'gentle', label: t('onboarding.activity.gentle') },
    { value: 'moderate', label: t('onboarding.activity.moderateIntensity') },
    { value: 'intense', label: t('onboarding.activity.intense') },
  ] as const;

  const SPLIT_OPTIONS = [
    { value: 'balanced', label: t('onboarding.activity.balanced') },
    { value: 'high_protein', label: t('onboarding.activity.highProtein') },
  ] as const;

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
      Alert.alert(t('common.error'), e?.message ?? t('common.saveImpossible'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={5}
      total={6}
      title={t('onboarding.activity.title')}
      subtitle={t('onboarding.activity.subtitle')}
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
            {t('onboarding.activity.section').toUpperCase()}
          </Text>
          <View style={{ gap: Spacing.md }}>
            {ACTIVITY_DEFS.map((opt) => (
              <OnboardingOption
                key={opt.value}
                icon={opt.icon}
                title={t(opt.labelKey)}
                description={t(opt.descKey)}
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
              {t('onboarding.activity.intensitySection').toUpperCase()}
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
            {t('onboarding.activity.splitSection').toUpperCase()}
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
