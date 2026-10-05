import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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

import { IngredientsEditor } from '@/components/ui/ingredients-editor';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import {
  draftsToPayload,
  IngredientDraft,
  ingredientsToText,
  MEAL_LABEL_KEYS,
  MEAL_TYPES,
  newDraft,
} from '@/lib/ingredients';
import { supabase } from '@/lib/supabase';
import type { MealType, Recipe, RecipeIngredient } from '@/lib/types';
import { saveRecipeIngredients } from '@/lib/use-meal-plan';

// Créer / modifier une recette personnelle (brief Nutrition §3) : un titre, des
// ingrédients avec quantités, des étapes. Les macros restent facultatives.
export default function MyRecipeEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  const recipeId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [drafts, setDrafts] = useState<IngredientDraft[]>(() => [newDraft(), newDraft(), newDraft()]);
  const [steps, setSteps] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [kcal, setKcal] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const [recipeRes, ingRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id!).maybeSingle(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', id!).order('position'),
      ]);
      const r = recipeRes.data as Recipe | null;
      if (r) {
        setTitle(r.title);
        setMealType(r.meal_type ?? null);
        setSteps(r.steps ?? '');
        setProtein(r.protein_g?.toString() ?? '');
        setFat(r.fat_g?.toString() ?? '');
        setCarbs(r.carbs_g?.toString() ?? '');
        setKcal(r.kcal?.toString() ?? '');
      }
      const ings = (ingRes.data as RecipeIngredient[] | null) ?? [];
      if (ings.length > 0) {
        setDrafts(
          ings.map((i) =>
            newDraft({
              name: i.name,
              quantity: i.quantity === null ? '' : `${Number(i.quantity)}`.replace('.', ','),
              unit: i.unit,
            }),
          ),
        );
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) {
      Alert.alert(t('myRecipes.titleMissing'));
      return;
    }
    setSaving(true);
    try {
      const num = (s: string) => {
        const n = Number.parseInt(s.replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
      };
      const payload = {
        title: title.trim(),
        meal_type: mealType,
        steps: steps.trim() || null,
        ingredients: ingredientsToText(drafts, t) || null,
        protein_g: num(protein),
        fat_g: num(fat),
        carbs_g: num(carbs),
        kcal: num(kcal),
      };
      if (isNew) {
        const { error } = await supabase.from('recipes').insert({ id: recipeId, owner_id: user.id, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipes').update(payload).eq('id', recipeId);
        if (error) throw error;
      }
      await saveRecipeIngredients(recipeId, draftsToPayload(drafts));
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.saveImpossible'), e?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(t('myRecipes.deleteConfirmTitle'), t('myRecipes.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
          if (error) {
            Alert.alert(t('common.error'), error.message);
            return;
          }
          // Retour à la bibliothèque : la fiche de la recette supprimée n'existe plus.
          router.dismissTo('/my-recipes' as any);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  const field = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: Fonts.sans,
  };
  const mealOptions = MEAL_TYPES.map((m) => ({ value: m, label: t(MEAL_LABEL_KEYS[m]) }));

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
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {t('common.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {isNew ? t('myRecipes.newTitle') : t('myRecipes.editTitle')}
        </Text>

        <Field label={t('myRecipes.fieldTitle')} palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('myRecipes.titlePlaceholder')}
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, field]}
          />
        </Field>

        <Field label={t('myRecipes.fieldMeal')} palette={palette}>
          <View style={{ gap: Spacing.sm }}>
            <Segmented value={mealType} options={mealOptions.slice(0, 2)} onChange={setMealType} />
            <Segmented value={mealType} options={mealOptions.slice(2)} onChange={setMealType} />
          </View>
        </Field>

        <Field label={t('recipe.ingredients')} palette={palette}>
          <IngredientsEditor value={drafts} onChange={setDrafts} />
        </Field>

        <Field label={t('recipe.steps')} palette={palette}>
          <TextInput
            value={steps}
            onChangeText={setSteps}
            placeholder={t('myRecipes.stepsPlaceholder')}
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.textarea, field]}
          />
        </Field>

        <Field label={t('myRecipes.fieldMacros')} palette={palette}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <MacroInput label={t('myRecipes.protein')} value={protein} onChange={setProtein} palette={palette} field={field} />
            <MacroInput label={t('myRecipes.fats')} value={fat} onChange={setFat} palette={palette} field={field} />
            <MacroInput label={t('myRecipes.carbs')} value={carbs} onChange={setCarbs} palette={palette} field={field} />
            <MacroInput label={t('common.kcal')} value={kcal} onChange={setKcal} palette={palette} field={field} />
          </View>
        </Field>

        {!isNew && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>
              {t('myRecipes.delete')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, palette }: { label: string; children: React.ReactNode; palette: any }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 1.4 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function MacroInput({
  label,
  value,
  onChange,
  palette,
  field,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  palette: any;
  field: any;
}) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="—"
        placeholderTextColor={palette.textSecondary}
        keyboardType="number-pad"
        style={[styles.input, styles.macroInput, field]}
      />
      <Text numberOfLines={1} style={{ color: palette.textSecondary, fontFamily: Fonts.sans, fontSize: 11, textAlign: 'center' }}>
        {label}
      </Text>
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
  action: { fontSize: 15 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  input: { height: 52, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: 16 },
  macroInput: { paddingHorizontal: 4, textAlign: 'center' },
  textarea: {
    minHeight: 140,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#A8362A',
    marginTop: Spacing.lg,
  },
  dangerText: { color: Palette.albatre, fontSize: 15 },
});
