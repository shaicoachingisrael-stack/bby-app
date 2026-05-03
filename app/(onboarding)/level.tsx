import { useRouter } from 'expo-router';
import { Mountain, Sprout, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OnboardingOption } from '@/components/onboarding-option';
import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';

const LEVELS = [
  {
    value: 'debutant',
    title: 'Débutante',
    description: 'Je reprends une activité ou je débute.',
    icon: Sprout,
  },
  {
    value: 'intermediaire',
    title: 'Intermédiaire',
    description: 'Je m\'entraîne 2 à 3 fois par semaine.',
    icon: Zap,
  },
  {
    value: 'avance',
    title: 'Avancée',
    description: 'Je m\'entraîne 4+ fois par semaine, je connais mon corps.',
    icon: Mountain,
  },
] as const;

type Level = (typeof LEVELS)[number]['value'];

export default function OnboardingLevelStep() {
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
      router.push('/(onboarding)/targets' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={3}
      total={4}
      title="Quel est ton niveau ?"
      subtitle="On adapte les recommandations à ton expérience actuelle."
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
            title={l.title}
            description={l.description}
            selected={level === l.value}
            onPress={() => setLevel(l.value)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
