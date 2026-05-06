import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminButton } from '@/components/ui/admin-button';
import { DateStrip } from '@/components/ui/date-strip';
import { LanguageButton } from '@/components/ui/language-button';
import { HeroSwiper, type HeroItem } from '@/components/ui/hero-swiper';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
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
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshToday();
      refreshCatalog();
      refreshRecipes();
      refreshMindset();
    }, [refresh, refreshToday, refreshCatalog, refreshRecipes, refreshMindset]),
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
        eyebrow: 'Séance du jour',
        title: todaySession.title,
        subtitle: todaySession.description ?? undefined,
        meta: todaySession.duration_min ? `${todaySession.duration_min} min` : undefined,
        videoSource: todaySession.video_url ?? TRAINING_VIDEO,
        cta: 'Commencer',
        onPress: () => router.push(`/session/${todaySession.id}` as any),
      });
    }

    const featuredMindset = mindsetItems[0];
    if (featuredMindset) {
      items.push({
        id: `m-${featuredMindset.id}`,
        eyebrow: 'Mindset du jour',
        title: featuredMindset.title,
        subtitle: featuredMindset.body?.split('\n')[0] ?? undefined,
        meta: featuredMindset.duration_min ? `${featuredMindset.duration_min} min` : undefined,
        imageSource: featuredMindset.cover_url ?? null,
        videoSource: featuredMindset.cover_url ? null : INTRO_VIDEO,
        cta: 'Lire',
        onPress: () => router.push(`/mindset/${featuredMindset.id}` as any),
      });
    }

    const featuredRecipe = recipes[0];
    if (featuredRecipe) {
      items.push({
        id: `r-${featuredRecipe.id}`,
        eyebrow: 'Recette du jour',
        title: featuredRecipe.title,
        subtitle: featuredRecipe.description ?? undefined,
        meta: featuredRecipe.kcal ? `${featuredRecipe.kcal} kcal` : undefined,
        imageSource: featuredRecipe.cover_url ?? null,
        videoSource: featuredRecipe.video_url ?? (featuredRecipe.cover_url ? null : NUTRITION_VIDEO),
        cta: 'Voir la recette',
        onPress: () => router.push(`/recipe/${featuredRecipe.id}` as any),
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'placeholder',
        eyebrow: 'Bientôt',
        title: 'Du contenu arrive',
        subtitle: 'Demande à ta coach de publier des séances et recettes',
        videoSource: TRAINING_VIDEO,
      });
    }

    return items;
  }, [todaySession, mindsetItems, recipes, router]);

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

        {/* Big hero swiper */}
        <View style={{ marginTop: Spacing.xl }}>
          <HeroSwiper items={heroItems} />
        </View>

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
                      ? 'Méditation'
                      : m.kind === 'article'
                        ? 'Article'
                        : 'Affirmation'
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
                  subtitle={r.kcal ? `${r.kcal} kcal` : 'Recette'}
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
                  subtitle={s.description ?? 'Séance'}
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
});
