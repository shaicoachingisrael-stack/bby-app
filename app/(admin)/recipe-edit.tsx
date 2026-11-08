import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { IngredientsEditor } from '@/components/ui/ingredients-editor';
import { MediaList } from '@/components/ui/media-list';
import { MediaUploader } from '@/components/ui/media-uploader';
import { draftsToPayload, IngredientDraft, ingredientsToText, newDraft } from '@/lib/ingredients';
import { supabase } from '@/lib/supabase';
import { translateMissingIngredientNames, triggerTranslate } from '@/lib/translate-content';
import type { Recipe, RecipeIngredient } from '@/lib/types';
import { saveRecipeIngredients } from '@/lib/use-meal-plan';

type Meal = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation';
const MEAL_OPTIONS: { key: Meal; label: string }[] = [
  { key: 'petit_dejeuner', label: 'Petit-déj' },
  { key: 'dejeuner', label: 'Déjeuner' },
  { key: 'diner', label: 'Dîner' },
  { key: 'collation', label: 'Snack' },
];

// Fiche d'une recette BBY : ce que la cliente voit dans Nutrition › Recettes.
export default function RecipeEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
  // Ingrédients structurés (nom + quantité + unité) : ils alimentent la liste de courses.
  const [drafts, setDrafts] = useState<IngredientDraft[]>(() => [newDraft(), newDraft(), newDraft()]);
  const [steps, setSteps] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // « Quitter sans enregistrer ? » : comparaison avec les valeurs chargées.
  const snapshot = () =>
    JSON.stringify([
      title,
      description,
      mealType,
      prepMin,
      kcal,
      protein,
      carbs,
      fat,
      drafts.map((d) => [d.name, d.quantity, d.unit]),
      steps,
      coverUrl,
      videoUrl,
    ]);
  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);
  useEffect(() => {
    if (!loading && initial.current === null) initial.current = snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
        setSteps(r.steps ?? '');
        setCoverUrl(r.cover_url ?? '');
        setVideoUrl(r.video_url ?? '');
      }
      const ingRes = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', id!).order('position');
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
    if (!title.trim()) {
      Alert.alert('Il manque le titre', 'Donne un nom à ta recette avant d’enregistrer.');
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
        // champ texte régénéré : repli d'affichage + source de la traduction automatique
        ingredients: ingredientsToText(drafts, t) || null,
        steps: steps.trim() || null,
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
      await saveRecipeIngredients(recipeId, draftsToPayload(drafts));
      triggerTranslate('recipes', recipeId);
      void translateMissingIngredientNames();
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer cette recette ?', 'Elle disparaîtra de l’app pour toutes les clientes. Action définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('recipes').delete().eq('id', id!);
            if (error) throw error;
            leaving.current = true;
            router.back();
          } catch (e: any) {
            Alert.alert('Suppression impossible', e?.message ?? 'Réessaie dans un instant.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Check}
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={handleSave}
          disabled={saving}
          note="Traduit automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title={isNew ? 'Nouvelle recette' : 'La recette'}
          intro="Ce que la cliente voit dans Nutrition › Recettes, et sur la fiche de la recette."
        />

        <AdminField label="Titre" hint="Le grand titre de la fiche et de la liste des recettes.">
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Bowl protéiné saumon" />
        </AdminField>

        <AdminField label="Description" hint="Une phrase sous le titre de la fiche. Facultatif.">
          <AdminInput value={description} onChangeText={setDescription} placeholder="Ex : Vert, doux et crémeux." multiline />
        </AdminField>

        <AdminField label="Type de repas" hint="Sert aux filtres (Petit-déj, Déjeuner…) et au menu de la semaine.">
          <AdminChoice options={MEAL_OPTIONS} value={mealType} onChange={setMealType} />
        </AdminField>

        <AdminField label="Photo" hint="En haut de la fiche et dans la liste des recettes.">
          <MediaUploader
            kind="image"
            bucket="recipe-media"
            pathPrefix={`${recipeId}/cover`}
            url={coverUrl || null}
            onChange={(u) => setCoverUrl(u ?? '')}
          />
        </AdminField>

        <AdminField label="Vidéo principale" hint="Sur la fiche de la recette. Facultatif.">
          <MediaUploader
            kind="video"
            bucket="recipe-media"
            pathPrefix={`${recipeId}/video`}
            url={videoUrl || null}
            onChange={(u) => setVideoUrl(u ?? '')}
          />
        </AdminField>

        <AdminField label="Vidéos supplémentaires" hint="Ajoutées tout de suite, sans attendre « Enregistrer ».">
          <MediaList parentType="recipe" parentId={recipeId} bucket="recipe-media" />
        </AdminField>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AdminField label="Temps (min)" hint="« 20 min » sur la fiche.">
              <AdminInput value={prepMin} onChangeText={setPrepMin} placeholder="20" keyboardType="number-pad" />
            </AdminField>
          </View>
          <View style={{ flex: 1 }}>
            <AdminField label="Calories" hint="« Environ … kcal ».">
              <AdminInput value={kcal} onChangeText={setKcal} placeholder="620" keyboardType="number-pad" />
            </AdminField>
          </View>
        </View>

        <AdminField label="Par portion (en grammes)" hint="Les tuiles jaunes Protéines · Lipides · Glucides de la fiche.">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AdminField label="Protéines">
                <AdminInput value={protein} onChangeText={setProtein} placeholder="42" keyboardType="number-pad" />
              </AdminField>
            </View>
            <View style={{ flex: 1 }}>
              <AdminField label="Lipides">
                <AdminInput value={fat} onChangeText={setFat} placeholder="20" keyboardType="number-pad" />
              </AdminField>
            </View>
            <View style={{ flex: 1 }}>
              <AdminField label="Glucides">
                <AdminInput value={carbs} onChangeText={setCarbs} placeholder="55" keyboardType="number-pad" />
              </AdminField>
            </View>
          </View>
        </AdminField>

        <AdminField
          label="Ingrédients"
          hint="Quantité, unité (touche la pastille pour la changer), puis le nom. Ils remplissent aussi la liste de courses."
        >
          <IngredientsEditor value={drafts} onChange={setDrafts} />
        </AdminField>

        <AdminField label="Préparation" hint="Une étape par ligne : elles s’affichent numérotées sur la fiche.">
          <AdminInput big value={steps} onChangeText={setSteps} placeholder={'Mets tous les ingrédients dans le blender.\nMixe 1 minute.'} />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer cette recette" onPress={handleDelete} danger /> : null}
      </View>
    </FooterScreen>
  );
}
