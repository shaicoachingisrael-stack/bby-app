import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, Circle, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AISLES, formatShoppingQuantity, guessAisle, parseQuantity } from '@/lib/ingredients';
import type { Aisle, ShoppingItem } from '@/lib/types';
import { useShoppingList } from '@/lib/use-meal-plan';

// « 2 kg pommes », « 500 g riz », « 6 œufs » → quantité + unité + nom ; sinon tout est le nom.
function parseManual(input: string): { name: string; quantity: number | null; unit: string | null } {
  const m = input.trim().match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(kg|g|ml|cl|l)?\s+(.+)$/i);
  if (!m) return { name: input.trim(), quantity: null, unit: null };
  return { name: m[3].trim(), quantity: parseQuantity(m[1]), unit: m[2] ? m[2].toLowerCase() : null };
}

// Liste de courses (brief Nutrition §2). Elle se construit toute seule à partir
// des recettes du menu ; ici on coche ce qu'on a acheté, on ajoute un article à
// la main, on vide la liste. Rangée par rayon, dans l'ordre d'un magasin.
export default function ShoppingListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { items, loading, refresh, toggle, addManual, clear } = useShoppingList();
  const [draft, setDraft] = useState('');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const groups = useMemo(() => {
    const by = new Map<Aisle, ShoppingItem[]>();
    for (const item of items) {
      const aisle = (item.aisle && AISLES.includes(item.aisle) ? item.aisle : 'autre') as Aisle;
      by.set(aisle, [...(by.get(aisle) ?? []), item]);
    }
    return AISLES.filter((a) => by.has(a)).map((a) => ({
      aisle: a,
      // ce qui reste à acheter d'abord, le déjà coché en bas du rayon
      items: by.get(a)!.sort((x, y) => Number(x.checked) - Number(y.checked)),
    }));
  }, [items]);

  const remaining = items.filter((i) => !i.checked).length;

  async function handleAdd() {
    const parsed = parseManual(draft);
    if (!parsed.name) return;
    setDraft('');
    try {
      await addManual(parsed.name, parsed.quantity, parsed.unit, guessAisle(parsed.name));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? '');
    }
  }

  function handleClear() {
    Alert.alert(t('shopping.clearConfirmTitle'), t('shopping.clearConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('shopping.clear'),
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
        </Pressable>
        {items.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={12}>
            <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 14 }}>
              {t('shopping.clear')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {t('shopping.title')}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {items.length === 0 ? t('shopping.subtitle') : t('shopping.remaining', { count: remaining })}
        </Text>

        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            placeholder={t('shopping.addPlaceholder')}
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans },
            ]}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!draft.trim()}
            accessibilityLabel={t('shopping.add')}
            style={[styles.addButton, { backgroundColor: palette.text, opacity: draft.trim() ? 1 : 0.35 }]}
          >
            <Plus size={20} color={palette.background} />
          </Pressable>
        </View>

        {!loading && items.length === 0 ? (
          <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
            <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {t('shopping.empty')}
            </Text>
            <Pressable
              onPress={() => router.push('/menu' as any)}
              style={({ pressed }) => [styles.link, { borderColor: palette.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ color: palette.text, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>
                {t('shopping.goToMenu')}
              </Text>
            </Pressable>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.aisle} style={{ marginTop: Spacing.xl }}>
              <Text style={[styles.aisle, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                {t(`shopping.aisle.${g.aisle}`).toUpperCase()}
              </Text>
              <View style={[styles.card, { backgroundColor: palette.surface }]}>
                {g.items.map((item, i) => {
                  const qty = formatShoppingQuantity(item.quantity, item.unit, t);
                  const Icon = item.checked ? CheckCircle2 : Circle;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(item)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.checked }}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderTopColor: palette.border,
                          borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Icon size={22} color={item.checked ? palette.textSecondary : palette.text} strokeWidth={1.8} />
                      <Text
                        style={[
                          styles.name,
                          {
                            color: item.checked ? palette.textSecondary : palette.text,
                            fontFamily: Fonts.sansMedium,
                            textDecorationLine: item.checked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {qty ? (
                        <Text style={[styles.qty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                          {qty}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  addRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  input: { flex: 1, height: 52, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: 16 },
  addButton: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 14, lineHeight: 20 },
  link: { height: 48, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  aisle: { fontSize: 11, letterSpacing: 1.4, marginBottom: Spacing.sm },
  card: { borderRadius: Radius.lg, paddingHorizontal: Spacing.lg },
  // 52 pt de haut : une cible confortable, d'une main, un panier dans l'autre
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52, paddingVertical: Spacing.sm },
  name: { flex: 1, fontSize: 16 },
  qty: { fontSize: 14 },
});
