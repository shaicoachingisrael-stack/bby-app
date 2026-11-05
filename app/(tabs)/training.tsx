import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarDays, Check, Clock, Dumbbell, Play } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { IconBadge, SectionLabel, TileCard, TileText, type TileColor } from '@/components/ui/tiles';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCompletedSessions, usePrograms, useSessions } from '@/lib/use-content';
import type { Session } from '@/lib/types';

type View2 = 'program' | 'all';

const SESSION_COLORS: TileColor[] = ['rose', 'orange', 'blue', 'mint', 'violet'];

// Training (maquette « en tuiles ») : le programme en cours en grand, puis ses
// séances en carrés. Ni niveau affiché, ni récompense.
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
  const shown = view === 'program' ? currentSessions : sessions;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{t('training.myProgram').toUpperCase()}</Text>
        <Text style={[styles.title, { fontFamily: Fonts.displayBold }]}>{t('training.title')}</Text>

        {current ? (
          <Pressable
            onPress={() => router.push((next ? `/session/${next.id}` : `/program/${current.id}`) as any)}
            style={({ pressed }) => [styles.hero, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <AccentFill />
            <View pointerEvents="none" style={styles.heroDisc} />
            <View pointerEvents="none" style={styles.heroRing} />
            <View style={{ flex: 1 }}>
              <View style={styles.heroTag}>
                <Text style={[styles.heroTagText, { color: palette.onAccent }]}>
                  {currentSessions.length > 0
                    ? t('training.sessionOf', {
                        current: Math.min(doneCount + 1, currentSessions.length),
                        total: currentSessions.length,
                      }).toUpperCase()
                    : t('training.myProgram').toUpperCase()}
                </Text>
              </View>
              <Text numberOfLines={2} style={[styles.heroTitle, { color: palette.onAccent, fontFamily: Fonts.displayBold }]}>
                {current.title}
              </Text>
              {currentSessions.length > 0 ? (
                <View style={styles.segments}>
                  {currentSessions.slice(0, 12).map((s) => (
                    <View
                      key={s.id}
                      style={[
                        styles.segment,
                        { backgroundColor: completed.has(s.id) ? palette.onAccent : 'rgba(26,11,20,0.22)' },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
            <View style={[styles.play, { backgroundColor: palette.onAccent }]}>
              <Play size={24} color={TileText.primary} fill={TileText.primary} style={{ marginLeft: 3 }} />
            </View>
          </Pressable>
        ) : (
          <TileCard radius={24} style={styles.emptyCard}>
            <IconBadge icon={Dumbbell} color="rose" size={44} />
            <Text style={styles.emptyText}>{t('training.askCoach')}</Text>
          </TileCard>
        )}

        {/* Mon programme / Toutes les séances : deux carrés-interrupteurs */}
        <View style={[styles.row2, { marginTop: 16 }]}>
          <Toggle
            active={view === 'program'}
            icon={<CalendarDays size={18} color="#FFB27A" strokeWidth={2} />}
            label={t('training.myProgram')}
            onPress={() => setView('program')}
          />
          <Toggle
            active={view === 'all'}
            icon={<Dumbbell size={18} color="#FF8DB5" strokeWidth={2} />}
            label={t('training.allSessions')}
            onPress={() => setView('all')}
          />
        </View>

        {shown.length > 0 ? (
          <>
            <SectionLabel>{view === 'program' ? t('tiles.iChoose') : t('training.allSessions')}</SectionLabel>
            <View style={styles.grid}>
              {shown.map((s, i) => (
                <SessionTile
                  key={s.id}
                  session={s}
                  color={SESSION_COLORS[i % SESSION_COLORS.length]}
                  done={completed.has(s.id)}
                  isNext={view === 'program' && next?.id === s.id}
                  onPress={() => router.push(`/session/${s.id}` as any)}
                />
              ))}
            </View>
          </>
        ) : view === 'all' ? (
          <Text style={[styles.emptyText, { marginTop: 20 }]}>{t('training.askCoach')}</Text>
        ) : null}

        {view === 'program' && programs.length > 0 ? (
          <>
            <SectionLabel>{t('training.myPrograms')}</SectionLabel>
            <View style={{ gap: 10 }}>
              {programs.map((p) => (
                <TileCard
                  key={p.id}
                  radius={22}
                  style={styles.programRow}
                  onPress={() => router.push(`/program/${p.id}` as any)}
                  accessibilityLabel={p.title}
                >
                  {p.cover_url ? (
                    <Image source={{ uri: p.cover_url }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <IconBadge icon={CalendarDays} color="orange" size={44} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.programTitle}>
                      {p.title}
                    </Text>
                    {p.duration_weeks ? (
                      <Text style={styles.meta}>{t('training.weeks', { count: p.duration_weeks })}</Text>
                    ) : null}
                  </View>
                </TileCard>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Toggle({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TileCard
      radius={18}
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.toggle, active && styles.toggleActive]}
    >
      {icon}
      <Text numberOfLines={1} style={styles.toggleText}>
        {label}
      </Text>
    </TileCard>
  );
}

function SessionTile({
  session,
  color,
  done,
  isNext,
  onPress,
}: {
  session: Session;
  color: TileColor;
  done: boolean;
  isNext: boolean;
  onPress: () => void;
}) {
  return (
    <TileCard
      radius={24}
      onPress={onPress}
      accessibilityLabel={session.title}
      style={[styles.sessionTile, isNext && styles.sessionNext]}
    >
      <IconBadge icon={Dumbbell} color={color} size={44} />
      {done ? (
        <View style={styles.doneBadge}>
          <IconBadge icon={Check} color="mint" size={22} round strokeWidth={3.2} iconSize={12} />
        </View>
      ) : null}
      <View>
        <Text numberOfLines={2} style={styles.sessionTitle}>
          {session.title}
        </Text>
        {session.duration_min ? (
          <View style={styles.metaRow}>
            <Clock size={12} color={TileText.muted} strokeWidth={2} />
            <Text style={styles.meta}>{session.duration_min} min</Text>
          </View>
        ) : null}
      </View>
    </TileCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 140, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  title: { fontSize: 30, letterSpacing: -0.5, color: TileText.primary, marginTop: 4 },
  hero: {
    marginTop: 20,
    minHeight: 150,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  heroDisc: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroRing: {
    position: 'absolute',
    right: 40,
    top: -90,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(26,11,20,0.14)',
  },
  heroTagText: { fontSize: 11, letterSpacing: 1.2, fontFamily: Fonts.sansBold },
  heroTitle: { fontSize: 26, lineHeight: 28, letterSpacing: -0.4, marginTop: 10 },
  segments: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 12 },
  segment: { width: 22, height: 6, borderRadius: 3 },
  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  emptyCard: { marginTop: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  emptyText: { flex: 1, fontSize: 14, lineHeight: 20, color: TileText.secondary, fontFamily: Fonts.sans },
  row2: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  toggleActive: { borderColor: 'rgba(255,255,255,0.35)' },
  toggleText: { fontSize: 13, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sessionTile: {
    width: '48.5%',
    minHeight: 112,
    padding: 14,
    justifyContent: 'space-between',
    gap: 10,
  },
  sessionNext: { borderColor: 'rgba(255,141,181,0.7)', borderWidth: 1.5 },
  doneBadge: { position: 'absolute', top: 10, right: 10 },
  sessionTitle: { fontSize: 14, lineHeight: 18, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12, color: TileText.muted, fontFamily: Fonts.sans },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cover: { width: 44, height: 44, borderRadius: 14 },
  programTitle: { fontSize: 14, color: TileText.primary, fontFamily: Fonts.sansSemibold },
});
