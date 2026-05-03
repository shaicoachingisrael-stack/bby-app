import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Program, Session } from '@/lib/types';

type SessionWithProgram = Session & { program: Pick<Program, 'title'> | null };

export default function SessionsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*, program:programs(title)')
      .order('created_at', { ascending: false });
    if (error) console.warn('sessions fetch', error);
    setSessions((data as SessionWithProgram[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(admin)/session-edit' as any)}
          hitSlop={12}
          style={[styles.add, { backgroundColor: palette.text }]}
        >
          <Plus size={18} color={palette.background} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Séances
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : sessions.length === 0 ? (
          <View style={{ marginTop: Spacing.xxl, alignItems: 'center', gap: Spacing.md }}>
            <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Aucune séance. Crée la première.
            </Text>
            <Pressable
              onPress={() => router.push('/(admin)/session-edit' as any)}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Plus size={18} color={palette.background} />
              <Text
                style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}
              >
                Nouvelle séance
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {sessions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/(admin)/session-edit?id=${s.id}` as any)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}
                  >
                    {s.title}
                  </Text>
                  <Text
                    style={[styles.rowMeta, { color: palette.textSecondary, fontFamily: Fonts.sans }]}
                  >
                    {[
                      s.program?.title ?? 'Sans programme',
                      s.duration_min ? `${s.duration_min} min` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <ChevronRight size={18} color={palette.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  add: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  empty: { fontSize: 14 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    height: 48,
    borderRadius: Radius.pill,
  },
  ctaText: { fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  rowTitle: { fontSize: 15 },
  rowMeta: { fontSize: 13, marginTop: 2 },
});
