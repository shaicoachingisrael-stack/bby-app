import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, BookOpen, Heart, Sparkles } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { AdminButton } from '@/components/ui/admin-button';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useMindsetContent } from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useProfile } from '@/lib/use-profile';

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

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshMindset();
    }, [refresh, refreshMindset]),
  );

  const featured = mindsetItems[0];
  const others = mindsetItems.slice(1, 5);

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
              icon={Heart}
              title={t('mindset.meditationTitle')}
              subtitle={t('mindset.meditationSubtitle')}
              onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
            />
            <ActivityCard
              icon={BookOpen}
              title={t('mindset.journalTitle')}
              subtitle={t('mindset.journalSubtitle')}
              onPress={() => router.push('/mindset-log?kind=journal' as any)}
            />
          </View>
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
});
