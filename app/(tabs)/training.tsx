import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { Segmented } from '@/components/ui/segmented';
import { TabHeader } from '@/components/ui/tab-header';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCompletedSessions, usePrograms, useSessions } from '@/lib/use-content';

type View2 = 'program' | 'all';

// Training (maquette Ember v2) : le programme en cours et sa prochaine séance,
// rien d'autre ; le catalogue complet est sur le second onglet. Ni niveau affiché,
// ni récompense.
export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { programs, refresh: refreshPrograms } = usePrograms();
  const { sessions, refresh: refreshSessions } = useSessions();
  const { completed, refresh: refreshCompleted } = useCompletedSessions();
  const [view, setView] = useState<View2>('program');

  useFocusEffect(
    useCallback(() => {
      refreshPrograms();
      refreshSessions();
      refreshCompleted();
    }, [refreshPrograms, refreshSessions, refreshCompleted]),
  );

  // Programme en cours = le premier qui a encore une séance à faire, sinon le premier.
  const byProgram = (id: string) =>
    sessions.filter((s) => s.program_id === id).sort((a, b) => a.order_index - b.order_index);
  const current =
    programs.find((p) => byProgram(p.id).some((s) => !completed.has(s.id))) ?? programs[0] ?? null;
  const currentSessions = current ? byProgram(current.id) : [];
  const doneCount = currentSessions.filter((s) => completed.has(s.id)).length;
  const next = currentSessions.find((s) => !completed.has(s.id)) ?? null;
  const progress = currentSessions.length > 0 ? doneCount / currentSessions.length : 0;
  const others = programs.filter((p) => p.id !== current?.id);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <TabHeader title={t('training.title')} subtitle={current?.title ?? undefined} />

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.lg }}>
          <Segmented
            value={view}
            options={[
              { value: 'program', label: t('training.myProgram') },
              { value: 'all', label: t('training.allSessions') },
            ]}
            onChange={setView}
          />
        </View>

        {view === 'program' ? (
          <>
            {current ? (
              <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Pressable onPress={() => router.push(`/program/${current.id}` as any)}>
                  <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.display }]}>
                    {current.title}
                  </Text>
                  {currentSessions.length > 0 ? (
                    <Text style={[styles.cardSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {t('training.sessionOf', {
                        current: Math.min(doneCount + 1, currentSessions.length),
                        total: currentSessions.length,
                      })}
                    </Text>
                  ) : null}
                </Pressable>
                <View style={[styles.track, { backgroundColor: palette.surfaceAlt }]}>
                  <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]}>
                    <AccentFill />
                  </View>
                </View>
                {next ? (
                  <Pressable
                    onPress={() => router.push(`/session/${next.id}` as any)}
                    style={({ pressed }) => [
                      styles.resume,
                      { borderColor: palette.accent, backgroundColor: palette.accentSoft, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text numberOfLines={1} style={{ color: palette.text, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>
                      {doneCount === 0
                        ? t('training.startSession')
                        : t('training.resumeSession', { n: doneCount + 1 })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('training.askCoach')}
              </Text>
            )}

            {currentSessions.length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
                  {t('training.programSessions').toUpperCase()}
                </Text>
                <View style={styles.list}>
                  {currentSessions.map((s) => {
                    const isDone = completed.has(s.id);
                    const isNext = next?.id === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => router.push(`/session/${s.id}` as any)}
                        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={22} color={palette.done} strokeWidth={1.8} />
                        ) : (
                          <Circle size={22} color={isNext ? palette.accent : palette.textSecondary} strokeWidth={isNext ? 2.4 : 1.8} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                            {s.title}
                          </Text>
                          {s.duration_min ? (
                            <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                              {s.duration_min} min
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {others.length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansBold }]}>
                  {t('training.myPrograms').toUpperCase()}
                </Text>
                <View style={styles.list}>
                  {others.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/program/${p.id}` as any)}
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={[styles.thumb, { backgroundColor: palette.surfaceAlt }]}>
                        {p.cover_url ? (
                          <Image source={{ uri: p.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                        ) : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                          {p.title}
                        </Text>
                        {p.duration_weeks ? (
                          <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                            {t('training.weeks', { count: p.duration_weeks })}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <View style={[styles.list, { marginTop: Spacing.lg }]}>
            {sessions.length === 0 ? (
              <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sans, fontSize: 14 }}>
                {t('training.askCoach')}
              </Text>
            ) : (
              sessions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/session/${s.id}` as any)}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  {completed.has(s.id) ? (
                    <CheckCircle2 size={22} color={palette.done} strokeWidth={1.8} />
                  ) : (
                    <Circle size={22} color={palette.textSecondary} strokeWidth={1.8} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                      {s.title}
                    </Text>
                    {s.duration_min ? (
                      <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                        {s.duration_min} min
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  cardTitle: { fontSize: 20, letterSpacing: -0.4 },
  cardSub: { fontSize: 13, marginTop: 4 },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radius.pill, overflow: 'hidden' },
  resume: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: Spacing.lg,
  },
  empty: { fontSize: 14, lineHeight: 20, marginHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4, marginHorizontal: Spacing.xl, marginTop: Spacing.xl },
  list: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md, gap: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden' },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
});
