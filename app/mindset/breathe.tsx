import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { patternBySlug, type BreathPhaseKind } from '@/lib/breathing';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const CIRCLE = Math.min(width * 0.62, 260);
const SCALE_MIN = 0.55;
const SCALE_MAX = 1;

// Échelle cible selon la phase : gonfle à l'inspiration, dégonfle à l'expiration.
function targetScale(phase: BreathPhaseKind, current: number): number {
  if (phase === 'inhale') return SCALE_MAX;
  if (phase === 'exhale') return SCALE_MIN;
  return current; // hold / hold_out : on maintient
}

export default function BreathePlayer() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ slug?: string; duration?: string }>();

  const pattern = patternBySlug(params.slug);
  const sessionSeconds = (Number(params.duration) || 5) * 60;

  const scale = useSharedValue(SCALE_MIN);
  const [phaseLabel, setPhaseLabel] = useState<BreathPhaseKind>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentScale = useRef(SCALE_MIN);

  const cleanup = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    cancelAnimation(scale);
  }, [scale]);

  const finish = useCallback(async () => {
    cleanup();
    setFinished(true);
    if (user && pattern) {
      const { error } = await supabase
        .from('mindset_entries')
        .insert({ user_id: user.id, kind: 'breathing_done', body: pattern.slug });
      if (error) console.warn('breathing log', error);
    }
  }, [cleanup, user, pattern]);

  useEffect(() => {
    if (!pattern) return;
    let elapsed = 0;

    const runPhase = (index: number) => {
      const phase = pattern.phases[index % pattern.phases.length];
      setPhaseLabel(phase.phase);
      setSecondsLeft(phase.seconds);

      const to = targetScale(phase.phase, currentScale.current);
      currentScale.current = to;
      scale.value = withTiming(to, { duration: phase.seconds * 1000, easing: Easing.inOut(Easing.ease) });

      let s = phase.seconds;
      if (tick.current) clearInterval(tick.current);
      tick.current = setInterval(() => {
        s -= 1;
        setSecondsLeft(Math.max(s, 0));
      }, 1000);

      const to2 = setTimeout(() => {
        elapsed += phase.seconds;
        if (elapsed >= sessionSeconds) finish();
        else runPhase(index + 1);
      }, phase.seconds * 1000);
      timers.current.push(to2);
    };

    runPhase(0);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern?.slug]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const close = () => {
    cleanup();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Pressable style={[styles.close, { top: insets.top + Spacing.md }]} onPress={close} hitSlop={12}>
        <X size={26} color={palette.textSecondary} />
      </Pressable>

      {!pattern ? null : finished ? (
        <View style={styles.center}>
          <Text style={[styles.finished, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            {t('breathing.finished')}
          </Text>
          <Text style={[styles.finishedSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('breathing.finishedSub')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.finishBtn, { borderColor: palette.border }]}
          >
            <Text style={[styles.finishBtnText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
              {t('breathing.close')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.patternName, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            {t(pattern.nameKey).toUpperCase()}
          </Text>
          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                { backgroundColor: palette.surface, borderColor: palette.border },
                animatedStyle,
              ]}
            />
            <View style={styles.circleContent}>
              <Text style={[styles.phaseText, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t(`breathing.phase.${phaseLabel}`)}
              </Text>
              <Text style={[styles.count, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {secondsLeft}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { position: 'absolute', right: Spacing.xl, zIndex: 10, padding: Spacing.xs },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xxxl },
  patternName: { fontSize: 13, letterSpacing: 2 },
  circleWrap: { width: CIRCLE, height: CIRCLE, justifyContent: 'center', alignItems: 'center' },
  circle: {
    position: 'absolute', width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, borderWidth: 1,
  },
  circleContent: { justifyContent: 'center', alignItems: 'center' },
  phaseText: { fontSize: 24 },
  count: { fontSize: 15, marginTop: Spacing.xs },
  finished: { fontSize: 32, letterSpacing: -0.5, textAlign: 'center' },
  finishedSub: { fontSize: 15, textAlign: 'center', marginTop: -Spacing.lg },
  finishBtn: { borderWidth: 1, borderRadius: Radius.pill, paddingVertical: 12, paddingHorizontal: Spacing.xxxl },
  finishBtnText: { fontSize: 15 },
});
