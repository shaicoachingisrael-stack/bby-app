import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, Coffee, Cookie, Droplet, UtensilsCrossed } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MacrosSummary } from '@/components/macros-summary';
import { ActivityCard } from '@/components/ui/activity-card';
import { AdminButton } from '@/components/ui/admin-button';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { SessionCard } from '@/components/ui/session-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useRecipes } from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useProfile } from '@/lib/use-profile';

const NUTRITION_VIDEO = require('@/assets/videos/nutrition.mp4');
const INTRO_VIDEO = require('@/assets/videos/intro.mp4');

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data, refresh } = useDayData();
  const { recipes, refresh: refreshRecipes } = useRecipes();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshRecipes();
    }, [refresh, refreshRecipes]),
  );

  const featuredRecipe = recipes[0];
  const otherRecipes = recipes.slice(1, 5);

  const initial = (profile?.display_name || user?.email || '?')[0].toUpperCase();
  const target = profile?.daily_kcal_target ?? 1980;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: Spacing.xl }]}>
          <Pressable
            onPress={() => router.push('/account' as any)}
            hitSlop={8}
            style={styles.headerLeft}
          >
            <View style={[styles.avatar, { backgroundColor: palette.text }]}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <Text style={[styles.avatarInitial, { color: palette.background, fontFamily: Fonts.sansBold }]}>
                  {initial}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {data.meals.total_kcal} / {target} kcal
              </Text>
              <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                Nutrition
              </Text>
            </View>
          </Pressable>
          <AdminButton />
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            hitSlop={8}
            style={[styles.bell, { backgroundColor: palette.surface }]}
          >
            <Bell size={18} color={palette.text} />
          </Pressable>
        </View>

        <MacrosSummary />

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <SessionCard
            eyebrow={featuredRecipe ? 'RECETTE DU JOUR' : 'RECETTES'}
            title={featuredRecipe?.title ?? 'Bientôt'}
            subtitle={featuredRecipe?.description ?? 'Demande à ta coach de publier des recettes'}
            duration={featuredRecipe?.prep_min ? `${featuredRecipe.prep_min} min` : undefined}
            level={featuredRecipe?.kcal ? `${featuredRecipe.kcal} kcal` : undefined}
            videoSource={featuredRecipe ? featuredRecipe.video_url : NUTRITION_VIDEO}
            imageSource={featuredRecipe?.cover_url ?? null}
            onPress={() =>
              featuredRecipe
                ? router.push(`/meal-log?type=${featuredRecipe.meal_type ?? 'dejeuner'}` as any)
                : router.push('/meal-log' as any)
            }
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              Mes repas du jour
            </Text>
            <Pressable hitSlop={8} onPress={() => router.push('/meal-log' as any)}>
              <Text style={[styles.seeAll, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                Ajouter
              </Text>
            </Pressable>
          </View>
          <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
            <ActivityCard
              icon={Coffee}
              title="Petit-déjeuner"
              subtitle={
                data.meals.petit_dejeuner.logged
                  ? `${data.meals.petit_dejeuner.kcal} kcal · ${data.meals.petit_dejeuner.protein} g`
                  : 'Pas encore enregistré'
              }
              status={data.meals.petit_dejeuner.logged ? 'done' : 'pending'}
              onPress={() => router.push('/meal-log?type=petit_dejeuner' as any)}
            />
            <ActivityCard
              icon={UtensilsCrossed}
              title="Déjeuner"
              subtitle={
                data.meals.dejeuner.logged
                  ? `${data.meals.dejeuner.kcal} kcal · ${data.meals.dejeuner.protein} g`
                  : 'Pas encore enregistré'
              }
              status={data.meals.dejeuner.logged ? 'done' : 'pending'}
              onPress={() => router.push('/meal-log?type=dejeuner' as any)}
            />
            <ActivityCard
              icon={Cookie}
              title="Dîner"
              subtitle={
                data.meals.diner.logged
                  ? `${data.meals.diner.kcal} kcal · ${data.meals.diner.protein} g`
                  : 'Pas encore enregistré'
              }
              status={data.meals.diner.logged ? 'done' : 'pending'}
              onPress={() => router.push('/meal-log?type=diner' as any)}
            />
            <ActivityCard
              icon={Droplet}
              title="Hydratation"
              subtitle={`${data.hydration_ml} ml sur ${profile?.hydration_target_ml ?? 2500} ml`}
              status={
                data.hydration_ml >= (profile?.hydration_target_ml ?? 2500) ? 'done' : 'pending'
              }
              onPress={() => router.push('/hydration-log' as any)}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl }}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
            Idées recettes
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.md }}
        >
          {otherRecipes.length === 0 ? (
            <RecommendationCard
              videoSource={INTRO_VIDEO}
              duration="—"
              title="Bientôt"
              subtitle="Du contenu arrive"
            />
          ) : (
            otherRecipes.map((r) => (
              <RecommendationCard
                key={r.id}
                videoSource={r.video_url ?? null}
                imageSource={r.cover_url ?? null}
                duration={r.prep_min ? `${r.prep_min} min` : '—'}
                title={r.title}
                subtitle={r.kcal ? `${r.kcal} kcal` : 'Recette'}
                onPress={() => router.push(`/meal-log?type=${r.meal_type ?? 'dejeuner'}` as any)}
              />
            ))
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 18 },
  eyebrow: { fontSize: 13 },
  title: { fontSize: 22, letterSpacing: -0.4, marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 18, letterSpacing: -0.3 },
  seeAll: { fontSize: 13 },
});
