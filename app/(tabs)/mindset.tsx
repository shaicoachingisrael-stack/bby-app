import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Activity, Bell, Bookmark, BookOpen, CheckCircle2, Circle, GitBranch, Heart, Moon, Plus, Sparkles, Wind } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { AdminButton } from '@/components/ui/admin-button';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useMindsetContent } from '@/lib/use-content';
import { useMindsetPrograms } from '@/lib/use-mindset-programs';
import { useDailyAffirmation } from '@/lib/use-daily-affirmation';
import { useDayData } from '@/lib/use-day-data';
import { useProfile } from '@/lib/use-profile';
import { ritualIcon } from '@/lib/ritual-icons';
import { useRituals } from '@/lib/use-rituals';

const INTRO_VIDEO = require('@/assets/videos/intro.mp4');
const NUTRITION_VIDEO = require('@/assets/videos/nutrition.mp4');

export default function MindsetScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, refresh } = useDayData();
  const { items: mindsetItems, refresh: refreshMindset } = useMindsetContent();
  const { rituals, checkedToday, toggleCheck, refresh: refreshRituals } = useRituals();
  const { affirmation: affirmationText, loading: affirmationLoading, refresh: refreshAffirmation } = useDailyAffirmation();
  const { programs, progress, refresh: refreshPrograms } = useMindsetPrograms();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshMindset();
      refreshRituals();
      refreshAffirmation();
      refreshPrograms();
    }, [refresh, refreshMindset, refreshRituals, refreshAffirmation, refreshPrograms]),
  );

  const activeProgram = programs.find((p) => progress[p.id] && !progress[p.id].completed_at);

  // Tant que la phrase du jour charge (ou existe), elle tient le haut de l'écran ;
  // sans elle (hors ligne, table vide), le contenu mis en avant reprend la place.
  const showAffirmation = affirmationLoading || !!affirmationText;
  const featured = mindsetItems[0];
  // Le hero est désormais l'affirmation du jour ; le contenu featured rejoint « Explorer ».
  const others = showAffirmation ? mindsetItems.slice(0, 6) : mindsetItems.slice(1, 5);

  const initial = (profile?.display_name || user?.email || '?')[0].toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: Spacing.xl }]}>
          <Pressable
            onPress={() => router.push('/account' as any)}
            hitSlop={8}
            style={styles.headerLeft}
          >
            <View style={[styles.avatar, { backgroundColor: palette.text }]}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <Text style={[styles.avatarInitial, { color: palette.background, fontFamily: Fonts.sansBold }]}>
                  {initial}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('mindset.subtitle')}
              </Text>
              <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t('mindset.title')}
              </Text>
            </View>
          </Pressable>
          <AdminButton />
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            hitSlop={8}
            style={[styles.bell, { backgroundColor: palette.surface }]}
          >
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        {showAffirmation ? (
          /* HERO — affirmation du jour : la même pour toutes, selon la date locale */
          <View style={styles.hero}>
            <Text style={[styles.heroEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              {t('affirmation.eyebrow').toUpperCase()}
            </Text>
            {affirmationText ? (
              <Text style={[styles.heroText, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {affirmationText}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
            <SessionCard
              eyebrow={
                featured
                  ? featured.kind === 'meditation'
                    ? t('mindset.kind.meditation').toUpperCase()
                    : featured.kind === 'article'
                      ? t('mindset.kind.article').toUpperCase()
                      : t('mindset.kind.affirmation').toUpperCase()
                  : t('mindset.title').toUpperCase()
              }
              title={featured?.title ?? t('common.comingSoon')}
              subtitle={featured?.body?.split('\n')[0] ?? t('training.askCoach')}
              duration={featured?.duration_min ? `${featured.duration_min} min` : undefined}
              videoSource={featured ? null : INTRO_VIDEO}
              imageSource={featured?.cover_url ?? null}
              onPress={() =>
                featured
                  ? router.push(`/mindset/${featured.id}` as any)
                  : router.push('/mindset-log' as any)
              }
            />
          </View>
        )}

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {t('mindset.today')}
          </Text>
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            <ActivityCard
              icon={Sparkles}
              title={t('mindset.intentionTitle')}
              subtitle={data.mindset_intention ?? t('mindset.intentionEmpty')}
              status={data.mindset_intention ? 'done' : 'pending'}
              onPress={() => router.push('/mindset-log?kind=intention' as any)}
            />
            <ActivityCard
              icon={Wind}
              title={t('breathing.cardTitle')}
              subtitle={t('breathing.cardSubtitle')}
              onPress={() => router.push('/mindset/breathing' as any)}
            />
            <ActivityCard
              icon={Heart}
              title={t('mindset.meditationTitle')}
              subtitle={t('mindset.meditationSubtitle')}
              onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
            />
            <ActivityCard
              icon={BookOpen}
              title={t('mindset.journalTitle')}
              subtitle={t('mindset.journalSubtitle')}
              onPress={() => router.push('/mindset/entries?kind=journal' as any)}
            />
          </View>
        </View>

        {/* Mes rituels */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              {t('rituals.title')}
            </Text>
            {rituals.length > 0 && (
              <Text style={[styles.counter, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('rituals.counter', { done: checkedToday.size, total: rituals.length })}
              </Text>
            )}
          </View>

          {rituals.length === 0 ? (
            <Pressable
              onPress={() => router.push('/mindset/rituals' as any)}
              style={[styles.ritualEmpty, { backgroundColor: palette.surface }]}
            >
              <Plus size={18} color={palette.textSecondary} />
              <Text style={[styles.ritualEmptyText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('rituals.empty')}
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.ritualCard, { backgroundColor: palette.surface }]}>
              {rituals.map((r) => {
                const Icon = ritualIcon(r.icon);
                const checked = checkedToday.has(r.id);
                return (
                  <Pressable key={r.id} style={styles.ritualRow} onPress={() => toggleCheck(r.id)}>
                    {checked ? (
                      <CheckCircle2 size={22} color={palette.text} strokeWidth={1.8} />
                    ) : (
                      <Circle size={22} color={palette.textSecondary} strokeWidth={1.8} />
                    )}
                    <Icon size={16} color={palette.textSecondary} strokeWidth={1.8} />
                    <Text
                      style={[
                        styles.ritualLabel,
                        {
                          fontFamily: Fonts.sans,
                          color: checked ? palette.textSecondary : palette.text,
                          textDecorationLine: checked ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => router.push('/mindset/rituals' as any)}
                style={[styles.ritualManage, { borderTopColor: palette.border }]}
              >
                <Plus size={16} color={palette.textSecondary} />
                <Text style={[styles.ritualManageText, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {t('rituals.manage')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Continuer (parcours en cours) */}
        {activeProgram && (
          <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              {t('programs.continueTitle')}
            </Text>
            <Pressable
              onPress={() => router.push(`/mindset/program/${activeProgram.id}` as any)}
              style={[styles.continueCard, { backgroundColor: palette.surface }]}
            >
              <View style={[styles.continueIcon, { backgroundColor: palette.background }]}>
                <Moon size={20} color={palette.text} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.continueEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {t('programs.dayProgress', {
                    current: progress[activeProgram.id].current_day,
                    total: activeProgram.day_count,
                  }).toUpperCase()}
                </Text>
                <Text style={[styles.continueTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {activeProgram.title}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Programmes (accès) */}
        {programs.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
            <Pressable
              onPress={() => router.push('/mindset/programs' as any)}
              style={[styles.programsAccess, { backgroundColor: palette.surface }]}
            >
              <View style={[styles.continueIcon, { backgroundColor: palette.background }]}>
                <GitBranch size={20} color={palette.text} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.continueTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {t('programs.title')}
                </Text>
                <Text style={[styles.continueEyebrow, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {t('programs.access')}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Favoris + Cette semaine */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, flexDirection: 'row', gap: Spacing.md }}>
          <Pressable
            onPress={() => router.push('/mindset/favorites' as any)}
            style={[styles.miniTile, { backgroundColor: palette.surface }]}
          >
            <Bookmark size={20} color={palette.text} strokeWidth={1.8} />
            <Text style={[styles.miniTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('favorites.title')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/mindset/history' as any)}
            style={[styles.miniTile, { backgroundColor: palette.surface }]}
          >
            <Activity size={20} color={palette.text} strokeWidth={1.8} />
            <Text style={[styles.miniTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('history.title')}
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {t('mindset.explore')}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
        >
          {others.length === 0 ? (
            <RecommendationCard
              videoSource={INTRO_VIDEO}
              duration="—"
              title={t('common.comingSoon')}
              subtitle={t('today.placeholderTitle')}
            />
          ) : (
            others.map((m) => (
              <RecommendationCard
                key={m.id}
                videoSource={null}
                imageSource={m.cover_url ?? null}
                duration={m.duration_min ? `${m.duration_min} min` : '—'}
                title={m.title}
                subtitle={
                  m.kind === 'meditation'
                    ? t('mindset.kind.meditation')
                    : m.kind === 'article'
                      ? t('mindset.kind.article')
                      : t('mindset.kind.affirmation')
                }
                onPress={() => router.push(`/mindset/${m.id}` as any)}
              />
            ))
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 18 },
  eyebrow: { fontSize: 13 },
  title: { fontSize: 22, letterSpacing: -0.4, marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { fontSize: 18, letterSpacing: -0.3 },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  heroEyebrow: { fontSize: 11, letterSpacing: 2 },
  heroText: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  counter: { fontSize: 12 },
  ritualEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  ritualEmptyText: { fontSize: 14, flex: 1 },
  ritualCard: {
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  ritualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  ritualLabel: { flex: 1, fontSize: 15 },
  ritualManage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  ritualManageText: { fontSize: 13 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  programsAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  continueIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueEyebrow: { fontSize: 11, letterSpacing: 0.5, marginTop: 2 },
  continueTitle: { fontSize: 16 },
  miniTile: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  miniTitle: { fontSize: 15 },
});
