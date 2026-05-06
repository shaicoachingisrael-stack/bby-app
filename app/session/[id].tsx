import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BarChart3, ChevronLeft, Clock, Dumbbell, Heart } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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

import { AttachmentCarousel } from '@/components/ui/attachment-carousel';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useAttachments } from '@/lib/use-attachments';
import { useSession } from '@/lib/use-content';
import { supabase } from '@/lib/supabase';

const FALLBACK_VIDEO = require('@/assets/videos/exercise.mp4');

export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const { session, loading } = useSession(id);
  const { items: attachments, refresh: refreshAttachments } = useAttachments('session', id);
  const [completing, setCompleting] = useState(false);

  useFocusEffect(useCallback(() => { refreshAttachments(); }, [refreshAttachments]));
  const [favorite, setFavorite] = useState(false);

  const videoSource = session?.video_url ?? FALLBACK_VIDEO;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  async function handleStart() {
    if (!user) return;
    setCompleting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('session_completions').insert({
        user_id: user.id,
        session_id: session?.id ?? null,
        started_at: now,
        completed_at: now,
        perceived_difficulty: 3,
      });
      if (error) console.warn('completion insert error', error);
      Alert.alert('Bravo', 'Séance enregistrée.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible.');
    } finally {
      setCompleting(false);
    }
  }

  if (loading && !session) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  const title = session?.title ?? 'Séance';
  const subtitle = session?.description ?? '';
  const duration = session?.duration_min ? `${session.duration_min} min` : '—';

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={styles.hero}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.heroOverlay} />

        <View style={[styles.topButtons, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Palette.albatre, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ChevronLeft size={20} color={Palette.encre} />
          </Pressable>

          <Pressable
            onPress={() => setFavorite((f) => !f)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Palette.albatre, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Heart
              size={20}
              color={Palette.encre}
              fill={favorite ? Palette.encre : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.heroTitle}>
          <Text style={styles.heroTitleMain}>{title}</Text>
          {subtitle ? <Text style={styles.heroTitleSub}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.background }]}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />
        <ScrollView
          contentContainerStyle={{
            paddingTop: Spacing.lg,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: Spacing.xl }}>
          <View style={styles.metaRow}>
            <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
              <Clock size={18} color={palette.text} />
              <View>
                <Text style={[styles.metaLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  Durée
                </Text>
                <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {duration}
                </Text>
              </View>
            </View>
            <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
              <BarChart3 size={18} color={palette.text} />
              <View>
                <Text style={[styles.metaLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  Niveau
                </Text>
                <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  Tous
                </Text>
              </View>
            </View>
          </View>

          {session?.description ? (
            <>
              <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Description
              </Text>
              <Text style={[styles.desc, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {session.description}
              </Text>
            </>
          ) : null}

          <View style={styles.materialRow}>
            <View style={[styles.materialIcon, { backgroundColor: palette.surface }]}>
              <Dumbbell size={18} color={palette.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.materialLabel, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                Matériel
              </Text>
              <Text style={[styles.materialValue, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                Tapis, élastique, haltères (optionnel)
              </Text>
            </View>
          </View>
          </View>

          <AttachmentCarousel attachments={attachments} />
        </ScrollView>

        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: palette.background }]}>
          <Pressable
            onPress={handleStart}
            disabled={completing}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: palette.text,
                opacity: pressed || completing ? 0.85 : 1,
              },
            ]}
          >
            {completing ? (
              <ActivityIndicator color={palette.background} />
            ) : (
              <Text
                style={[
                  styles.ctaText,
                  { color: palette.background, fontFamily: Fonts.sansSemibold },
                ]}
              >
                Démarrer la séance
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    height: 460,
    backgroundColor: Palette.gray[200],
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.18)',
  },
  topButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    position: 'absolute',
    left: Spacing.xl,
    bottom: Spacing.xxl,
  },
  heroTitleMain: {
    fontSize: 38,
    color: Palette.albatre,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  heroTitleSub: {
    fontSize: 18,
    color: Palette.albatre,
    opacity: 0.95,
    marginTop: 4,
  },
  sheet: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  metaLabel: { fontSize: 11 },
  metaValue: { fontSize: 14, marginTop: 2 },
  section: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: Spacing.xl,
  },
  desc: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  materialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialLabel: { fontSize: 14 },
  materialValue: { fontSize: 13, marginTop: 2 },
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
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
