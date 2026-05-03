import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/ui/date-strip';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useSessions, useTodaySession } from '@/lib/use-content';
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
  const { user } = useAuth();
  const { profile } = useProfile();
  const { refresh } = useDayData();
  const { session: todaySession, refresh: refreshToday } = useTodaySession();
  const { sessions: catalog, refresh: refreshCatalog } = useSessions();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshToday();
      refreshCatalog();
    }, [refresh, refreshToday, refreshCatalog]),
  );

  const firstName = (profile?.display_name || user?.email?.split('@')[0] || '').split(' ')[0];
  const initial = (firstName || '?')[0].toUpperCase();
  const monthLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
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
                Hello, {firstName ? capitalize(firstName) : 'toi'}
              </Text>
              <Text
                style={[styles.helloTitle, { color: palette.text, fontFamily: Fonts.displayBold }]}
                numberOfLines={1}
              >
                Belle journée !
              </Text>
            </View>
          </Pressable>
          <Pressable
            hitSlop={8}
            style={[styles.bell, { backgroundColor: palette.surface }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        {/* Calendar */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <Text style={[styles.month, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {monthLabel}
          </Text>
          <Text style={[styles.monthHint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            Sélectionne une date
          </Text>
        </View>
        <View style={{ marginTop: Spacing.md }}>
          <DateStrip value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* Séance du jour */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <SessionCard
            eyebrow="SÉANCE DU JOUR"
            title={todaySession?.title ?? 'Aucune séance'}
            subtitle={todaySession?.description ?? 'Demande à ta coach de publier du contenu'}
            duration={todaySession?.duration_min ? `${todaySession.duration_min} min` : undefined}
            videoSource={todaySession?.video_url ?? TRAINING_VIDEO}
            onPress={() =>
              todaySession?.id
                ? router.push(`/session/${todaySession.id}` as any)
                : null
            }
          />
        </View>

        {/* Mindset du jour */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.md }}>
          <SessionCard
            eyebrow="COACHING"
            title="Mindset du jour"
            subtitle="5 min de lecture"
            videoSource={INTRO_VIDEO}
            onPress={() => router.push('/mindset-log?kind=journal' as any)}
          />
        </View>

        {/* Recommandé pour vous */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            Recommandé pour vous
          </Text>
          <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            Voir tout
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
        >
          {catalog.length === 0 ? (
            <RecommendationCard
              videoSource={INTRO_VIDEO}
              duration="—"
              title="Bientôt"
              subtitle="Du contenu arrive"
            />
          ) : (
            catalog.slice(0, 6).map((s) => (
              <RecommendationCard
                key={s.id}
                videoSource={s.video_url ?? INTRO_VIDEO}
                duration={s.duration_min ? `${s.duration_min} min` : '—'}
                title={s.title}
                subtitle={s.description ?? 'Séance'}
                onPress={() => router.push(`/session/${s.id}` as any)}
              />
            ))
          )}
        </ScrollView>
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
  monthHint: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 18, letterSpacing: -0.3 },
  seeAll: { fontSize: 13 },
});
