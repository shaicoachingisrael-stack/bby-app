import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Play } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BREATHING_PATTERNS, patternCycleLabel, type BreathingPattern } from '@/lib/breathing';
import { useFavorites } from '@/lib/use-favorites';

export default function BreathingLibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  const { isFavorite, toggle } = useFavorites();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [duration, setDuration] = useState(5);

  function start(p: BreathingPattern) {
    router.push(`/mindset/breathe?slug=${p.slug}&duration=${duration}` as any);
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('breathing.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('breathing.subtitle')}
        </Text>

        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {BREATHING_PATTERNS.map((p) => {
            const open = openSlug === p.slug;
            return (
              <View key={p.slug} style={[styles.card, { backgroundColor: palette.surface }]}>
                <Pressable onPress={() => setOpenSlug(open ? null : p.slug)} style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.name, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                        {t(p.nameKey)}
                      </Text>
                      <Text style={[styles.cycle, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                        {patternCycleLabel(p)}
                      </Text>
                    </View>
                    <Text style={[styles.desc, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {t(p.descKey)}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => toggle('breathing', p.slug)}>
                    <Heart
                      size={18}
                      color={palette.textSecondary}
                      fill={isFavorite('breathing', p.slug) ? palette.textSecondary : 'transparent'}
                    />
                  </Pressable>
                </Pressable>

                {open && (
                  <View style={[styles.expand, { borderTopColor: palette.border }]}>
                    <Text style={[styles.durLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                      {t('breathing.duration').toUpperCase()}
                    </Text>
                    <View style={styles.durRow}>
                      {p.durations.map((d) => {
                        const active = duration === d;
                        return (
                          <Pressable
                            key={d}
                            onPress={() => setDuration(d)}
                            style={[
                              styles.durChip,
                              { borderColor: palette.border, backgroundColor: active ? palette.text : 'transparent' },
                            ]}
                          >
                            <Text
                              style={{
                                color: active ? palette.background : palette.text,
                                fontFamily: Fonts.sansMedium,
                                fontSize: 13,
                              }}
                            >
                              {t('breathing.min', { count: d })}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable
                      onPress={() => start(p)}
                      style={({ pressed }) => [
                        styles.startBtn,
                        { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Play size={16} color={palette.background} />
                      <Text style={[styles.startText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
                        {t('breathing.start')}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  card: { borderRadius: Radius.md, padding: Spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  name: { fontSize: 16 },
  cycle: { fontSize: 12, letterSpacing: 1 },
  desc: { fontSize: 13, marginTop: 4, lineHeight: 19 },
  expand: { marginTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.lg, gap: Spacing.md },
  durLabel: { fontSize: 11, letterSpacing: 1.4 },
  durRow: { flexDirection: 'row', gap: Spacing.sm },
  durChip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, borderRadius: Radius.pill,
  },
  startText: { fontSize: 14 },
});
