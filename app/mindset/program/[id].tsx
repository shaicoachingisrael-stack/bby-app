import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  PenLine,
  Play,
  Sparkles,
  Wind,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMindsetProgram } from '@/lib/use-mindset-programs';
import type { MindsetProgramStep, MindsetProgramStepKind } from '@/lib/types';

const STEP_ICON: Record<MindsetProgramStepKind, typeof Wind> = {
  breathing: Wind,
  affirmation: Sparkles,
  reading: BookOpen,
  meditation: Heart,
  journal_prompt: PenLine,
};

export default function MindsetProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { program, steps, progress, loading, start, completeDay } = useMindsetProgram(id);

  const byDay = useMemo(() => {
    const map = new Map<number, MindsetProgramStep[]>();
    for (const s of steps) {
      const arr = map.get(s.day_number) ?? [];
      arr.push(s);
      map.set(s.day_number, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [steps]);

  const currentDay = progress?.current_day ?? 1;
  const isDone = !!progress?.completed_at;

  function openStep(s: MindsetProgramStep) {
    if (s.kind === 'breathing' && s.ref_slug) router.push(`/mindset/breathe?slug=${s.ref_slug}&duration=5` as any);
    else if (s.kind === 'journal_prompt') router.push('/mindset-log?kind=journal' as any);
    else if (s.ref_content_id) router.push(`/mindset/${s.ref_content_id}` as any);
  }

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }
  if (!program) {
    return <View style={[styles.flex, { backgroundColor: palette.background }]} />;
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {t('programs.dayCount', { count: program.day_count }).toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>{program.title}</Text>
        {program.description ? (
          <Text style={[styles.desc, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {program.description}
          </Text>
        ) : null}

        {!progress ? (
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 }]}
          >
            <Play size={16} color={palette.background} />
            <Text style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
              {t('programs.start')}
            </Text>
          </Pressable>
        ) : isDone ? (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={18} color={palette.textSecondary} />
            <Text style={[styles.completedText, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              {t('programs.completed')}
            </Text>
          </View>
        ) : (
          <Text style={[styles.progressLine, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            {t('programs.dayProgress', { current: currentDay, total: program.day_count })}
          </Text>
        )}

        <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
          {byDay.map(([day, daySteps]) => {
            const state = day < currentDay || isDone ? 'done' : day === currentDay ? 'current' : 'upcoming';
            return (
              <View
                key={day}
                style={[
                  styles.dayCard,
                  { backgroundColor: palette.surface },
                  state === 'current' && { borderWidth: 1, borderColor: palette.border },
                ]}
              >
                <View style={styles.dayHead}>
                  <View
                    style={[
                      styles.dayBadge,
                      { backgroundColor: state === 'upcoming' ? palette.background : palette.text },
                    ]}
                  >
                    {state === 'done' ? (
                      <Check size={13} color={palette.background} />
                    ) : (
                      <Text
                        style={{
                          color: state === 'current' ? palette.background : palette.textSecondary,
                          fontFamily: Fonts.sansSemibold,
                          fontSize: 12,
                        }}
                      >
                        {day}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.dayTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                    {t('programs.day')} {day}
                  </Text>
                </View>

                <View style={{ marginTop: Spacing.sm }}>
                  {daySteps.map((s) => {
                    const Icon = STEP_ICON[s.kind];
                    const tappable = state === 'current';
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => tappable && openStep(s)}
                        disabled={!tappable}
                        style={styles.step}
                      >
                        <Icon
                          size={16}
                          color={tappable ? palette.textSecondary : palette.textSecondary}
                          strokeWidth={1.8}
                        />
                        <View style={{ flex: 1 }}>
                          {s.title ? (
                            <Text
                              style={{
                                color: tappable ? palette.text : palette.textSecondary,
                                fontFamily: Fonts.sans,
                                fontSize: 14,
                              }}
                            >
                              {s.title}
                            </Text>
                          ) : null}
                          {s.prompt_text ? (
                            <Text style={[styles.stepPrompt, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                              {s.prompt_text}
                            </Text>
                          ) : null}
                        </View>
                        {tappable && s.kind !== 'affirmation' ? (
                          <ChevronRight size={16} color={palette.textSecondary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {state === 'current' && !isDone ? (
                  <Pressable
                    onPress={() => completeDay(day)}
                    style={[styles.doneBtn, { borderColor: palette.border }]}
                  >
                    <Check size={15} color={palette.text} />
                    <Text style={[styles.doneBtnText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
                      {t('programs.markDone')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.lg },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.sm },
  desc: { fontSize: 15, lineHeight: 22, marginTop: Spacing.md },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 50, borderRadius: Radius.pill, marginTop: Spacing.xl,
  },
  ctaText: { fontSize: 15 },
  completedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xl },
  completedText: { fontSize: 14 },
  progressLine: { fontSize: 13, textAlign: 'center', marginTop: Spacing.xl },
  dayCard: { borderRadius: Radius.md, padding: Spacing.lg },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayTitle: { fontSize: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  stepPrompt: { fontSize: 13.5, marginTop: 2, lineHeight: 19, fontStyle: 'italic' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, borderRadius: Radius.pill, borderWidth: 1, marginTop: Spacing.sm,
  },
  doneBtnText: { fontSize: 13 },
});
