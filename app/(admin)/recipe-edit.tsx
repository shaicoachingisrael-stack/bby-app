import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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

import { MediaList } from '@/components/ui/media-list';
import { MediaUploader } from '@/components/ui/media-uploader';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types';

const MEAL_OPTIONS = [
  { value: 'petit_dejeuner', label: 'Petit-déj' },
  { value: 'dejeuner', label: 'Déjeuner' },
  { value: 'diner', label: 'Dîner' },
  { value: 'collation', label: 'Collation' },
] as const;

type Meal = (typeof MEAL_OPTIONS)[number]['value'];

export default function RecipeEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  const recipeId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState<Meal | null>(null);
  const [prepMin, setPrepMin] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('recipes').select('*').eq('id', id!).maybeSingle();
      if (error) console.warn('recipe fetch', error);
      if (data) {
        const r = data as Recipe;
        setTitle(r.title);
        setDescription(r.description ?? '');
        setMealType((r.meal_type as Meal) ?? null);
        setPrepMin(r.prep_min?.toString() ?? '');
        setKcal(r.kcal?.toString() ?? '');
        setProtein(r.protein_g?.toString() ?? '');
        setCarbs(r.carbs_g?.toString() ?? '');
        setFat(r.fat_g?.toString() ?? '');
        setIngredients(r.ingredients ?? '');
        setCoverUrl(r.cover_url ?? '');
        setVideoUrl(r.video_url ?? '');
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Titre manquant');
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
        description: description.trim() || null,
        meal_type: mealType,
        prep_min: num(prepMin),
        kcal: num(kcal),
        protein_g: num(protein),
        carbs_g: num(carbs),
        fat_g: num(fat),
        ingredients: ingredients.trim() || null,
        cover_url: coverUrl?.trim() || null,
        video_url: videoUrl?.trim() || null,
      };
      if (isNew) {
        const { error } = await supabase.from('recipes').insert({ id: recipeId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipes').update(payload).eq('id', id!);
        if (error) throw error;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer cette recette ?', 'Action définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('recipes').delete().eq('id', id!);
            if (error) throw error;
            router.back();
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
          }
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              Enregistrer
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
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {isNew ? 'Nouvelle recette' : 'Modifier la recette'}
        </Text>

        <Field label="Titre" palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Bowl protéiné saumon"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Description" palette={palette}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optionnel"
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.textarea, inputStyle(palette)]}
          />
        </Field>

        <Field label="Type de repas" palette={palette}>
          <View style={{ gap: Spacing.sm }}>
            <Segmented
              value={mealType}
              options={MEAL_OPTIONS.slice(0, 2) as any}
              onChange={(v: Meal) => setMealType(v)}
            />
            <Segmented
              value={mealType}
              options={MEAL_OPTIONS.slice(2) as any}
              onChange={(v: Meal) => setMealType(v)}
            />
          </View>
        </Field>

        <Field label="Image de couverture" palette={palette}>
          <MediaUploader
            kind="image"
            bucket="recipe-media"
            pathPrefix={`${recipeId}/cover`}
            url={coverUrl || null}
            onChange={(u) => setCoverUrl(u ?? '')}
          />
        </Field>

        <Field label="Vidéo principale (optionnel)" palette={palette}>
          <MediaUploader
            kind="video"
            bucket="recipe-media"
            pathPrefix={`${recipeId}/video`}
            url={videoUrl || null}
            onChange={(u) => setVideoUrl(u ?? '')}
          />
        </Field>

        <Field label="Vidéos supplémentaires" palette={palette}>
          <MediaList
            parentType="recipe"
            parentId={recipeId}
            bucket="recipe-media"
          />
        </Field>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Préparation (min)" palette={palette}>
              <TextInput
                value={prepMin}
                onChangeText={setPrepMin}
                placeholder="20"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Calories" palette={palette}>
              <TextInput
                value={kcal}
                onChangeText={setKcal}
                placeholder="620"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Protéines (g)" palette={palette}>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                placeholder="42"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Glucides (g)" palette={palette}>
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                placeholder="55"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Lipides (g)" palette={palette}>
              <TextInput
                value={fat}
                onChangeText={setFat}
                placeholder="20"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
        </View>

        <Field label="Ingrédients" palette={palette}>
          <TextInput
            value={ingredients}
            onChangeText={setIngredients}
            placeholder={'150 g de saumon\n100 g de riz\n1/2 avocat\n…'}
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.textarea, inputStyle(palette)]}
          />
        </Field>

        {!isNew && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>
              Supprimer la recette
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

function inputStyle(palette: any) {
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: Fonts.sans,
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  input: {
    height: 52, borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, fontSize: 16,
  },
  textarea: {
    minHeight: 100, borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.lg, fontSize: 15, lineHeight: 22, textAlignVertical: 'top',
  },
  danger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 52, borderRadius: Radius.md, backgroundColor: '#A8362A', marginTop: Spacing.lg,
  },
  dangerText: { color: Palette.albatre, fontSize: 15 },
});
