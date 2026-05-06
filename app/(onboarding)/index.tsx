import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding-scaffold';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/lib/use-profile';

export default function OnboardingNameStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { profile, update } = useProfile();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
  }, [profile?.display_name]);

  async function handleNext() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await update({ display_name: name.trim() });
      router.push('/(onboarding)/goal' as any);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.saveImpossible'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step={1}
      total={6}
      title={t('onboarding.name.title')}
      subtitle={t('onboarding.name.subtitle')}
      ctaDisabled={!name.trim()}
      ctaLoading={saving}
      onCta={handleNext}
    >
      <TextInput
        placeholder={t('onboarding.name.placeholder')}
        placeholderTextColor={palette.textSecondary}
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={handleNext}
        style={[
          styles.input,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            color: palette.text,
            fontFamily: Fonts.sans,
          },
        ]}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
  },
});
