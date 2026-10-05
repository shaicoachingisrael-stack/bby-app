import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Frown, Laugh, Meh, Plus, Search, Smile } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

type Entry = {
  id: string;
  kind: string;
  body: string;
  mood: string | null;
  created_at: string;
};

const MOOD_ICON: Record<string, typeof Smile> = {
  great: Laugh,
  good: Smile,
  neutral: Meh,
  tired: Frown,
  low: Frown,
};

export default function EntriesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = params.kind === 'intention' ? 'intention' : 'journal';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('mindset_entries')
      .select('id, kind, body, mood, created_at')
      .eq('user_id', user.id)
      .eq('kind', kind)
      .order('created_at', { ascending: false });
    if (error) console.warn('entries fetch', error);
    setEntries((data as Entry[] | null) ?? []);
    setLoading(false);
  }, [user, kind]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.body.toLowerCase().includes(q));
  }, [entries, query]);

  const title = kind === 'intention' ? t('entries.intentionsTitle') : t('entries.journalTitle');

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
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
        <Pressable
          onPress={() => router.push(`/mindset-log?kind=${kind}` as any)}
          hitSlop={12}
          style={[styles.add, { backgroundColor: palette.text }]}
        >
          <Plus size={18} color={palette.background} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>{title}</Text>

        <View style={[styles.search, { backgroundColor: palette.surface }]}>
          <Search size={16} color={palette.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('entries.search')}
            placeholderTextColor={palette.textSecondary}
            style={[styles.searchInput, { color: palette.text, fontFamily: Fonts.sans }]}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : filtered.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('entries.empty')}
          </Text>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {filtered.map((e) => {
              const MoodIcon = e.mood ? MOOD_ICON[e.mood] : null;
              return (
                <View key={e.id} style={[styles.card, { backgroundColor: palette.surface }]}>
                  <View style={styles.cardHead}>
                    <Text style={[styles.date, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                      {formatDate(e.created_at)}
                    </Text>
                    {MoodIcon && <MoodIcon size={16} color={palette.textSecondary} strokeWidth={1.8} />}
                  </View>
                  <Text
                    style={[styles.body, { color: palette.text, fontFamily: Fonts.sans }]}
                    numberOfLines={kind === 'intention' ? 2 : 5}
                  >
                    {e.body}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  add: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: Spacing.xxxl, lineHeight: 20 },
  card: { borderRadius: Radius.md, padding: Spacing.lg },
  cardHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  date: { fontSize: 12, textTransform: 'capitalize' },
  body: { fontSize: 15, lineHeight: 21 },
});
