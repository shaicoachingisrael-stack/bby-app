import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Clock, Flame } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const EXERCISE_VIDEO = require('@/assets/videos/exercise.mp4');

const MOCK_EXERCISES = [
  { name: 'Squats lestés', detail: '4 × 12 reps' },
  { name: 'Hip thrust', detail: '4 × 10 reps' },
  { name: 'Fentes bulgares', detail: '3 × 10 / jambe' },
  { name: 'Plank dynamique', detail: '3 × 45 s' },
  { name: 'Russian twists', detail: '3 × 20' },
];

export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const [completing, setCompleting] = useState(false);

  const player = useVideoPlayer(EXERCISE_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  async function handleComplete() {
    if (!user) return;
    setCompleting(true);
    try {
      // For now, persist a generic completion without a session_id reference.
      // Later, when programs/sessions are seeded in the DB, we'll use real IDs.
      const now = new Date().toISOString();
      const { error } = await supabase.from('session_completions').insert({
        user_id: user.id,
        session_id: null as any,
        started_at: now,
        completed_at: now,
        perceived_difficulty: 3,
      });
      if (error) {
        // session_id NOT NULL -> fall back gracefully without crashing
        console.warn('completion insert error', error);
      }
      Alert.alert('Bravo', 'Séance marquée comme terminée.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>SÉANCE DU JOUR</Text>
            <Text style={styles.heroTitle}>Full body — focus glutes & core</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.lg }}>
          <View style={styles.metaRow}>
            <Meta icon={Clock} label="35 min" palette={palette} />
            <Meta icon={Flame} label="≈ 320 kcal" palette={palette} />
            <Meta icon={Check} label="Intermédiaire" palette={palette} />
          </View>

          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            Exercices
          </Text>

          {MOCK_EXERCISES.map((ex, i) => (
            <View
              key={ex.name}
              style={[styles.exerciseRow, { backgroundColor: palette.surface }]}
            >
              <Text style={[styles.exerciseIndex, { color: palette.textSecondary, fontFamily: Fonts.sansSemibold }]}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exerciseName, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {ex.name}
                </Text>
                <Text style={[styles.exerciseDetail, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {ex.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: palette.background }]}>
        <Pressable
          onPress={handleComplete}
          disabled={completing}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: palette.text, opacity: pressed || completing ? 0.85 : 1 },
          ]}
        >
          {completing ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
              Marquer comme terminée
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Meta({ icon: Icon, label, palette }: any) {
  return (
    <View style={[styles.meta, { backgroundColor: palette.surface }]}>
      <Icon size={14} color={palette.text} />
      <Text style={[styles.metaText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,250,248,0.9)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  backText: { fontSize: 14, marginLeft: 2 },
  hero: {
    height: 460,
    backgroundColor: Palette.gray[300],
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.32)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  heroEyebrow: {
    color: Palette.albatre,
    fontSize: 11,
    letterSpacing: 1.6,
    opacity: 0.9,
  },
  heroTitle: {
    color: Palette.albatre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontWeight: '700',
    maxWidth: '90%',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  metaText: { fontSize: 12 },
  section: { fontSize: 22, letterSpacing: -0.4, marginTop: Spacing.md },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  exerciseIndex: { fontSize: 12, letterSpacing: 0.4, width: 26 },
  exerciseName: { fontSize: 15 },
  exerciseDetail: { fontSize: 13, marginTop: 2 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  ctaButton: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
