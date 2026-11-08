import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { BFont, Bby, BbyScreen, Card, Editorial, SectionHeader } from '@/components/bby/kit';
import { ChoiceCard, NavHeader, ScreenTitle, Toggle } from '@/components/bby/nutrition/ui';
import { RHYTHMS, useNutritionPrefs } from '@/lib/nutrition/prefs';

// Écran 4 — Affichage nutrition : mode, calories, rythme du moment.
// Tout s'enregistre sur le compte dès qu'on touche, sans bouton ni confirmation.
export default function NutritionSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tracking, showCalories, rhythm, setTracking, setShowCalories, setRhythm } = useNutritionPrefs();

  // Message discret après un changement de rythme.
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const changeRhythm = (r: typeof rhythm) => {
    if (r === rhythm) return;
    setRhythm(r);
    setNotice(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(false), 3000);
  };

  return (
    <BbyScreen bottomSpace={40}>
      <NavHeader />
      <ScreenTitle sub={t('v2nutrition.settings.sub')}>{t('v2nutrition.settings.title')}</ScreenTitle>

      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        <ChoiceCard
          title={t('v2nutrition.settings.plain.title')}
          tag={t('v2nutrition.settings.default')}
          sub={t('v2nutrition.settings.plain.sub')}
          selected={!tracking}
          onPress={() => tracking && setTracking(false)}
        />
        <ChoiceCard
          title={t('v2nutrition.settings.tracked.title')}
          sub={t('v2nutrition.settings.tracked.sub')}
          selected={tracking}
          onPress={() => !tracking && setTracking(true)}
        />
      </View>

      <Card style={{ paddingVertical: 16 }}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitle}>{t('v2nutrition.settings.calories.title')}</Text>
            <Text style={s.toggleSub}>{t('v2nutrition.settings.calories.sub')}</Text>
          </View>
          <Toggle value={showCalories} onChange={setShowCalories} label={t('v2nutrition.settings.calories.title')} />
        </View>
      </Card>

      <SectionHeader title={t('v2nutrition.settings.rhythmTitle')} />
      <Text style={s.toggleSub}>{t('v2nutrition.settings.rhythmSub')}</Text>
      <View accessibilityRole="radiogroup" style={{ gap: 10, marginTop: 6 }}>
        {RHYTHMS.map((r) => (
          <ChoiceCard
            key={r}
            compact
            title={t(`v2nutrition.rhythm.${r}.title`)}
            sub={t(`v2nutrition.rhythm.${r}.sub`)}
            selected={rhythm === r}
            onPress={() => changeRhythm(r)}
          />
        ))}
      </View>
      {notice ? (
        <Text style={s.notice} accessibilityLiveRegion="polite">
          {t('v2nutrition.settings.rhythmSaved')}
        </Text>
      ) : null}

      <Pressable onPress={() => router.push('/nutrition/plate' as any)} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
        <Text style={s.link}>{t('v2nutrition.settings.seePlate')}</Text>
      </Pressable>

      <Editorial style={{ marginTop: 18 }}>{t('v2nutrition.settings.editorial')}</Editorial>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  toggleSub: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 2 },
  notice: { fontFamily: BFont.sans, fontSize: 13, color: Bby.yellow },
  link: { fontFamily: BFont.sansMedium, fontSize: 14, color: Bby.text, textDecorationLine: 'underline' },
});
