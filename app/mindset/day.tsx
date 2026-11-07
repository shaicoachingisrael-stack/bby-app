import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, BookOpen, Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Card, Chip, RoundButton } from '@/components/bby/kit';
import { BackRow, Body, CardTitle, MindsetFilters, MInput, MScreen, mstyles, PhraseButtons, Small } from '@/components/bby/mindset/ui';
import { useAuth } from '@/lib/auth-provider';
import { KEPT_DAYS, paragraphs } from '@/lib/mindset/core';
import { upsertParcoursPage, useParcours } from '@/lib/mindset/use-parcours';

// Écran 3 · Jour d'un parcours : idée, question, geste, phrase à emporter.
export default function ParcoursDayScreen() {
  const params = useLocalSearchParams<{ program: string; day?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { program, progress, state, loading, dayOf, saveAnswer, finishDay } = useParcours(params.program);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const loadedFor = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ day: number; text: string } | null>(null);

  // Jour affiché : celui demandé s'il est déjà ouvert, sinon le jour en cours.
  const requested = params.day ? parseInt(params.day, 10) : NaN;
  const maxDay = state.day;
  const viewDay = Number.isFinite(requested) && requested >= 1 && requested <= maxDay ? requested : state.day;
  const isOpenDay = !state.finished && !state.lockedToday && viewDay === state.day;
  const day = dayOf(viewDay);

  // Pas encore commencé : la fiche d'abord.
  useEffect(() => {
    if (!loading && program && !progress) router.replace(`/mindset/program/${program.id}` as any);
  }, [loading, program, progress, router]);

  useEffect(() => {
    if (!progress || loadedFor.current === viewDay) return;
    loadedFor.current = viewDay;
    setAnswer(progress.answers?.[String(viewDay)] ?? '');
  }, [progress, viewDay]);

  // Brouillon enregistré à la frappe ; un jour déjà fait met aussi à jour sa page du journal.
  const ctx = useRef({ saveAnswer, user, programId: program?.id, isOpenDay });
  ctx.current = { saveAnswer, user, programId: program?.id, isOpenDay };
  const flush = async () => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    const c = ctx.current;
    await c.saveAnswer(p.day, p.text);
    if (c.user && c.programId && !c.isOpenDay && p.text.trim()) await upsertParcoursPage(c.user.id, c.programId, p.day, p.text.trim());
    setSaved(true);
  };
  const onChange = (text: string) => {
    setAnswer(text);
    setSaved(false);
    pending.current = { day: viewDay, text };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      flush();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (loading || !program || !progress || !day) return <MScreen><BackRow /></MScreen>;

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    await finishDay(viewDay, answer);
    setBusy(false);
    if (viewDay >= program.day_count) router.replace(`/mindset/closing?program=${program.id}` as any);
    else router.navigate('/(tabs)/today' as any);
  };

  const phase = day.phase ? t(`v2mindset.parcours.phase.${day.phase}`) : null;
  const placeholder = viewDay === KEPT_DAYS.anchor ? t('v2mindset.parcours.anchorPlaceholder') : t('v2mindset.parcours.answerPlaceholder');

  return (
    <MScreen>
      <BackRow
        right={
          <RoundButton
            icon={BookOpen}
            variant="outline"
            size={48}
            label={t('v2mindset.parcours.myJournal')}
            onPress={() => router.navigate({ pathname: '/(tabs)/mindset', params: { filter: 'journal' } } as any)}
          />
        }
      />
      <MindsetFilters value="parcours" />

      <View style={[mstyles.chips, { marginTop: 8 }]}>
        <Chip label={t('v2mindset.parcours.dayChip', { n: viewDay, total: program.day_count })} yellow />
        {phase ? <Chip label={phase} /> : null}
      </View>
      <Text style={[mstyles.bigTitle, { marginTop: 4 }]}>{day.title}</Text>
      <Small>{t('v2mindset.parcours.daySub', { title: program.title, min: day.minutes ?? 5 })}</Small>

      <Card tone="light" style={{ marginTop: 8 }}>
        <CardTitle dark>{t('v2mindset.parcours.idea')}</CardTitle>
        <View style={{ gap: 12, marginTop: 10 }}>
          {paragraphs(day.idea).map((p, i) => (
            <Body key={i} dark style={{ color: Bby.mutedOnLight }}>
              {p}
            </Body>
          ))}
        </View>
      </Card>

      <Card tone="alt">
        <CardTitle>{t('v2mindset.parcours.question')}</CardTitle>
        <Text style={[mstyles.serif, s.question]}>{day.prompt_text}</Text>
        <View style={[mstyles.rowBetween, { marginTop: 8, marginBottom: 8 }]}>
          <Small>{t('v2mindset.common.answerPrivate')}</Small>
          {saved && answer.trim() ? <Small>{t('v2mindset.common.draftSaved')}</Small> : null}
        </View>
        <MInput value={answer} onChangeText={onChange} placeholder={placeholder} multiline />
      </Card>

      {day.gesture ? (
        <Card tone="yellow">
          <View style={mstyles.rowBetween}>
            <CardTitle dark>{t('v2mindset.parcours.gesture')}</CardTitle>
            {isOpenDay ? <Small dark>{t('v2mindset.parcours.gestureReminder')}</Small> : null}
          </View>
          <Text style={s.gesture}>{day.gesture}</Text>
        </Card>
      ) : null}

      {day.take_away ? (
        <View style={s.takeAway}>
          <Small>{t('v2mindset.parcours.takeAway')}</Small>
          <Text style={s.takeAwayText}>{day.take_away}</Text>
          <PhraseButtons text={day.take_away} source="phrase_parcours" variant="outline" size={44} />
        </View>
      ) : null}

      {isOpenDay ? (
        <ActionBar
          label={t('v2mindset.parcours.finishDay')}
          icon={Check}
          onPress={finish}
          disabled={busy}
          trailing={<ArrowRight size={20} color={Bby.ink} />}
          note={
            viewDay < program.day_count
              ? t('v2mindset.parcours.nextDayTomorrow', { n: viewDay + 1 })
              : t('v2mindset.parcours.lastDayNote')
          }
        />
      ) : (
        <Text style={s.note}>
          {state.lockedToday && viewDay === state.day && viewDay < program.day_count
            ? `${t('v2mindset.parcours.dayDone')} ${t('v2mindset.parcours.nextDayTomorrow', { n: viewDay + 1 })}`
            : t('v2mindset.parcours.dayDone')}
        </Text>
      )}
    </MScreen>
  );
}

const s = StyleSheet.create({
  question: { color: Bby.text, marginTop: 10, fontSize: 21, lineHeight: 28 },
  gesture: { fontFamily: BFont.display, fontSize: 19, lineHeight: 23, color: Bby.ink, letterSpacing: -0.3, marginTop: 8 },
  takeAway: { alignItems: 'center', gap: 12, paddingVertical: 20, paddingHorizontal: 8 },
  takeAwayText: { fontFamily: BFont.serif, fontSize: 24, lineHeight: 31, color: Bby.text, textAlign: 'center' },
  note: { textAlign: 'center', fontFamily: BFont.sans, fontSize: 14, color: Bby.muted, marginTop: 4 },
});
