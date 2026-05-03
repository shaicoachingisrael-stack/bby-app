import { Image } from 'expo-image';
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
import type { Program } from '@/lib/types';

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutante',
  intermediaire: 'Intermédiaire',
  avance: 'Avancée',
};

export default function ProgramsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('programs fetch', error);
    setPrograms((data as Program[]) ?? []);
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
          onPress={() => router.push('/(admin)/program-edit' as any)}
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
          Programmes
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : programs.length === 0 ? (
          <View style={{ marginTop: Spacing.xxl, alignItems: 'center', gap: Spacing.md }}>
            <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Aucun programme. Crée le premier.
            </Text>
            <Pressable
              onPress={() => router.push('/(admin)/program-edit' as any)}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Plus size={18} color={palette.background} />
              <Text
                style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}
              >
                Nouveau programme
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {programs.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/(admin)/program-edit?id=${p.id}` as any)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                {p.cover_url ? (
                  <Image
                    source={{ uri: p.cover_url }}
                    style={[styles.thumb, { backgroundColor: palette.background }]}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: palette.background }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}
                  >
                    {p.title}
                  </Text>
                  <Text
                    style={[styles.rowMeta, { color: palette.textSecondary, fontFamily: Fonts.sans }]}
                  >
                    {[
                      p.level ? LEVEL_LABELS[p.level] ?? p.level : null,
                      p.duration_weeks ? `${p.duration_weeks} sem.` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sans niveau'}
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
  thumb: { width: 44, height: 44, borderRadius: Radius.sm, overflow: 'hidden' },
});
