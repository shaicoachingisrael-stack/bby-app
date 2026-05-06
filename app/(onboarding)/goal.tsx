import { useRouter } from 'expo-router';
import { Dumbbell, Flame, Heart, Sparkles, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';

const GOALS = [
  {
    value: 'perte_de_poids',
    titleKey: 'onboarding.goal.perte_de_poids',
    descKey: 'onboarding.goal.perte_de_poids_desc',
    icon: Flame,
  },
  {
    value: 'tonification',
    titleKey: 'onboarding.goal.tonification',
    descKey: 'onboarding.goal.tonification_desc',
    icon: Sparkles,
  },
  {
    value: 'prise_de_masse',
    titleKey: 'onboarding.goal.prise_de_masse',
    descKey: 'onboarding.goal.prise_de_masse_desc',
    icon: Dumbbell,
  },
  {
    value: 'remise_en_forme',
    titleKey: 'onboarding.goal.remise_en_forme',
    descKey: 'onboarding.goal.remise_en_forme_desc',
    icon: TrendingUp,
  },
  {
    value: 'bien_etre',
    titleKey: 'onboarding.goal.bien_etre',
    descKey: 'onboarding.goal.bien_etre_desc',
    icon: Heart,
  },
] as const;

type Goal = (typeof GOALS)[number]['value'];

export default function OnboardingGoalStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, update } = useProfile();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.goal) setGoal(profile.goal as Goal);
  }, [profile?.goal]);

  async function handleNext() {
    if (!goal) return;
    setSaving(true);
    try {
      await update({ goal });
      router.push('/(onboarding)/level' as any);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.saveImpossible'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={2}
      total={6}
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      ctaDisabled={!goal}
      ctaLoading={saving}
      onCta={handleNext}
      onBack={() => router.back()}
    >
      <View style={{ gap: Spacing.md }}>
        {GOALS.map((g) => (
          <OnboardingOption
            key={g.value}
            icon={g.icon}
            title={t(g.titleKey)}
            description={t(g.descKey)}
            selected={goal === g.value}
            onPress={() => setGoal(g.value)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
