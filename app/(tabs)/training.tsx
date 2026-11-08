// Training — habillé dans le style de la refonte (pas de maquette dédiée de Shaï) :
// le programme en cours sur la carte jaune inclinée, puis les séances en cartes
// séparées. Ni niveau, ni récompense, ni barre de progression.
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Dumbbell, Play } from 'lucide-react-native';
import { ArrowRight } from '@/lib/rtl-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import {
  BbyScreen,
  BFont,
  Bby,
  BigTitle,
  Card,
  PillButton,
  PillTabs,
  RoundButton,
  RowCard,
  SectionHeader,
  TiltCard,
  TopBar,
} from '@/components/bby/kit';
import { useAuth } from '@/lib/auth-provider';
import type { Session } from '@/lib/types';
import { useCompletedSessions, usePrograms, useSessions } from '@/lib/use-content';
import { useProfile } from '@/lib/use-profile';

type Tab = 'program' | 'all';

function Thumb({ uri, done }: { uri?: string | null; done?: boolean }) {
  return (
    <View style={styles.thumb}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Dumbbell size={24} color={Bby.muted} />}
      {done ? (
        <View style={styles.thumbDone}>
          <Check size={16} color={Bby.ink} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

export default function TrainingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { programs, refresh: refreshPrograms } = usePrograms();
  const { sessions, refresh: refreshSessions } = useSessions();
  const { completed, refresh: refreshCompleted } = useCompletedSessions();
  const [tab, setTab] = useState<Tab>('program');

  useFocusEffect(
    useCallback(() => {
      refreshPrograms();
      refreshSessions();
      refreshCompleted();
    }, [refreshPrograms, refreshSessions, refreshCompleted]),
  );

  const firstName = profile ? (profile.display_name || user?.email?.split('@')[0] || '').split(' ')[0] : '';
  const name = firstName ? firstName[0].toUpperCase() + firstName.slice(1) : '';

  // Programme en cours = le premier qui a encore une séance à faire, sinon le premier.
  const byProgram = (id: string) => sessions.filter((s) => s.program_id === id).sort((a, b) => a.order_index - b.order_index);
  const current = programs.find((p) => byProgram(p.id).some((s) => !completed.has(s.id))) ?? programs[0] ?? null;
  const currentSessions = current ? byProgram(current.id) : [];
  const doneCount = currentSessions.filter((s) => completed.has(s.id)).length;
  const next = currentSessions.find((s) => !completed.has(s.id)) ?? null;
  const shown: Session[] = tab === 'program' ? currentSessions : sessions;

  const open = (s: Session) => router.push(`/session/${s.id}` as any);

  return (
    <BbyScreen>
      <TopBar name={name} onSettings={() => router.push('/account' as any)} />
      <BigTitle>{t('training.title')}</BigTitle>
      <PillTabs
        items={[
          { key: 'program', label: t('training.myProgram') },
          { key: 'all', label: t('training.allSessions') },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'program' ? (
        current ? (
          <TiltCard>
            {currentSessions.length > 0 ? (
              <View style={styles.tiltChip}>
                <Text style={styles.tiltChipText}>
                  {t('training.sessionOf', { current: Math.min(doneCount + 1, currentSessions.length), total: currentSessions.length })}
                </Text>
              </View>
            ) : null}
            <Text style={styles.tiltTitle} numberOfLines={3}>
              {current.title}
            </Text>
            {next ? <Text style={styles.tiltBody}>{next.title}</Text> : null}
            <View style={styles.tiltFoot}>
              <Text style={styles.tiltSmall}>
                {current.duration_weeks ? t('training.weeks', { count: current.duration_weeks }) : ' '}
              </Text>
              <PillButton
                label={next ? (doneCount > 0 ? t('training.resume') : t('v2today.training.start')) : t('v2today.training.see')}
                icon={next ? Play : ArrowRight}
                onPress={() => router.push((next ? `/session/${next.id}` : `/program/${current.id}`) as any)}
              />
            </View>
          </TiltCard>
        ) : (
          <Card tone="alt">
            <Text style={styles.empty}>{t('training.askCoach')}</Text>
          </Card>
        )
      ) : null}

      {shown.length > 0 ? (
        <>
          <SectionHeader title={tab === 'program' ? t('training.programSessions') : t('training.allSessions')} />
          {shown.map((s) => {
            const isNext = tab === 'program' && next?.id === s.id;
            const done = completed.has(s.id);
            return (
              <RowCard
                key={s.id}
                tone={isNext ? 'light' : 'dark'}
                left={<Thumb done={done} />}
                label={isNext ? t('v2today.training.next') : done ? t('v2today.done') : undefined}
                title={s.title}
                sub={s.duration_min ? t('v2today.minutes', { count: s.duration_min }) : undefined}
                right={<RoundButton icon={Play} filled={isNext} variant={isNext ? 'black' : 'outline'} size={48} onPress={() => open(s)} />}
                onPress={() => open(s)}
              />
            );
          })}
        </>
      ) : tab === 'all' ? (
        <Card tone="alt">
          <Text style={styles.empty}>{t('training.askCoach')}</Text>
        </Card>
      ) : null}

      {tab === 'program' && programs.length > 0 ? (
        <>
          <SectionHeader title={t('training.myPrograms')} />
          {programs.map((p) => (
            <RowCard
              key={p.id}
              tone={current?.id === p.id ? 'alt' : 'dark'}
              left={<Thumb uri={p.cover_url} />}
              title={p.title}
              sub={p.duration_weeks ? t('training.weeks', { count: p.duration_weeks }) : undefined}
              right={<RoundButton icon={ArrowRight} variant="outline" size={48} onPress={() => router.push(`/program/${p.id}` as any)} />}
              onPress={() => router.push(`/program/${p.id}` as any)}
            />
          ))}
        </>
      ) : null}
    </BbyScreen>
  );
}

const styles = StyleSheet.create({
  tiltChip: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: Bby.ink, borderRadius: 999, paddingHorizontal: 14, height: 34, justifyContent: 'center' },
  tiltChipText: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.ink },
  tiltTitle: { fontFamily: BFont.display, fontSize: 26, lineHeight: 30, color: Bby.ink, letterSpacing: -0.4, marginTop: 12 },
  tiltBody: { fontFamily: BFont.sans, fontSize: 18, lineHeight: 24, color: Bby.ink, marginTop: 8 },
  tiltFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 },
  tiltSmall: { fontFamily: BFont.sans, fontSize: 14, color: Bby.ink, flexShrink: 1 },
  empty: { fontFamily: BFont.sans, fontSize: 16, lineHeight: 22, color: Bby.text },
  thumb: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#151514', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbDone: { position: 'absolute', right: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
});
