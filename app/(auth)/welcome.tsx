import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { Dumbbell, Leaf, Utensils } from 'lucide-react-native';
import { ArrowRight } from '@/lib/rtl-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageButton } from '@/components/ui/language-button';
import { IconBadge } from '@/components/ui/tiles';
import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

const HERO_VIDEO = require('@/assets/videos/intro.mp4');

export default function WelcomeScreen() {
  const { t } = useTranslation();
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
          <View style={styles.topRow}>
            <Text style={styles.brand}>BODY BY YOU</Text>
            <LanguageButton light />
          </View>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        {/* Ce que contient l'app : trois carrés, pas de chiffres */}
        <View style={styles.pillars}>
          <View style={styles.pillar}>
            <IconBadge icon={Dumbbell} color="rose" size={44} />
            <Text style={styles.pillarText}>{t('tabs.training')}</Text>
          </View>
          <View style={styles.pillar}>
            <IconBadge icon={Utensils} color="orange" size={44} />
            <Text style={styles.pillarText}>{t('tabs.nutrition')}</Text>
          </View>
          <View style={styles.pillar}>
            <IconBadge icon={Leaf} color="mint" size={44} />
            <Text style={styles.pillarText}>{t('tabs.mindset')}</Text>
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
            <Text style={styles.ctaText}>{t('auth.letsExplore')}</Text>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  brand: { color: Palette.albatre, fontFamily: Fonts.sansBold, fontSize: 12, letterSpacing: 3 },
  subtitle: {
    marginTop: Spacing.md,
    color: Palette.albatre,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.9,
  },
  pillars: { flexDirection: 'row', gap: Spacing.md },
  pillar: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.lg,
    borderRadius: 22,
    backgroundColor: 'rgba(20,12,26,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pillarText: { color: Palette.albatre, fontFamily: Fonts.sansSemibold, fontSize: 13 },
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
