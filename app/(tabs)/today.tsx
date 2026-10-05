import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, ChevronRight, Circle, Star } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminButton } from '@/components/ui/admin-button';
import { DateStrip } from '@/components/ui/date-strip';
import { LanguageButton } from '@/components/ui/language-button';
import { HeroSwiper, type HeroItem } from '@/components/ui/hero-swiper';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { ritualIcon } from '@/lib/ritual-icons';
import { useRituals } from '@/lib/use-rituals';
import { useMyCoaching } from '@/lib/use-coaching';
import {
  useMindsetContent,
  useRecipes,
  useSessions,
  useTodaySession,
} from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useProfile } from '@/lib/use-profile';

const TRAINING_VIDEO = require('@/assets/videos/exercise.mp4');
const NUTRITION_VIDEO = require('@/assets/videos/nutrition.mp4');
const INTRO_VIDEO = require('@/assets/videos/intro.mp4');

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { refresh } = useDayData();
  const { session: todaySession, refresh: refreshToday } = useTodaySession();
  const { sessions: catalog, refresh: refreshCatalog } = useSessions();
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const { items: mindsetItems, refresh: refreshMindset } = useMindsetContent();
  const { rituals, checkedToday, toggleCheck, refresh: refreshRituals } = useRituals();
  const { isClient: hasCoach, refresh: refreshCoaching } = useMyCoaching();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshToday();
      refreshCatalog();
      refreshRecipes();
      refreshMindset();
      refreshRituals();
      refreshCoaching();
    }, [refresh, refreshToday, refreshCatalog, refreshRecipes, refreshMindset, refreshRituals, refreshCoaching]),
  );

  const firstName = (profile?.display_name || user?.email?.split('@')[0] || '').split(' ')[0];
  const initial = (firstName || '?')[0].toUpperCase();
  const monthLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  // Build hero swiper from real content
  const heroItems = useMemo<HeroItem[]>(() => {
    const items: HeroItem[] = [];

    if (todaySession) {
      items.push({
        id: `s-${todaySession.id}`,
        eyebrow: t('today.sessionOfDay'),
        title: todaySession.title,
        subtitle: todaySession.description ?? undefined,
        meta: todaySession.duration_min ? `${todaySession.duration_min} min` : undefined,
        videoSource: todaySession.video_url ?? TRAINING_VIDEO,
        cta: t('today.ctaStart'),
        onPress: () => router.push(`/session/${todaySession.id}` as any),
      });
    }

    const featuredMindset = mindsetItems[0];
    if (featuredMindset) {
      items.push({
        id: `m-${featuredMindset.id}`,
        eyebrow: t('today.mindsetOfDay'),
        title: featuredMindset.title,
        subtitle: featuredMindset.body?.split('\n')[0] ?? undefined,
        meta: featuredMindset.duration_min ? `${featuredMindset.duration_min} min` : undefined,
        imageSource: featuredMindset.cover_url ?? null,
        videoSource: featuredMindset.cover_url ? null : INTRO_VIDEO,
        cta: t('today.ctaRead'),
        onPress: () => router.push(`/mindset/${featuredMindset.id}` as any),
      });
    }

    const featuredRecipe = recipes[0];
    if (featuredRecipe) {
      items.push({
        id: `r-${featuredRecipe.id}`,
        eyebrow: t('today.recipeOfDay'),
        title: featuredRecipe.title,
        subtitle: featuredRecipe.description ?? undefined,
        meta: featuredRecipe.kcal ? `${featuredRecipe.kcal} kcal` : undefined,
        imageSource: featuredRecipe.cover_url ?? null,
        videoSource: featuredRecipe.video_url ?? (featuredRecipe.cover_url ? null : NUTRITION_VIDEO),
        cta: t('today.ctaViewRecipe'),
        onPress: () => router.push(`/recipe/${featuredRecipe.id}` as any),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'placeholder',
        eyebrow: t('common.comingSoon'),
        title: t('today.placeholderTitle'),
        subtitle: t('today.placeholderSubtitle'),
        videoSource: TRAINING_VIDEO,
      });
    }

    return items;
  }, [todaySession, mindsetItems, recipes, router, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xxl,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
              <Text style={[styles.hello, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('today.hello', { name: firstName ? capitalize(firstName) : '👋' })}
              </Text>
              <Text
                style={[styles.helloTitle, { color: palette.text, fontFamily: Fonts.displayBold }]}
                numberOfLines={1}
              >
                {t('today.greeting')}
              </Text>
            </View>
          </Pressable>
          <AdminButton />
          <LanguageButton />
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            hitSlop={8}
            style={[styles.bell, { backgroundColor: palette.surface }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        {/* Date strip */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <Text style={[styles.month, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {monthLabel}
          </Text>
        </View>
        <View style={{ marginTop: Spacing.sm }}>
          <DateStrip value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* Mon coach perso (grande bannière, clientes premium) — au-dessus du carrousel */}
        {hasCoach && (
          <Pressable
            onPress={() => router.push('/my-coach' as any)}
            style={({ pressed }) => [styles.coachBanner, { backgroundColor: palette.text, opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={styles.coachIcon}>
              <Star size={22} color={palette.text} fill={palette.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.coachEyebrow, { color: palette.background, fontFamily: Fonts.sansMedium }]}>
                {t('coaching.eyebrow').toUpperCase()}
              </Text>
              <Text style={[styles.coachBannerTitle, { color: palette.background, fontFamily: Fonts.displayBold }]}>
                {t('coaching.myCoachTitle')}
              </Text>
              <Text style={[styles.coachSub, { color: palette.background, fontFamily: Fonts.sans }]}>
                {t('coaching.todayCardSub')}
              </Text>
            </View>
            <ChevronRight size={22} color={palette.background} />
          </Pressable>
        )}

        {/* Découverte coaching perso (non-premium) */}
        {!hasCoach && (
          <Pressable
            onPress={() => router.push('/coaching-offer' as any)}
            style={({ pressed }) => [styles.discoverCard, { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={[styles.coachIcon, { backgroundColor: palette.text }]}>
              <Star size={18} color={palette.background} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.discoverTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                {t('coachingOffer.discoverTitle')}
              </Text>
              <Text style={[styles.discoverSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('coachingOffer.discoverSub')}
              </Text>
            </View>
            <ChevronRight size={20} color={palette.textSecondary} />
          </Pressable>
        )}

        {/* Big hero swiper */}
        <View style={{ marginTop: Spacing.xl }}>
          <HeroSwiper items={heroItems} />
        </View>

        {/* Mes rituels du jour */}
        {rituals.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t('rituals.todayTitle')}
              </Text>
              <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('rituals.counter', { done: checkedToday.size, total: rituals.length })}
              </Text>
            </View>
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
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontFamily: Fonts.sans,
                        color: checked ? palette.textSecondary : palette.text,
                        textDecorationLine: checked ? 'line-through' : 'none',
                      }}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Mindset du jour */}
        {mindsetItems.length > 0 && (
          <>
            <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t('today.sectionMindset')}
              </Text>
              <Pressable onPress={() => router.push('/mindset' as any)} hitSlop={8}>
                <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {t('common.viewAll')}
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
            >
              {mindsetItems.slice(0, 6).map((m) => (
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
              ))}
            </ScrollView>
          </>
        )}

        {/* Recettes */}
        {recipes.length > 0 && (
          <>
            <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t('today.sectionRecipes')}
              </Text>
              <Pressable onPress={() => router.push('/nutrition' as any)} hitSlop={8}>
                <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {t('common.viewAll')}
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
            >
              {recipes.slice(0, 6).map((r) => (
                <RecommendationCard
                  key={r.id}
                  videoSource={r.video_url ?? null}
                  imageSource={r.cover_url ?? null}
                  duration={r.prep_min ? `${r.prep_min} min` : '—'}
                  title={r.title}
                  subtitle={r.kcal ? `${r.kcal} kcal` : t('today.sectionRecipes')}
                  onPress={() => router.push(`/recipe/${r.id}` as any)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Séances */}
        {catalog.length > 0 && (
          <>
            <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t('today.sectionSessions')}
              </Text>
              <Pressable onPress={() => router.push('/training' as any)} hitSlop={8}>
                <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {t('common.viewAll')}
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
            >
              {catalog.slice(0, 6).map((s) => (
                <RecommendationCard
                  key={s.id}
                  videoSource={s.video_url ?? INTRO_VIDEO}
                  duration={s.duration_min ? `${s.duration_min} min` : '—'}
                  title={s.title}
                  subtitle={s.description ?? t('program.session')}
                  onPress={() => router.push(`/session/${s.id}` as any)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  hello: { fontSize: 13 },
  helloTitle: { fontSize: 18, letterSpacing: -0.3, marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { fontSize: 18, letterSpacing: -0.3 },
  section: { fontSize: 22, letterSpacing: -0.4 },
  seeAll: { fontSize: 13 },
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
  coachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  coachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachEyebrow: { fontSize: 10, letterSpacing: 1.6, opacity: 0.7 },
  coachBannerTitle: { fontSize: 22, letterSpacing: -0.4, marginTop: 2 },
  coachSub: { fontSize: 13, marginTop: 2, opacity: 0.8 },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  discoverTitle: { fontSize: 15 },
  discoverSub: { fontSize: 13, marginTop: 2 },
});
