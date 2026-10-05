import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft, Heart, Sparkles, Wind } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BREATHING_PATTERNS } from '@/lib/breathing';
import { localizeAll } from '@/lib/localize';
import { supabase } from '@/lib/supabase';
import type { MindsetContent } from '@/lib/types';
import { useFavorites } from '@/lib/use-favorites';

type Filter = 'all' | 'content' | 'breathing';

export default function FavoritesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { rows, toggle, refresh } = useFavorites();

  const [content, setContent] = useState<Record<string, MindsetContent>>({});
  const [filter, setFilter] = useState<Filter>('all');

  const loadContent = useCallback(async () => {
    const ids = rows.filter((r) => r.item_type === 'content').map((r) => r.item_id);
    if (ids.length === 0) { setContent({}); return; }
    const { data } = await supabase.from('mindset_content').select('*').in('id', ids);
    const localized = localizeAll(data as MindsetContent[] | null, 'mindset_content', i18n.language);
    const map: Record<string, MindsetContent> = {};
    localized.forEach((c) => { map[c.id] = c; });
    setContent(map);
  }, [rows, i18n.language]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useFocusEffect(useCallback(() => { loadContent(); }, [loadContent]));

  const items = useMemo(() => {
    return rows
      .filter((r) => (filter === 'all' ? true : r.item_type === filter))
      .map((r) => {
        if (r.item_type === 'breathing') {
          const p = BREATHING_PATTERNS.find((x) => x.slug === r.item_id);
          if (!p) return null;
          return {
            key: `b-${r.item_id}`,
            type: 'breathing' as const,
            icon: Wind,
            title: t(p.nameKey),
            sub: t(p.descKey),
            onPress: () => router.push(`/mindset/breathe?slug=${p.slug}&duration=5` as any),
            fav: { type: 'breathing' as const, id: r.item_id },
          };
        }
        const c = content[r.item_id];
        if (!c) return null;
        const icon = c.kind === 'article' ? BookOpen : c.kind === 'affirmation' ? Sparkles : Heart;
        return {
          key: `c-${r.item_id}`,
          type: 'content' as const,
          icon,
          title: c.title,
          sub: c.kind === 'article' ? t('mindset.kind.article') : c.kind === 'affirmation' ? t('mindset.kind.affirmation') : t('mindset.kind.meditation'),
          onPress: () => router.push(`/mindset/${c.id}` as any),
          fav: { type: 'content' as const, id: r.item_id },
        };
      })
      .filter(Boolean) as Array<{
        key: string; icon: typeof Wind; title: string; sub: string; onPress: () => void; fav: { type: 'content' | 'breathing'; id: string };
      }>;
  }, [rows, content, filter, t, router]);

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
          {t('favorites.title')}
        </Text>

        <View style={styles.filters}>
          {(['all', 'content', 'breathing'] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, { borderColor: palette.border, backgroundColor: active ? palette.text : 'transparent' }]}
              >
                <Text style={{ color: active ? palette.background : palette.text, fontFamily: Fonts.sansMedium, fontSize: 13 }}>
                  {t(`favorites.filter_${f}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {items.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('favorites.empty')}
          </Text>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <View key={it.key} style={[styles.card, { backgroundColor: palette.surface }]}>
                  <View style={[styles.iconWrap, { backgroundColor: palette.background }]}>
                    <Icon size={16} color={palette.text} strokeWidth={1.8} />
                  </View>
                  <Pressable style={{ flex: 1 }} onPress={it.onPress}>
                    <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.sans }]} numberOfLines={2}>
                      {it.title}
                    </Text>
                    <Text style={[styles.cardSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]} numberOfLines={1}>
                      {it.sub}
                    </Text>
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => toggle(it.fav.type, it.fav.id)}>
                    <Heart size={18} color={palette.text} fill={palette.text} />
                  </Pressable>
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
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: Spacing.xxxl, lineHeight: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.md },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14.5, lineHeight: 20 },
  cardSub: { fontSize: 12, marginTop: 2 },
});
