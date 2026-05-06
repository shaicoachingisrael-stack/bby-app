import { useRouter } from 'expo-router';
import { Dumbbell, Flame, Heart, Sparkles, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';

const GOALS = [
  {
    value: 'perte_de_poids',
    title: 'Perte de poids',
    description: 'Affiner la silhouette en gardant ton énergie.',
    icon: Flame,
  },
  {
    value: 'tonification',
    title: 'Tonification',
    description: 'Sculpter et raffermir, sans grossir.',
    icon: Sparkles,
  },
  {
    value: 'prise_de_masse',
    title: 'Prise de masse',
    description: 'Construire du muscle progressivement.',
    icon: Dumbbell,
  },
  {
    value: 'remise_en_forme',
    title: 'Remise en forme',
    description: 'Repartir doucement, sans pression.',
    icon: TrendingUp,
  },
  {
    value: 'bien_etre',
    title: 'Bien-être global',
    description: 'Bouger, manger, respirer mieux.',
    icon: Heart,
  },
] as const;

type Goal = (typeof GOALS)[number]['value'];

export default function OnboardingGoalStep() {
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
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={2}
      total={6}
      title="Quel est ton objectif ?"
      subtitle="Tu pourras le changer plus tard à tout moment."
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
            title={g.title}
            description={g.description}
            selected={goal === g.value}
            onPress={() => setGoal(g.value)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
