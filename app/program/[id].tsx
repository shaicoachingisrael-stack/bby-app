import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useCompletedSessions,
  useProgram,
  useSessions,
} from '@/lib/use-content';

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutante',
  intermediaire: 'Intermédiaire',
  avance: 'Avancée',
};

export default function ProgramDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { program, loading: programLoading } = useProgram(id);
  const { sessions, refresh: refreshSessions } = useSessions(id);
  const { completed, refresh: refreshCompletions } = useCompletedSessions();

  useFocusEffect(
    useCallback(() => {
      refreshSessions();
      refreshCompletions();
    }, [refreshSessions, refreshCompletions]),
  );

  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [sessions],
  );

  const doneCount = useMemo(
    () => orderedSessions.filter((s) => completed.has(s.id)).length,
    [orderedSessions, completed],
  );

  const nextSession = useMemo(
    () => orderedSessions.find((s) => !completed.has(s.id)) ?? orderedSessions[0],
    [orderedSessions, completed],
  );

  const progress = orderedSessions.length
    ? Math.round((doneCount / orderedSessions.length) * 100)
    : 0;

  if (programLoading && !program) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={styles.hero}>
        {program?.cover_url ? (
          <Image
            source={{ uri: program.cover_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.gray[300] }]} />
        )}
        <View style={styles.heroOverlay} />
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Palette.albatre, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ChevronLeft size={20} color={Palette.encre} />
          </Pressable>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>PROGRAMME</Text>
          <Text style={styles.heroTitle}>{program?.title ?? '...'}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.background }]}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.lg,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
              <BarChart3 size={18} color={palette.text} />
              <View>
                <Text style={[styles.metaLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  Niveau
                </Text>
                <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {program?.level ? LEVEL_LABELS[program.level] ?? program.level : '—'}
                </Text>
              </View>
            </View>
            <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
              <Calendar size={18} color={palette.text} />
              <View>
                <Text style={[styles.metaLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  Durée
                </Text>
                <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {program?.duration_weeks ? `${program.duration_weeks} sem.` : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress */}
          <View style={[styles.progressBlock, { backgroundColor: palette.surface }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                Ta progression
              </Text>
              <Text style={[styles.progressPct, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {progress} %
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: palette.background }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: palette.text },
                ]}
              />
            </View>
            <Text style={[styles.progressMeta, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {doneCount} séance{doneCount > 1 ? 's' : ''} terminée{doneCount > 1 ? 's' : ''}{' '}
              sur {orderedSessions.length}
            </Text>
          </View>

          {/* Description */}
          {program?.description ? (
            <>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Description
              </Text>
              <Text style={[styles.desc, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {program.description}
              </Text>
            </>
          ) : null}

          {/* Sessions list */}
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            Séances ({orderedSessions.length})
          </Text>

          {orderedSessions.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: palette.surface }]}>
              <Text style={[styles.emptyText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                Pas encore de séances dans ce programme.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {orderedSessions.map((s, i) => {
                const isDone = completed.has(s.id);
                const isCurrent = s.id === nextSession?.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push(`/session/${s.id}` as any)}
                    style={({ pressed }) => [
                      styles.sessionRow,
                      {
                        backgroundColor: palette.surface,
                        borderColor: isCurrent ? palette.text : 'transparent',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.sessionBadge,
                        {
                          backgroundColor: isDone ? palette.text : palette.background,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Check size={16} color={palette.background} strokeWidth={2.6} />
                      ) : (
                        <Text
                          style={[
                            styles.sessionIndex,
                            { color: palette.textSecondary, fontFamily: Fonts.sansSemibold },
                          ]}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.sessionTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}
                        numberOfLines={1}
                      >
                        {s.title}
                      </Text>
                      <Text
                        style={[styles.sessionMeta, { color: palette.textSecondary, fontFamily: Fonts.sans }]}
                      >
                        {[s.duration_min ? `${s.duration_min} min` : null, isDone ? 'Terminée' : null]
                          .filter(Boolean)
                          .join(' · ') || 'Séance'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={palette.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        {nextSession && (
          <View
            style={[
              styles.cta,
              { paddingBottom: insets.bottom + Spacing.md, backgroundColor: palette.background },
            ]}
          >
            <Pressable
              onPress={() => router.push(`/session/${nextSession.id}` as any)}
              style={({ pressed }) => [
                styles.ctaButton,
                {
                  backgroundColor: palette.text,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Play size={18} color={palette.background} fill={palette.background} />
              <Text
                style={[
                  styles.ctaText,
                  { color: palette.background, fontFamily: Fonts.sansSemibold },
                ]}
              >
                {doneCount > 0 ? 'Continuer le programme' : 'Démarrer le programme'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    height: 360,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.32)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xxl,
  },
  heroEyebrow: {
    color: Palette.albatre,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
  },
  heroTitle: {
    color: Palette.albatre,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  sheet: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  metaLabel: { fontSize: 11 },
  metaValue: { fontSize: 14, marginTop: 2 },
  progressBlock: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressTitle: { fontSize: 14 },
  progressPct: { fontSize: 22, letterSpacing: -0.4 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMeta: { fontSize: 12 },
  section: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  desc: { fontSize: 14, lineHeight: 22 },
  empty: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  sessionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIndex: { fontSize: 12 },
  sessionTitle: { fontSize: 15 },
  sessionMeta: { fontSize: 13, marginTop: 2 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 56,
    borderRadius: Radius.lg,
  },
  ctaText: { fontSize: 16 },
});
