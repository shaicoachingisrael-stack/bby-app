import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MEAL_LABEL_KEYS } from '@/lib/ingredients';
import { useRecipes } from '@/lib/use-content';

// Bibliothèque personnelle (brief Nutrition §3) : les recettes que la personne a
// créées. Elles s'ajoutent à un menu comme les recettes BBY.
export default function MyRecipesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { recipes, loading, refresh } = useRecipes('mine');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

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
          {t('myRecipes.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('myRecipes.subtitle')}
        </Text>

        <Pressable
          onPress={() => router.push('/my-recipe-edit' as any)}
          style={({ pressed }) => [styles.cta, { backgroundColor: palette.accent, overflow: 'hidden', opacity: pressed ? 0.85 : 1 }]}
        >
          <AccentFill />
          <Plus size={18} color={palette.onAccent} />
          <Text style={[styles.ctaText, { color: palette.onAccent, fontFamily: Fonts.sansSemibold }]}>
            {t('myRecipes.create')}
          </Text>
        </Pressable>

        {!loading && recipes.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            {t('myRecipes.empty')}
          </Text>
        ) : (
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            {recipes.map((r, i) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/recipe/${r.id}` as any)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderTopColor: palette.border,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                    {r.title}
                  </Text>
                  {r.meal_type ? (
                    <Text style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {t(MEAL_LABEL_KEYS[r.meal_type])}
                    </Text>
                  ) : null}
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
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  cta: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  ctaText: { fontSize: 15 },
  empty: { fontSize: 14, lineHeight: 20, marginTop: Spacing.xl, textAlign: 'center' },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
});
