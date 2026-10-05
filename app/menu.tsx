import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Plus, ShoppingBasket, Sparkles, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DAY_KEYS, MEAL_LABEL_KEYS, MEAL_TYPES } from '@/lib/ingredients';
import { useRecipes } from '@/lib/use-content';
import { useMenu } from '@/lib/use-meal-plan';

// Menu de la semaine (brief Nutrition §4) : composé à la main ou généré, et
// toujours modifiable — on remplace, on retire, on ajoute quand on veut.
// Chaque recette posée ici alimente la liste de courses.
export default function MenuScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { items, loading, refresh, remove, clear, generate } = useMenu();
  const { recipes } = useRecipes('all');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function runGenerate() {
    setBusy(true);
    try {
      const placed = await generate(recipes);
      if (placed === 0) Alert.alert(t('menu.generateEmptyTitle'), t('menu.generateEmptyBody'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
    } finally {
      setBusy(false);
    }
  }

  function handleGenerate() {
    if (items.length === 0) {
      runGenerate();
      return;
    }
    Alert.alert(t('menu.generateConfirmTitle'), t('menu.generateConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('menu.generate'), onPress: runGenerate },
    ]);
  }

  function handleClear() {
    Alert.alert(t('menu.clearConfirmTitle'), t('menu.clearConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menu.clear'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clear();
          } catch (e: any) {
            Alert.alert(t('common.error'), e?.message ?? '');
          }
        },
      },
    ]);
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
          {t('menu.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('menu.subtitle')}
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handleGenerate}
            disabled={busy}
            style={({ pressed }) => [styles.action, { backgroundColor: palette.accent, overflow: 'hidden', opacity: pressed || busy ? 0.8 : 1 }]}
          >
            <AccentFill />
            {busy ? (
              <ActivityIndicator color={palette.onAccent} />
            ) : (
              <>
                <Sparkles size={16} color={palette.onAccent} />
                <Text style={[styles.actionText, { color: palette.onAccent, fontFamily: Fonts.sansSemibold }]}>
                  {t('menu.generate')}
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/shopping-list' as any)}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: palette.surface, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ShoppingBasket size={16} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('shopping.title')}
            </Text>
          </Pressable>
        </View>

        {loading && items.length === 0 ? (
          <ActivityIndicator color={palette.text} style={{ marginTop: Spacing.xxl }} />
        ) : (
          DAY_KEYS.map((dayKey, day) => (
            <View key={dayKey} style={[styles.dayCard, { backgroundColor: palette.surface }]}>
              <Text style={[styles.dayTitle, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                {t(`menu.day.${dayKey}`)}
              </Text>
              {MEAL_TYPES.map((meal) => {
                const slot = items.filter((m) => m.day === day && m.meal_type === meal);
                return (
                  <View key={meal} style={[styles.slot, { borderTopColor: palette.border }]}>
                    <Text style={[styles.slotLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                      {t(MEAL_LABEL_KEYS[meal]).toUpperCase()}
                    </Text>
                    <View style={styles.slotBody}>
                      <View style={{ flex: 1, gap: 6 }}>
                        {slot.map((m) => (
                          <View key={m.id} style={styles.recipeRow}>
                            <Pressable
                              style={{ flex: 1 }}
                              onPress={() => router.push(`/recipe/${m.recipe_id}` as any)}
                            >
                              <Text numberOfLines={1} style={[styles.recipeTitle, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
                                {m.recipe?.title ?? '—'}
                              </Text>
                            </Pressable>
                            <Pressable onPress={() => remove(m.id)} hitSlop={10} accessibilityLabel={t('menu.remove')}>
                              <X size={16} color={palette.textSecondary} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                      <Pressable
                        onPress={() => router.push(`/menu-pick?day=${day}&meal=${meal}` as any)}
                        hitSlop={8}
                        accessibilityLabel={t('menu.addRecipe')}
                        style={[styles.plus, { borderColor: palette.border }]}
                      >
                        <Plus size={16} color={palette.text} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {items.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={8} style={styles.clear}>
            <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 }}>
              {t('menu.clear')}
            </Text>
          </Pressable>
        ) : null}
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
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  action: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  actionText: { fontSize: 14 },
  dayCard: { borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.md },
  dayTitle: { fontSize: 18, letterSpacing: -0.3, marginBottom: Spacing.sm },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    minHeight: 46,
  },
  slotLabel: { fontSize: 10, letterSpacing: 1.2, width: 96 },
  slotBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 28 },
  recipeTitle: { fontSize: 14 },
  plus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: { alignItems: 'center', marginTop: Spacing.xl },
});
