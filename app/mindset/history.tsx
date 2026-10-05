import { useRouter } from 'expo-router';
import { BookOpen, CheckCircle2, ChevronLeft, Heart, PenLine, Wind } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const TYPES: { kind: string; icon: typeof Wind; labelKey: string }[] = [
  { kind: 'breathing_done', icon: Wind, labelKey: 'breathing.title' },
  { kind: 'journal', icon: PenLine, labelKey: 'entries.journalTitle' },
  { kind: 'meditation_done', icon: Heart, labelKey: 'mindset.kind.meditation' },
];

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();

  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [byType, setByType] = useState<Record<string, number>>({});
  const [ritualChecks, setRitualChecks] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const now = Date.now();
      const weekAgo = new Date(now - 7 * 864e5).toISOString();
      const monthAgo = new Date(now - 30 * 864e5).toISOString();
      const monthAgoDate = new Date(now - 30 * 864e5).toISOString().slice(0, 10);

      const [entriesRes, checksRes] = await Promise.all([
        supabase
          .from('mindset_entries')
          .select('kind, created_at')
          .eq('user_id', user.id)
          .gte('created_at', monthAgo),
        supabase
          .from('mindset_ritual_checks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('check_date', monthAgoDate),
      ]);

      const entries = (entriesRes.data as { kind: string; created_at: string }[] | null) ?? [];
      const counts: Record<string, number> = {};
      let week = 0;
      for (const e of entries) {
        counts[e.kind] = (counts[e.kind] ?? 0) + 1;
        if (e.created_at >= weekAgo) week += 1;
      }
      setMonthCount(entries.length);
      setWeekCount(week);
      setByType(counts);
      setRitualChecks(checksRes.count ?? 0);
    })();
  }, [user]);

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
          {t('history.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('history.subtitle')}
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.statNum, { color: palette.text, fontFamily: Fonts.displayBold }]}>{weekCount}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('history.thisWeek')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.statNum, { color: palette.text, fontFamily: Fonts.displayBold }]}>{monthCount}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('history.thisMonth')}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {t('history.byType').toUpperCase()}
        </Text>
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          {TYPES.map((ty) => {
            const Icon = ty.icon;
            return (
              <View key={ty.kind} style={[styles.typeRow, { borderBottomColor: palette.border }]}>
                <View style={[styles.typeIcon, { backgroundColor: palette.background }]}>
                  <Icon size={16} color={palette.textSecondary} strokeWidth={1.8} />
                </View>
                <Text style={[styles.typeLabel, { color: palette.text, fontFamily: Fonts.sans }]}>
                  {t(ty.labelKey)}
                </Text>
                <Text style={[styles.typeCount, { color: palette.textSecondary, fontFamily: Fonts.sansSemibold }]}>
                  {byType[ty.kind] ?? 0}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.ritualCard, { backgroundColor: palette.surface }]}>
          <View style={[styles.typeIcon, { backgroundColor: palette.background }]}>
            <CheckCircle2 size={16} color={palette.textSecondary} strokeWidth={1.8} />
          </View>
          <Text style={[styles.typeLabel, { color: palette.text, fontFamily: Fonts.sans }]}>
            {t('history.rituals')}
          </Text>
          <Text style={[styles.typeCount, { color: palette.textSecondary, fontFamily: Fonts.sansSemibold }]}>
            {ritualChecks}
          </Text>
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
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  statCard: { flex: 1, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  statNum: { fontSize: 34, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: Spacing.xs },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.xl, marginBottom: Spacing.md },
  card: { borderRadius: Radius.md, paddingHorizontal: Spacing.lg },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  typeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { flex: 1, fontSize: 14.5 },
  typeCount: { fontSize: 15 },
  ritualCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.xl },
});
