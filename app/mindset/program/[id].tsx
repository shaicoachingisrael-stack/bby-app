import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Card, Chip } from '@/components/bby/kit';
import { BackRow, Body, MindsetFilters, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { useParcours } from '@/lib/mindset/use-parcours';

const PHASES = [
  { key: 'comprendre', a: 1, b: 2 },
  { key: 'essayer', a: 3, b: 5 },
  { key: 'ancrer', a: 6, b: 7 },
] as const;

// Écran 2 · Fiche d'un parcours : présentation avant de commencer.
export default function ParcoursSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { program, progress, state, loading, refresh, start } = useParcours(id);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading || !program) return <MScreen><BackRow /></MScreen>;

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    await start();
    setBusy(false);
    router.push(`/mindset/day?program=${program.id}` as any);
  };

  const restart = () =>
    Alert.alert(t('v2mindset.parcours.restartTitle'), t('v2mindset.parcours.restartBody'), [
      { text: t('v2mindset.common.cancel'), style: 'cancel' },
      { text: t('v2mindset.parcours.restart'), onPress: begin },
    ]);

  // Commencer · Reprendre au jour N · (terminé) Retrouver mon geste / Recommencer
  let label = t('v2mindset.parcours.start');
  let action = begin;
  if (state.started && !state.finished) {
    label = t('v2mindset.parcours.resume', { n: state.day });
    action = async () => router.push(`/mindset/day?program=${program.id}` as any);
  } else if (state.finished && !progress?.kept) {
    label = t('v2mindset.parcours.findGesture');
    action = async () => router.push(`/mindset/closing?program=${program.id}` as any);
  } else if (state.finished) {
    label = t('v2mindset.parcours.restart');
    action = async () => restart();
  }

  return (
    <MScreen>
      <BackRow />
      <MindsetFilters value="parcours" />

      {program.photo_url ? (
        <View style={s.photo}>
          <Image source={{ uri: program.photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      ) : null}

      <View style={[mstyles.chips, { marginTop: 8 }]}>
        <Chip label={t('v2mindset.common.daysCount', { count: program.day_count })} yellow />
        {program.minutes_range ? <Chip label={program.minutes_range} /> : null}
      </View>
      <Text style={[mstyles.bigTitle, { marginTop: 6 }]}>{program.title}</Text>
      {program.subtitle ? <Text style={[mstyles.serif, s.subtitle]}>{program.subtitle}</Text> : null}

      {program.for_you_if ? (
        <Card tone="dark" style={{ marginTop: 8 }}>
          <Small>{t('v2mindset.parcours.forYouIf')}</Small>
          <Body style={{ marginTop: 8 }}>{program.for_you_if}</Body>
        </Card>
      ) : null}

      <Card tone="alt">
        <Small>{t('v2mindset.parcours.path')}</Small>
        {PHASES.map((p, i) => (
          <View key={p.key}>
            {i > 0 ? <View style={mstyles.sep} /> : null}
            <View style={s.phaseRow}>
              <Text style={s.phase}>{t(`v2mindset.parcours.phase.${p.key}`)}</Text>
              <Small>{t('v2mindset.parcours.daysRange', { a: p.a, b: p.b })}</Small>
            </View>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: 10 }}>
        <ActionBar
          label={label}
          icon={Check}
          onPress={action}
          disabled={busy}
          trailing={<ArrowRight size={20} color={Bby.ink} />}
          note={t('v2mindset.parcours.dailyNote')}
        />
      </View>
      {state.started && !state.finished ? (
        <Pressable onPress={restart} hitSlop={10} style={{ alignSelf: 'center', marginTop: 8 }}>
          <Small style={{ textDecorationLine: 'underline' }}>{t('v2mindset.parcours.restart')}</Small>
        </Pressable>
      ) : null}
    </MScreen>
  );
}

const s = StyleSheet.create({
  photo: { height: 190, borderRadius: 26, overflow: 'hidden', backgroundColor: Bby.card, marginTop: 4 },
  subtitle: { color: Bby.muted, fontSize: 18, lineHeight: 25, marginTop: 4 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  phase: { fontFamily: BFont.display, fontSize: 20, color: Bby.text, letterSpacing: -0.2 },
});
