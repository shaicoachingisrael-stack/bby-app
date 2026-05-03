import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, Dumbbell } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { AdminButton } from '@/components/ui/admin-button';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { usePrograms, useSessions, useTodaySession } from '@/lib/use-content';
import { useProfile } from '@/lib/use-profile';

const EXERCISE_VIDEO = require('@/assets/videos/exercise.mp4');
const INTRO_VIDEO = require('@/assets/videos/intro.mp4');

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutante',
  intermediaire: 'Intermédiaire',
  avance: 'Avancée',
};

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { programs, refresh: refreshPrograms } = usePrograms();
  const { sessions, refresh: refreshSessions } = useSessions();
  const { session: todaySession, refresh: refreshToday } = useTodaySession();

  useFocusEffect(
    useCallback(() => {
      refreshPrograms();
      refreshSessions();
      refreshToday();
    }, [refreshPrograms, refreshSessions, refreshToday]),
  );

  const initial = (profile?.display_name || user?.email || '?')[0].toUpperCase();
  const recos = sessions.slice(0, 6);

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
                {programs.length} {programs.length > 1 ? 'programmes' : 'programme'}
              </Text>
              <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Training
              </Text>
            </View>
          </Pressable>
          <AdminButton />
          <Pressable hitSlop={8} style={[styles.bell, { backgroundColor: palette.surface }]}>
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <SessionCard
            eyebrow={todaySession ? 'REPRENDRE' : 'AUCUNE SÉANCE'}
            title={todaySession?.title ?? 'Bientôt'}
            subtitle={todaySession?.description ?? 'Demande à ta coach de publier du contenu'}
            duration={todaySession?.duration_min ? `${todaySession.duration_min} min` : undefined}
            videoSource={todaySession?.video_url ?? EXERCISE_VIDEO}
            onPress={() =>
              todaySession?.id ? router.push(`/session/${todaySession.id}` as any) : null
            }
          />
        </View>

        {programs.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Mes programmes
              </Text>
            </View>
            <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
              {programs.map((p) => (
                <ActivityCard
                  key={p.id}
                  icon={Dumbbell}
                  title={p.title}
                  subtitle={
                    [
                      p.level ? LEVEL_LABELS[p.level] ?? p.level : null,
                      p.duration_weeks ? `${p.duration_weeks} sem.` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Programme'
                  }
                  onPress={() => router.push(`/program/${p.id}` as any)}
                />
              ))}
            </View>
          </View>
        )}

        {recos.length > 0 && (
          <>
            <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
              <View style={styles.sectionRow}>
                <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                  Toutes les séances
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
            >
              {recos.map((s) => (
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 18, letterSpacing: -0.3 },
});
