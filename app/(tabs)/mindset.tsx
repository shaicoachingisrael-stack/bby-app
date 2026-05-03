import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, BookOpen, Heart, Sparkles } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useDayData } from '@/lib/use-day-data';
import { useProfile } from '@/lib/use-profile';

const INTRO_VIDEO = require('@/assets/videos/intro.mp4');
const NUTRITION_VIDEO = require('@/assets/videos/nutrition.mp4');

export default function MindsetScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, refresh } = useDayData();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

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
                Quelques minutes pour soi
              </Text>
              <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Mindset
              </Text>
            </View>
          </Pressable>
          <Pressable hitSlop={8} style={[styles.bell, { backgroundColor: palette.surface }]}>
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <SessionCard
            eyebrow="MÉDITATION"
            title="Respiration consciente"
            subtitle="Apaiser le mental"
            duration="5 min"
            videoSource={INTRO_VIDEO}
            onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            Aujourd'hui
          </Text>
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            <ActivityCard
              icon={Sparkles}
              title="Intention du jour"
              subtitle={data.mindset_intention ?? 'Note ton intention'}
              status={data.mindset_intention ? 'done' : 'pending'}
              onPress={() => router.push('/mindset-log?kind=intention' as any)}
            />
            <ActivityCard
              icon={Heart}
              title="Méditation"
              subtitle="5 min · Respiration consciente"
              onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
            />
            <ActivityCard
              icon={BookOpen}
              title="Journal"
              subtitle="Écris tes ressentis du jour"
              onPress={() => router.push('/mindset-log?kind=journal' as any)}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            À explorer
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
        >
          <RecommendationCard
            videoSource={INTRO_VIDEO}
            duration="10 min"
            title="Body scan"
            subtitle="Méditation guidée"
            onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
          />
          <RecommendationCard
            videoSource={NUTRITION_VIDEO}
            duration="3 min"
            title="Affirmations"
            subtitle="Renforcer la confiance"
            onPress={() => router.push('/mindset-log?kind=intention' as any)}
          />
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
