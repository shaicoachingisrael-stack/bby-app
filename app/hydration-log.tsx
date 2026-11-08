import { useRouter } from 'expo-router';
import { Droplet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { ActionBar, BFont, Bby, Card, Editorial, PillButton } from '@/components/bby/kit';
import { FooterScreen, NavHeader, ScreenTitle } from '@/components/bby/nutrition/ui';
import { useDayLog } from '@/lib/nutrition/day-log';
import { liters } from '@/lib/nutrition/format';
import { useDayTargets } from '@/lib/nutrition/targets';

// Hydratation du jour : + 20 cl / + 50 cl, cumul simple, aucun compteur à remplir.
export default function HydrationLogScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { waterMl, addWater } = useDayLog();
  const { targets } = useDayTargets();
  const lang = i18n.language;

  const add = (ml: number) => addWater(ml).catch((e) => Alert.alert(t('v2nutrition.common.error'), e?.message ?? ''));

  return (
    <FooterScreen footer={<ActionBar label={t('v2nutrition.common.done')} onPress={() => router.back()} />}>
      <NavHeader />
      <ScreenTitle sub={t('v2nutrition.water.sub')}>{t('v2nutrition.water.title')}</ScreenTitle>
      <Card tone="alt">
        <View style={s.row}>
          <View style={s.drop}>
            <Droplet size={22} color={Bby.text} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.big}>{t('v2nutrition.common.liters', { l: liters(waterMl, lang) })}</Text>
            <Text style={s.sub}>{t('v2nutrition.today.waterTracked', { l: liters(targets?.waterMl ?? 2000, lang, 0.5) })}</Text>
          </View>
        </View>
        <View style={[s.row, { marginTop: 16, gap: 8 }]}>
          <PillButton label={t('v2nutrition.today.add20')} variant="outline" style={{ flex: 1 }} onPress={() => add(200)} />
          <PillButton label={t('v2nutrition.today.add50')} variant="outline" style={{ flex: 1 }} onPress={() => add(500)} />
        </View>
      </Card>
      <Editorial style={{ marginTop: 12 }}>{t('v2nutrition.water.editorial')}</Editorial>
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  drop: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: BFont.display, fontSize: 32, color: Bby.text },
  sub: { fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, marginTop: 2 },
});
