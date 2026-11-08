import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ellipsis, MessageCircle, Pencil } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { BFont, Bby, Card, Chip, PillButton, RoundButton } from '@/components/bby/kit';
import { BackRow, Body, CardTitle, MScreen, mstyles, PhraseButtons, PrivateNote, Small } from '@/components/bby/mindset/ui';
import { isMood } from '@/components/bby/mindset/views';
import { shortDate } from '@/lib/mindset/core';
import { useJournalEntry } from '@/lib/mindset/use-journal';

// Écran 8 · Une page du journal (relecture). Une zone vide n'est pas affichée.
export default function JournalPageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { entry, info, loading, refresh, remove } = useJournalEntry(id);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading || !entry) return <MScreen><BackRow /></MScreen>;

  const isParcours = entry.kind === 'parcours';
  const isNote = entry.kind === 'journal';
  const date = shortDate(entry.created_at);
  const victories = (entry.victories ?? []).filter((v) => v.trim());
  const words = [entry.body, entry.gratitude, entry.tomorrow_intention, entry.other_text, ...victories]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  const menu = () =>
    Alert.alert(t('v2mindset.page.deleteTitle'), t('v2mindset.page.deleteBody'), [
      { text: t('v2mindset.common.cancel'), style: 'cancel' },
      {
        text: t('v2mindset.page.delete'),
        style: 'destructive',
        onPress: async () => {
          await remove();
          router.back();
        },
      },
    ]);

  // « En parler au Coach » : le texte de la page n'est transmis que sur ce geste explicite,
  // et seulement pré-rempli : c'est elle qui l'envoie.
  const toCoach = () => {
    const lines = [t('v2mindset.page.coachIntro', { date })];
    if (isNote) {
      if (entry.body) lines.push(entry.body);
    } else if (isParcours) {
      if (info?.question) lines.push(`${t('v2mindset.parcours.question')} : ${info.question}`);
      if (entry.body) lines.push(entry.body);
    } else {
      if (victories.length) lines.push(`${t('v2mindset.write.victories')} :\n${victories.map((v, i) => `${i + 1}. ${v}`).join('\n')}`);
      if (entry.gratitude) lines.push(`${t('v2mindset.write.gratitude')} : ${entry.gratitude}`);
      if (entry.tomorrow_intention) lines.push(`${t('v2mindset.write.tomorrow')} : ${entry.tomorrow_intention}`);
      if (entry.other_text) lines.push(`${t('v2mindset.write.other')} : ${entry.other_text}`);
    }
    router.push({ pathname: '/chat', params: { prefill: lines.join('\n\n') } } as any);
  };

  const edit = () => {
    if (isParcours) router.push(`/mindset/day?program=${entry.program_id}&day=${entry.program_day}` as any);
    else router.push(`/mindset/write?id=${entry.id}` as any);
  };

  return (
    <MScreen>
      <BackRow right={<RoundButton icon={Ellipsis} variant="outline" size={48} label={t('v2mindset.page.menu')} onPress={menu} />} />
      <View style={mstyles.chips}>
        <Chip label={date} yellow />
        {isParcours ? <Chip label={t('v2mindset.closing.parcours')} /> : null}
        {!isParcours && entry.mood && isMood(entry.mood) ? <Chip label={t(`v2mindset.moods.${entry.mood}`)} /> : null}
      </View>
      <Text style={[mstyles.bigTitle, { marginTop: 6 }]}>{isParcours ? info?.title ?? '' : isNote ? t('v2mindset.journal.note') : t('v2mindset.journal.bilan')}</Text>
      <Small>
        {isParcours && info?.programTitle ? `${info.programTitle} · ` : ''}
        {t('v2mindset.page.readTime', { n: minutes })}
      </Small>

      {isNote ? (
        <Card tone="dark" style={{ marginTop: 8 }}>
          <Body>{entry.body ?? ''}</Body>
        </Card>
      ) : isParcours ? (
        <>
          {info?.question ? (
            <Card tone="alt" style={{ marginTop: 8 }}>
              <CardTitle>{t('v2mindset.parcours.question')}</CardTitle>
              <Text style={[mstyles.serif, { color: Bby.text, marginTop: 8 }]}>{info.question}</Text>
            </Card>
          ) : null}
          {entry.body ? (
            <Card tone="light">
              <CardTitle dark>{t('v2mindset.page.answer')}</CardTitle>
              <Body dark style={{ marginTop: 8 }}>{entry.body}</Body>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          {victories.length ? (
            <Card tone="light" style={{ marginTop: 8 }}>
              <CardTitle dark>{t('v2mindset.write.victories')}</CardTitle>
              <View style={{ gap: 10, marginTop: 10 }}>
                {victories.map((v, i) => (
                  <View key={i} style={s.victory}>
                    <View style={s.num}>
                      <Text style={s.numText}>{i + 1}</Text>
                    </View>
                    <Body dark style={{ flex: 1 }}>{v}</Body>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
          {entry.gratitude ? (
            <Card tone="alt">
              <CardTitle>{t('v2mindset.write.gratitude')}</CardTitle>
              <Body style={{ marginTop: 8 }}>{entry.gratitude}</Body>
            </Card>
          ) : null}
          {entry.tomorrow_intention ? (
            <Card tone="yellow">
              <CardTitle dark>{t('v2mindset.write.tomorrow')}</CardTitle>
              <Text style={[mstyles.serif, { color: Bby.ink, marginTop: 8 }]}>{entry.tomorrow_intention}</Text>
              <Small dark style={{ marginTop: 8 }}>{t('v2mindset.write.tomorrowNote')}</Small>
              <View style={{ marginTop: 12 }}>
                <PhraseButtons text={entry.tomorrow_intention} source="page_journal" size={40} />
              </View>
            </Card>
          ) : null}
          {entry.other_text ? (
            <Card tone="dark">
              <CardTitle>{t('v2mindset.write.other')}</CardTitle>
              <Body style={{ marginTop: 8, color: Bby.muted }}>{entry.other_text}</Body>
            </Card>
          ) : null}
        </>
      )}

      <View style={s.actions}>
        {isNote ? null : (
          <PillButton label={t('v2mindset.common.edit')} icon={Pencil} variant="outline" onPress={edit} style={{ flex: 1 }} />
        )}
        <PillButton label={t('v2mindset.page.coach')} icon={MessageCircle} variant="white" onPress={toCoach} style={{ flex: 1.4 }} />
      </View>
      <PrivateNote text={t('v2mindset.write.private')} />
    </MScreen>
  );
}

const s = StyleSheet.create({
  victory: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: Bby.ink, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  numText: { fontFamily: BFont.display, fontSize: 11, color: Bby.yellow },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
