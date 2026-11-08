import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Ellipsis } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { Bby, Card, Chip, PillButton, RoundButton } from '@/components/bby/kit';
import { BackRow, CardTitle, DayBadge, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { monthName, shortDate } from '@/lib/mindset/core';
import { useMyRituals, useRitualDetail } from '@/lib/mindset/use-my-rituals';
import { ritualIcon } from '@/lib/ritual-icons';

// Écran 11 · Détail d'un rituel : la semaine, l'ancrage, l'action du jour.
// Aucun jour manqué n'est montré : seuls les jours faits comptent.
export default function RitualDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { ritual, loading, refresh, doneToday, week, month, elapsed, toggleToday } = useRitualDetail(id);
  const { archive } = useMyRituals();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading || !ritual) return <MScreen><BackRow /></MScreen>;

  const Icon = ritualIcon(ritual.icon);
  const edit = () => router.push(`/mindset/ritual-new?id=${ritual.id}` as any);
  const remove = () =>
    Alert.alert(t('v2mindset.ritual.removeTitle'), t('v2mindset.ritual.removeBody'), [
      { text: t('v2mindset.common.cancel'), style: 'cancel' },
      {
        text: t('v2mindset.ritual.remove'),
        style: 'destructive',
        onPress: async () => {
          await archive(ritual.id);
          router.back();
        },
      },
    ]);
  const menu = () =>
    Alert.alert(ritual.label, undefined, [
      { text: t('v2mindset.common.edit'), onPress: edit },
      { text: t('v2mindset.ritual.remove'), style: 'destructive', onPress: remove },
      { text: t('v2mindset.common.cancel'), style: 'cancel' },
    ]);

  return (
    <MScreen>
      <BackRow right={<RoundButton icon={Ellipsis} variant="outline" size={48} label={t('v2mindset.page.menu')} onPress={menu} />} />
      <View style={s.iconDot}>
        <Icon size={30} color={Bby.ink} strokeWidth={2} />
      </View>
      <Text style={[mstyles.bigTitle, { marginTop: 10 }, ritual.label.length > 32 && { fontSize: 24, lineHeight: 28 }]}>{ritual.label}</Text>
      <Chip label={t('v2mindset.ritual.everyDay')} />

      <Card tone="light" style={{ marginTop: 10 }}>
        <View style={mstyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <CardTitle dark>{t('v2mindset.ritual.week')}</CardTitle>
            <Small dark style={{ marginTop: 4 }}>{t('v2mindset.ritual.weekSub')}</Small>
            <Small dark>{t('v2mindset.ritual.monthLine', { month: monthName(new Date()), done: month, elapsed })}</Small>
          </View>
          <DayBadge label={`${week}/7`} size={64} />
        </View>
      </Card>

      <Card tone="alt">
        <View style={mstyles.rowBetween}>
          <Small>{t('v2mindset.ritual.anchor')}</Small>
          <Pressable onPress={edit} hitSlop={10}>
            <Small>{t('v2mindset.common.edit')}</Small>
          </Pressable>
        </View>
        {ritual.anchor ? (
          <Text style={[mstyles.serif, { color: Bby.text, marginTop: 8 }]}>{ritual.anchor}</Text>
        ) : (
          <Small style={{ marginTop: 8, fontSize: 14 }}>{t('v2mindset.ritual.anchorEmpty')}</Small>
        )}
      </Card>

      <Card tone="yellow">
        <View style={mstyles.rowBetween}>
          <CardTitle dark>{t('v2mindset.ritual.today')}</CardTitle>
          <Small dark>{shortDate(new Date())}</Small>
        </View>
        <View style={[mstyles.rowBetween, { marginTop: 14 }]}>
          <Small dark style={{ fontSize: 14 }}>{doneToday ? t('v2mindset.ritual.doneToday') : t('v2mindset.ritual.notYet')}</Small>
          {doneToday ? (
            <PillButton label={t('v2mindset.ritual.undo')} variant="outlineDark" onPress={toggleToday} style={s.pill} />
          ) : (
            <PillButton label={t('v2mindset.common.done')} icon={Check} onPress={toggleToday} style={s.pill} />
          )}
        </View>
      </Card>

      <View style={s.actions}>
        <PillButton label={t('v2mindset.common.edit')} variant="outline" onPress={edit} style={{ flex: 1 }} />
        <PillButton label={t('v2mindset.ritual.remove')} variant="outline" onPress={remove} style={{ flex: 1 }} />
      </View>
    </MScreen>
  );
}

const s = StyleSheet.create({
  iconDot: { width: 72, height: 72, borderRadius: 36, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pill: { height: 46, paddingHorizontal: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
