import { useRouter } from 'expo-router';
import { Mountain, Sprout, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';

const LEVELS = [
  {
    value: 'debutant',
    titleKey: 'onboarding.level.debutant',
    descKey: 'onboarding.level.debutant_desc',
    icon: Sprout,
  },
  {
    value: 'intermediaire',
    titleKey: 'onboarding.level.intermediaire',
    descKey: 'onboarding.level.intermediaire_desc',
    icon: Zap,
  },
  {
    value: 'avance',
    titleKey: 'onboarding.level.avance',
    descKey: 'onboarding.level.avance_desc',
    icon: Mountain,
  },
] as const;

type Level = (typeof LEVELS)[number]['value'];

export default function OnboardingLevelStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, update } = useProfile();
  const [level, setLevel] = useState<Level | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.fitness_level) setLevel(profile.fitness_level as Level);
  }, [profile?.fitness_level]);

  async function handleNext() {
    if (!level) return;
    setSaving(true);
    try {
      await update({ fitness_level: level });
      router.push('/(onboarding)/bio' as any);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.saveImpossible'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={3}
      total={6}
      title={t('onboarding.level.title')}
      subtitle={t('onboarding.level.subtitle')}
      ctaDisabled={!level}
      ctaLoading={saving}
      onCta={handleNext}
      onBack={() => router.back()}
    >
      <View style={{ gap: Spacing.md }}>
        {LEVELS.map((l) => (
          <OnboardingOption
            key={l.value}
            icon={l.icon}
            title={t(l.titleKey)}
            description={t(l.descKey)}
            selected={level === l.value}
            onPress={() => setLevel(l.value)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
