import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/text';

import { ActionBar, BFont, Bby, Editorial, MacroTiles, PillButton, PillTabs, SectionHeader } from '@/components/bby/kit';
import { Field, FieldLabel, FooterScreen, NavHeader, ScreenTitle, Stepper } from '@/components/bby/nutrition/ui';
import { useAuth } from '@/lib/auth-provider';
import { draftsToPayload, formatNumber, ingredientsToText, newDraft } from '@/lib/ingredients';
import { estimateMacros, useFoods } from '@/lib/nutrition/foods';
import { mealLabel, MEALS, unitLabel } from '@/lib/nutrition/format';
import { parseQuantityText } from '@/lib/nutrition/quantity';
import { kcalOf } from '@/lib/nutrition/targets';
import { supabase } from '@/lib/supabase';
import type { MealType, Recipe, RecipeIngredient } from '@/lib/types';
import { saveRecipeIngredients } from '@/lib/use-meal-plan';
import { inferExt, pickMedia, uploadMedia, type PickedFile } from '@/lib/upload';

type Line = { key: string; name: string; qty: string };
let seq = 0;
const line = (name = '', qty = ''): Line => ({ key: `l${(seq += 1)}`, name, qty });

// Écran 7 — Ta recette : créer ou modifier une recette personnelle. Seul le nom
// est obligatoire ; les macros sont estimées depuis les ingrédients, corrigeables
// à la main, et ne bloquent jamais l'enregistrement.
export default function MyRecipeEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = !id;
  const recipeId = useMemo(() => id ?? Crypto.randomUUID(), [id]);
  const foods = useFoods();

  const [title, setTitle] = useState('');
  const [meal, setMeal] = useState<MealType>('dejeuner');
  const [servings, setServings] = useState(2);
  const [lines, setLines] = useState<Line[]>(() => [line(), line(), line()]);
  const [steps, setSteps] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [manual, setManual] = useState(false);
  const [mP, setMP] = useState('');
  const [mL, setML] = useState('');
  const [mG, setMG] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const [rec, ings] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id!).maybeSingle(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', id!).order('position'),
      ]);
      const r = rec.data as (Recipe & { servings?: number | null }) | null;
      if (r) {
        setTitle(r.title);
        if (r.meal_type) setMeal(r.meal_type);
        setServings(r.servings ?? 1);
        setSteps(r.steps ?? '');
        setCover(r.cover_url);
        // Macros déjà enregistrées : on les garde telles quelles (saisie à la main).
        if (r.protein_g !== null || r.fat_g !== null || r.carbs_g !== null) {
          setManual(true);
          setMP(r.protein_g?.toString() ?? '');
          setML(r.fat_g?.toString() ?? '');
          setMG(r.carbs_g?.toString() ?? '');
        }
      }
      const list = (ings.data as RecipeIngredient[] | null) ?? [];
      if (list.length) {
        setLines(
          list.map((i) =>
            line(i.name, i.quantity === null ? '' : `${formatNumber(Number(i.quantity))}${i.unit ? ` ${unitLabel(t, i.unit)}` : ''}`),
          ),
        );
      }
      setLoading(false);
    })();
  }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = lines.map((l) => ({ name: l.name, ...parseQuantityText(l.qty) }));
  const est = estimateMacros(foods, parsed, servings);
  const num = (s: string) => {
    const n = Number(s.replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) && s.trim() !== '' ? Math.round(n) : null;
  };
  const macros = manual
    ? { p: num(mP), l: num(mL), g: num(mG) }
    : est.known > 0
      ? { p: est.protein, l: est.fat, g: est.carb }
      : { p: null, l: null, g: null };

  const startManual = () => {
    setMP(macros.p?.toString() ?? '');
    setML(macros.l?.toString() ?? '');
    setMG(macros.g?.toString() ?? '');
    setManual(true);
  };

  const setLine = (key: string, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const choosePhoto = async () => {
    try {
      const f = await pickMedia('image');
      if (f) {
        setPicked(f);
        setCover(f.uri);
      }
    } catch (e: any) {
      Alert.alert(t('v2nutrition.common.error'), e?.message ?? '');
    }
  };

  const save = async () => {
    if (!user || saving) return;
    if (!title.trim()) {
      Alert.alert(t('v2nutrition.edit.nameMissing'));
      return;
    }
    setSaving(true);
    try {
      const drafts = parsed
        .filter((p) => p.name.trim())
        .map((p) => newDraft({ name: p.name, quantity: p.quantity === null ? '' : `${p.quantity}`, unit: p.unit }));
      let coverUrl = cover && !picked ? cover : null;
      if (picked) {
        coverUrl = await uploadMedia('recipe-media', `user/${user.id}/${recipeId}.${inferExt(picked.mimeType, 'jpg')}`, picked);
      }
      const payload = {
        title: title.trim(),
        meal_type: meal,
        servings,
        steps: steps.trim() || null,
        ingredients: ingredientsToText(drafts, t) || null,
        protein_g: macros.p,
        fat_g: macros.l,
        carbs_g: macros.g,
        kcal: macros.p !== null || macros.l !== null || macros.g !== null ? Math.round(kcalOf(macros.p ?? 0, macros.l ?? 0, macros.g ?? 0)) : null,
        cover_url: coverUrl,
      };
      const res = isNew
        ? await supabase.from('recipes').insert({ id: recipeId, owner_id: user.id, ...payload })
        : await supabase.from('recipes').update(payload).eq('id', recipeId);
      if (res.error) throw res.error;
      await saveRecipeIngredients(recipeId, draftsToPayload(drafts));
      router.back();
    } catch (e: any) {
      Alert.alert(t('v2nutrition.edit.saveError'), e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert(t('v2nutrition.edit.deleteTitle'), t('v2nutrition.edit.deleteBody'), [
      { text: t('v2nutrition.common.cancel'), style: 'cancel' },
      {
        text: t('v2nutrition.edit.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
          if (error) return Alert.alert(t('v2nutrition.common.error'), error.message);
          router.dismissTo({ pathname: '/(tabs)/nutrition', params: { section: 'recettes', at: `${Date.now()}` } } as any);
        },
      },
    ]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  const labels: [string, string, string] = [t('v2nutrition.macro.protein'), t('v2nutrition.macro.fat'), t('v2nutrition.macro.carb')];

  return (
    <FooterScreen
      footer={<ActionBar icon={Check} label={t('v2nutrition.edit.save')} onPress={save} disabled={saving} trailing={saving ? <ActivityIndicator color={Bby.ink} /> : undefined} />}
    >
      <NavHeader />
      <ScreenTitle>{t('v2nutrition.edit.title')}</ScreenTitle>

      <FieldLabel>{t('v2nutrition.edit.name')}</FieldLabel>
      <Field value={title} onChangeText={setTitle} placeholder={t('v2nutrition.edit.namePlaceholder')} />

      <FieldLabel>{t('v2nutrition.edit.category')}</FieldLabel>
      <PillTabs items={MEALS.map((m) => ({ key: m, label: mealLabel(t, m) }))} value={meal} onChange={setMeal} />

      <Stepper
        label={t('v2nutrition.common.people', { count: servings })}
        onMinus={() => setServings((n) => Math.max(1, n - 1))}
        onPlus={() => setServings((n) => Math.min(20, n + 1))}
        minusDisabled={servings <= 1}
      />

      <FieldLabel>{t('v2nutrition.edit.ingredients')}</FieldLabel>
      {lines.map((l) => (
        <View key={l.key} style={s.lineRow}>
          <Field style={{ flex: 1 }} value={l.name} onChangeText={(v) => setLine(l.key, { name: v })} placeholder={t('v2nutrition.edit.ingredientPlaceholder')} />
          <Field style={{ width: 112 }} value={l.qty} onChangeText={(v) => setLine(l.key, { qty: v })} placeholder={t('v2nutrition.edit.qtyPlaceholder')} />
          {lines.length > 1 ? (
            <Pressable onPress={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('v2nutrition.edit.removeIngredient')}>
              <X size={18} color={Bby.muted} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <PillButton label={t('v2nutrition.edit.addIngredient')} icon={Plus} variant="outline" style={{ alignSelf: 'flex-start', height: 44 }} onPress={() => setLines((p) => [...p, line()])} />

      <FieldLabel>{t('v2nutrition.edit.steps')}</FieldLabel>
      <Field multiline value={steps} onChangeText={setSteps} placeholder={t('v2nutrition.edit.stepsPlaceholder')} />

      <Pressable onPress={choosePhoto} style={[s.photo, !cover && s.photoEmpty]} accessibilityRole="button" accessibilityLabel={t('v2nutrition.edit.addPhoto')}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={s.row8}>
            <Camera size={18} color={Bby.muted} />
            <Text style={s.photoText}>{t('v2nutrition.edit.addPhoto')}</Text>
          </View>
        )}
      </Pressable>

      <SectionHeader title={t('v2nutrition.edit.macrosTitle')} />
      {manual ? (
        <View style={s.tiles}>
          {[
            [mP, setMP],
            [mL, setML],
            [mG, setMG],
          ].map(([v, set], i) => (
            <View key={i} style={s.tile}>
              <Text style={s.tileLabel}>{labels[i]}</Text>
              <View style={s.tileRow}>
                <TextInput
                  value={v as string}
                  onChangeText={set as (s: string) => void}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={Bby.mutedOnLight}
                  style={s.tileInput}
                  accessibilityLabel={labels[i]}
                />
                <Text style={s.tileUnit}>{t('v2nutrition.common.g')}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <MacroTiles labels={labels} values={[macros.p ?? '—', macros.l ?? '—', macros.g ?? '—']} />
      )}
      <Editorial style={s.editorial}>{t('v2nutrition.edit.estimate')}</Editorial>
      {!manual && est.unknown > 0 && est.known > 0 ? <Text style={s.small}>{t('v2nutrition.edit.partial')}</Text> : null}
      <View style={s.row8}>
        {manual ? (
          <PillButton label={t('v2nutrition.edit.backToEstimate')} variant="outline" style={{ height: 44 }} onPress={() => setManual(false)} />
        ) : (
          <PillButton label={t('v2nutrition.edit.adjust')} variant="outline" style={{ height: 44 }} onPress={startManual} />
        )}
      </View>

      {!isNew ? (
        <Pressable onPress={remove} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 18 }}>
          <Text style={s.delete}>{t('v2nutrition.edit.delete')}</Text>
        </Pressable>
      ) : null}
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  row8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photo: { height: 120, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  photoEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Bby.line, height: 56 },
  photoText: { fontFamily: BFont.sansMedium, fontSize: 14, color: Bby.muted },
  editorial: { fontSize: 16, lineHeight: 22 },
  small: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
  delete: { fontFamily: BFont.sansMedium, fontSize: 14, color: Bby.muted, textDecorationLine: 'underline' },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: Bby.yellow, borderRadius: 18, padding: 12, minHeight: 110, justifyContent: 'space-between' },
  tileLabel: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.ink },
  tileRow: { flexDirection: 'row', alignItems: 'flex-end' },
  tileInput: { fontFamily: BFont.display, fontSize: 34, color: Bby.ink, flex: 1, padding: 0, borderBottomWidth: 1.5, borderBottomColor: Bby.ink },
  tileUnit: { fontFamily: BFont.display, fontSize: 16, color: Bby.ink, marginLeft: 2, marginBottom: 4 },
});
