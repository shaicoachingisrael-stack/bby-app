import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ritualIcon } from '@/lib/ritual-icons';
import { useRitualCatalog } from '@/lib/use-rituals';

export default function RitualsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { items, loading, refresh } = useRitualCatalog();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(admin)/rituals-edit' as any)}
          hitSlop={12}
          style={[styles.add, { backgroundColor: palette.text }]}
        >
          <Plus size={18} color={palette.background} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Rituels
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Catalogue suggéré à la cliente (traduit automatiquement).
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xl }} />
        ) : items.length === 0 ? (
          <View style={{ marginTop: Spacing.xxl, alignItems: 'center', gap: Spacing.md }}>
            <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              Aucun rituel dans le catalogue.
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            {items.map((c) => {
              const Icon = ritualIcon(c.icon);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(admin)/rituals-edit?id=${c.id}` as any)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View style={[styles.thumb, { backgroundColor: palette.background }]}>
                    <Icon size={20} color={palette.text} strokeWidth={1.8} />
                  </View>
                  <Text style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                    {c.label}
                  </Text>
                  <ChevronRight size={18} color={palette.textSecondary} />
                </Pressable>
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
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  empty: { fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderRadius: Radius.md, gap: Spacing.md,
  },
  rowTitle: { flex: 1, fontSize: 15 },
  thumb: {
    width: 44, height: 44, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
});
