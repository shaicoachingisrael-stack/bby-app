import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

const HERO_VIDEO = require('@/assets/videos/intro.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(HERO_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.flex}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />

      <View style={[styles.content, { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View>
          <Text style={styles.title}>Mindful Movement,</Text>
          <Text style={[styles.title, styles.titleItalic]}>Made Simple</Text>
        </View>

        <View style={styles.statsCol}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1 Month</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={[styles.statCard, { marginTop: Spacing.md }]}>
            <Text style={styles.statValue}>10K</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        <View style={{ gap: Spacing.lg }}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable
            onPress={() => router.replace('/(auth)/login' as any)}
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={styles.ctaText}>Let's explore</Text>
            <View style={styles.ctaArrow}>
              <ArrowRight size={18} color={Palette.encre} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.encre },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.32)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.displayBold,
    fontSize: 44,
    lineHeight: 50,
    color: Palette.albatre,
    letterSpacing: -0.8,
  },
  titleItalic: { fontStyle: 'italic', fontWeight: '400' },
  statsCol: {
    alignSelf: 'flex-start',
  },
  statCard: {
    backgroundColor: 'rgba(250,250,248,0.18)',
    borderColor: 'rgba(250,250,248,0.32)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    width: 160,
  },
  statValue: {
    color: Palette.albatre,
    fontSize: 22,
    fontFamily: Fonts.displayBold,
    letterSpacing: -0.4,
  },
  statLabel: {
    color: Palette.albatre,
    fontFamily: Fonts.sans,
    fontSize: 13,
    opacity: 0.85,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(250,250,248,0.4)',
  },
  dotActive: { backgroundColor: Palette.albatre, width: 24 },
  cta: {
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: Palette.encre,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.xl,
    paddingRight: 6,
  },
  ctaText: {
    color: Palette.albatre,
    fontFamily: Fonts.sansSemibold,
    fontSize: 16,
  },
  ctaArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.albatre,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
