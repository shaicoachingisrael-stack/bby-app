import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, BbyScreen, Card, Editorial, onTone } from '@/components/bby/kit';
import { NavHeader, plateColors, PlateChart, ScreenTitle } from '@/components/bby/nutrition/ui';
import { PLATES } from '@/lib/nutrition/plate';
import { RHYTHMS, useNutritionPrefs } from '@/lib/nutrition/prefs';

// Écran 10 — Ton assiette : les trois assiettes pour comparer, celle du rythme
// actuel mise en avant. Toucher une autre carte ne change rien : le rythme se
// règle dans « Affichage nutrition ».
export default function PlateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rhythm } = useNutritionPrefs();

  return (
    <BbyScreen bottomSpace={40}>
      <NavHeader />
      <ScreenTitle sub={t('v2nutrition.plate.sub')}>{t('v2nutrition.plate.title')}</ScreenTitle>

      {RHYTHMS.map((r) => {
        const on = r === rhythm;
        const tone = on ? 'light' : 'dark';
        const c = onTone(tone);
        const plate = PLATES[r];
        const colors = plateColors(on);
        const legend = [
          { key: 'veg', color: colors.veg, frac: plate.veg },
          { key: 'protein', color: colors.protein, frac: plate.protein },
          { key: 'starch', color: colors.starch, frac: plate.starch },
        ] as const;
        return (
          <Card key={r} tone={tone}>
            <View style={s.rowBetween}>
              <Text style={[s.cardTitle, { color: c.text }]}>{t(`v2nutrition.rhythm.${r}.title`)}</Text>
              {on ? <Text style={[s.tag, { color: c.muted }]}>{t('v2nutrition.plate.yours')}</Text> : null}
            </View>
            <Text style={[s.cardSub, { color: c.muted }]}>{t(`v2nutrition.rhythm.${r}.sub`)}</Text>
            <View style={[s.row, { marginTop: 14 }]}>
              <PlateChart plate={plate} size={104} onLight={on} />
              <View style={{ flex: 1, gap: 8 }}>
                {legend.map((l) => (
                  <View key={l.key} style={s.rowBetween}>
                    <View style={s.row6}>
                      <View
                        style={[
                          s.dot,
                          { backgroundColor: l.color },
                          on && l.key === 'protein' && { borderWidth: 1, borderColor: Bby.ink },
                        ]}
                      />
                      <Text style={[s.legend, { color: c.text }]}>{t(`v2nutrition.plate.${l.key}`)}</Text>
                    </View>
                    <Text style={[s.frac, { color: c.muted }]}>{t(`v2nutrition.fraction.${l.frac}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        );
      })}

      <Card tone="alt">
        <Text style={s.fatTitle}>{t('v2nutrition.plate.fatTitle')}</Text>
        <Text style={s.fatBody}>{t('v2nutrition.plate.fatBody')}</Text>
      </Card>

      <Editorial style={{ marginVertical: 12 }}>{t('v2nutrition.plate.editorial')}</Editorial>

      <ActionBar
        icon={ArrowRight}
        label={t('v2nutrition.plate.seeRecipes')}
        onPress={() => router.navigate({ pathname: '/(tabs)/nutrition', params: { section: 'recettes', at: `${Date.now()}` } } as any)}
      />
      <Pressable onPress={() => router.push('/nutrition/settings' as any)} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 10 }}>
        <Text style={s.change}>{t('v2nutrition.plate.changeRhythm')}</Text>
      </Pressable>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontFamily: BFont.display, fontSize: 22, letterSpacing: -0.2 },
  cardSub: { fontFamily: BFont.sans, fontSize: 13, marginTop: 2 },
  tag: { fontFamily: BFont.sans, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legend: { fontFamily: BFont.sansMedium, fontSize: 14 },
  frac: { fontFamily: BFont.sans, fontSize: 13 },
  fatTitle: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text },
  fatBody: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 20, color: Bby.muted, marginTop: 4 },
  change: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted },
});
