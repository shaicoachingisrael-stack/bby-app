import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, Clock, Flame, History } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/ui/activity-card';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useProfile } from '@/lib/use-profile';

const EXERCISE_VIDEO = require('@/assets/videos/exercise.mp4');
const INTRO_VIDEO = require('@/assets/videos/intro.mp4');

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();

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
                Programme · Semaine 3
              </Text>
              <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Training
              </Text>
            </View>
          </Pressable>
          <Pressable hitSlop={8} style={[styles.bell, { backgroundColor: palette.surface }]}>
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <SessionCard
            eyebrow="REPRENDRE"
            title="Full body"
            subtitle="Glutes & core"
            duration="35 min"
            level="Intermédiaire"
            videoSource={EXERCISE_VIDEO}
            onPress={() => router.push('/session/today' as any)}
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              Ma bibliothèque
            </Text>
            <Pressable hitSlop={8} onPress={() => router.push('/training' as any)}>
              <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                Voir tout
              </Text>
            </Pressable>
          </View>
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            <ActivityCard
              icon={Flame}
              title="HIIT brûle-graisses"
              subtitle="20 min · 8 séances"
              onPress={() => router.push('/session/hiit' as any)}
            />
            <ActivityCard
              icon={Clock}
              title="Mobilité matinale"
              subtitle="10 min · 15 séances"
              onPress={() => router.push('/session/mobility' as any)}
            />
            <ActivityCard
              icon={History}
              title="Historique complet"
              subtitle="Tes 30 dernières séances"
              onPress={() => router.push('/account' as any)}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              Recommandé
            </Text>
            <Pressable hitSlop={8}>
              <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                Voir tout
              </Text>
            </Pressable>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
        >
          <RecommendationCard
            videoSource={INTRO_VIDEO}
            duration="20 min"
            title="Morning Stretch"
            subtitle="Par Sérénité"
            onPress={() => router.push('/session/morning-stretch' as any)}
          />
          <RecommendationCard
            videoSource={EXERCISE_VIDEO}
            duration="25 min"
            title="HIIT brûle-graisses"
            subtitle="Par Training"
            onPress={() => router.push('/session/hiit' as any)}
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 18, letterSpacing: -0.3 },
  seeAll: { fontSize: 13 },
});
