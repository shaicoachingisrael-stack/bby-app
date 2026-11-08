import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, UtensilsCrossed } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminHeader, a } from '@/components/bby/admin/ui';
import { BFont, BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { useRecipes } from '@/lib/use-content';

const MEAL_LABELS: Record<string, string> = {
  petit_dejeuner: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Snack',
};

// Liste des recettes BBY (Nutrition › Recettes).
export default function RecipesAdminScreen() {
  const router = useRouter();
  const { recipes, loading, refresh } = useRecipes();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Recettes"
          intro="Les recettes BBY de Nutrition › Recettes. Touche une recette pour la modifier."
        />
        <PillButton label="Créer une recette" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/recipe-edit' as any)} />
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : recipes.length === 0 ? (
          <Text style={a.hint}>Aucune recette pour l’instant. Crée la première.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {recipes.map((r) => {
              const top = [r.meal_type ? MEAL_LABELS[r.meal_type] ?? r.meal_type : null, r.prep_min ? `${r.prep_min} min` : null]
                .filter(Boolean)
                .join(' · ');
              const macros =
                r.protein_g != null || r.fat_g != null || r.carbs_g != null
                  ? `P ${r.protein_g ?? '–'} · L ${r.fat_g ?? '–'} · G ${r.carbs_g ?? '–'}${r.kcal ? ` · ${r.kcal} kcal` : ''}`
                  : 'Macros à compléter';
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/(admin)/recipe-edit?id=${r.id}` as any)}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
                >
                  {r.cover_url ? (
                    <Image source={{ uri: r.cover_url }} style={s.thumb} contentFit="cover" />
                  ) : (
                    <View style={[s.thumb, s.thumbEmpty]}>
                      <UtensilsCrossed size={20} color={Bby.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 3 }}>
                    {top ? <Text style={a.rowTop}>{top}</Text> : null}
                    <Text style={a.rowTitle} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <Text style={[a.rowSub, !r.cover_url && s.noPhoto]} numberOfLines={1}>
                      {r.cover_url ? macros : `${macros} · sans photo`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Bby.card, borderRadius: 20, padding: 12 },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden', backgroundColor: Bby.cardAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  noPhoto: { fontFamily: BFont.sans },
});
