import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMindsetPrograms } from '@/lib/use-mindset-programs';

export default function MindsetProgramsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { programs, progress } = useMindsetPrograms();

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
          {t('programs.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('programs.subtitle')}
        </Text>

        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {programs.map((p) => {
            const prog = progress[p.id];
            const pct = prog ? Math.round((prog.current_day / p.day_count) * 100) : 0;
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/mindset/program/${p.id}` as any)}
                style={({ pressed }) => [styles.card, { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 }]}
              >
                {p.cover_url ? (
                  <Image source={{ uri: p.cover_url }} style={styles.cover} contentFit="cover" />
                ) : null}
                <View style={styles.cardHead}>
                  <Text style={[styles.dayCount, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                    {t('programs.dayCount', { count: p.day_count })}
                  </Text>
                  {prog ? (
                    <Text style={[styles.inProgress, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                      {prog.completed_at
                        ? t('programs.completed')
                        : t('programs.dayProgress', { current: prog.current_day, total: p.day_count })}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.name, { color: palette.text, fontFamily: Fonts.displayBold }]}>{p.title}</Text>
                {p.subtitle ? (
                  <Text style={[styles.progSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                    {p.subtitle}
                  </Text>
                ) : null}
                {prog ? (
                  <View style={[styles.barTrack, { backgroundColor: palette.background }]}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: palette.text }]} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  card: { borderRadius: Radius.md, padding: Spacing.lg, overflow: 'hidden' },
  cover: { width: '100%', height: 120, borderRadius: Radius.sm, marginBottom: Spacing.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayCount: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  inProgress: { fontSize: 11 },
  name: { fontSize: 20, letterSpacing: -0.4, marginTop: Spacing.sm },
  progSub: { fontSize: 14, marginTop: 3 },
  barTrack: { height: 3, borderRadius: 2, marginTop: Spacing.md, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
});
