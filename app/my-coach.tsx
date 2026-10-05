import { useRouter } from 'expo-router';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Dumbbell,
  Leaf,
  MessageCircle,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMyCoaching } from '@/lib/use-coaching';
import type { CoachingAssignment, CoachingAssignmentType } from '@/lib/types';

const TYPE_ICON: Record<CoachingAssignmentType, typeof Dumbbell> = {
  session: Dumbbell,
  recipe: UtensilsCrossed,
  mindset: Leaf,
  custom: Sparkles,
};

export default function MyCoachScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { isClient, assignments, toggleDone } = useMyCoaching();

  function openItem(a: CoachingAssignment) {
    if (!a.ref_id) return;
    if (a.item_type === 'session') router.push(`/session/${a.ref_id}` as any);
    else if (a.item_type === 'recipe') router.push(`/recipe/${a.ref_id}` as any);
    else if (a.item_type === 'mindset') router.push(`/mindset/${a.ref_id}` as any);
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
        <Pressable
          onPress={() => router.push('/coach-chat' as any)}
          hitSlop={12}
          style={[styles.msgBtn, { backgroundColor: palette.surface }]}
        >
          <MessageCircle size={18} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {t('coaching.eyebrow').toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('coaching.myCoachTitle')}
        </Text>

        <Pressable
          onPress={() => router.push('/coach-chat' as any)}
          style={[styles.messageCta, { backgroundColor: palette.surface }]}
        >
          <View style={[styles.messageIcon, { backgroundColor: palette.background }]}>
            <MessageCircle size={20} color={palette.text} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.messageTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('coaching.messageCoach')}
            </Text>
            <Text style={[styles.messageSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('coaching.messageSub')}
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('coaching.myPlan')}
        </Text>

        {!isClient ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('coaching.notActive')}
          </Text>
        ) : assignments.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('coaching.planEmpty')}
          </Text>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            {assignments.map((a) => {
              const Icon = TYPE_ICON[a.item_type];
              return (
                <View key={a.id} style={[styles.card, { backgroundColor: palette.surface }]}>
                  <View style={styles.cardRow}>
                    <Pressable hitSlop={6} onPress={() => toggleDone(a.id, a.done)}>
                      {a.done ? (
                        <CheckCircle2 size={24} color={palette.done} strokeWidth={1.8} />
                      ) : (
                        <Circle size={24} color={palette.textSecondary} strokeWidth={1.8} />
                      )}
                    </Pressable>
                    <Pressable style={{ flex: 1 }} onPress={() => openItem(a)}>
                      <View style={styles.titleRow}>
                        <Icon size={15} color={palette.textSecondary} strokeWidth={1.8} />
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color: a.done ? palette.textSecondary : palette.text,
                              fontFamily: Fonts.sansSemibold,
                              textDecorationLine: a.done ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {a.title || t(`coaching.type_${a.item_type}`)}
                        </Text>
                      </View>
                      {a.description ? (
                        <Text style={[styles.cardDesc, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                          {a.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  </View>
                  {a.coach_note ? (
                    <View style={[styles.note, { backgroundColor: palette.background }]}>
                      <Text style={[styles.noteText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                        “{a.coach_note}”
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  msgBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.lg },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.xs },
  messageCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.lg,
  },
  messageIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  messageTitle: { fontSize: 16 },
  messageSub: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 22, letterSpacing: -0.4, marginTop: Spacing.xxl },
  empty: { fontSize: 14, marginTop: Spacing.lg, lineHeight: 20 },
  card: { borderRadius: Radius.md, padding: Spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: 15, flex: 1 },
  cardDesc: { fontSize: 13.5, marginTop: 4, lineHeight: 19 },
  note: { borderRadius: Radius.sm, padding: Spacing.md, marginTop: Spacing.md },
  noteText: { fontSize: 13.5, lineHeight: 19, fontStyle: 'italic' },
});
