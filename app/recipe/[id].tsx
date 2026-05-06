import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ChevronLeft, Clock, Flame } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentCarousel } from '@/components/ui/attachment-carousel';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAttachments } from '@/lib/use-attachments';
import { useRecipe } from '@/lib/use-content';

const MEAL_LABELS: Record<string, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { recipe, loading } = useRecipe(id);
  const { items: attachments, refresh: refreshAttachments } = useAttachments(
    'recipe',
    id,
  );

  useFocusEffect(useCallback(() => { refreshAttachments(); }, [refreshAttachments]));

  const heroVideoSource = recipe?.video_url ?? null;
  const heroImageSource = !heroVideoSource ? recipe?.cover_url ?? null : null;

  const player = useVideoPlayer(heroVideoSource, (p) => {
    if (heroVideoSource) {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  });

  if (loading && !recipe) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[{ color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Recette introuvable.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={styles.hero}>
        {heroVideoSource ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        ) : heroImageSource ? (
          <Image
            source={{ uri: heroImageSource }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.gray[300] }]} />
        )}
        <View style={styles.heroOverlay} />
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Palette.albatre, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ChevronLeft size={20} color={Palette.encre} />
          </Pressable>
        </View>
        <View style={styles.heroTitleBlock}>
          <Text style={styles.heroEyebrow}>
            {recipe.meal_type ? (MEAL_LABELS[recipe.meal_type] ?? recipe.meal_type).toUpperCase() : 'RECETTE'}
          </Text>
          <Text style={styles.heroTitle}>{recipe.title}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.background }]}>
        <View style={[styles.handle, { backgroundColor: palette.border }]} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
            <View style={styles.metaRow}>
              {recipe.prep_min ? (
                <Meta icon={Clock} label="Préparation" value={`${recipe.prep_min} min`} palette={palette} />
              ) : null}
              {recipe.kcal ? (
                <Meta icon={Flame} label="Apport" value={`${recipe.kcal} kcal`} palette={palette} />
              ) : null}
            </View>

            {/* Macros */}
            {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) ? (
              <View style={[styles.macros, { backgroundColor: palette.surface }]}>
                <MacroPill label="P" value={recipe.protein_g ?? 0} palette={palette} />
                <MacroPill label="L" value={recipe.fat_g ?? 0} palette={palette} />
                <MacroPill label="G" value={recipe.carbs_g ?? 0} palette={palette} />
              </View>
            ) : null}

            {recipe.description ? (
              <>
                <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                  Description
                </Text>
                <Text style={[styles.body, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {recipe.description}
                </Text>
              </>
            ) : null}

            {recipe.ingredients ? (
              <>
                <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>
                  Ingrédients
                </Text>
                <Text style={[styles.ingredients, { color: palette.text, fontFamily: Fonts.sans }]}>
                  {recipe.ingredients}
                </Text>
              </>
            ) : null}
          </View>

          <AttachmentCarousel attachments={attachments} title="Vidéos & étapes" />
        </ScrollView>

        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: palette.background }]}>
          <Pressable
            onPress={() => router.push(`/meal-log?type=${recipe.meal_type ?? 'dejeuner'}` as any)}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: palette.text, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
              Logger ce repas
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Meta({ icon: Icon, label, value, palette }: any) {
  return (
    <View style={[styles.metaCard, { backgroundColor: palette.surface }]}>
      <Icon size={18} color={palette.text} />
      <View>
        <Text style={[styles.metaLabel, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {label}
        </Text>
        <Text style={[styles.metaValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MacroPill({ label, value, palette }: any) {
  return (
    <View style={styles.macroPill}>
      <Text style={[styles.macroLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
        {label}
      </Text>
      <Text style={[styles.macroValue, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
        {value} g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    height: 420,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.28)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleBlock: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xxl,
  },
  heroEyebrow: {
    color: Palette.albatre,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  heroTitle: {
    color: Palette.albatre,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  sheet: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  metaLabel: { fontSize: 11 },
  metaValue: { fontSize: 14, marginTop: 2 },
  macros: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  macroPill: { flex: 1, alignItems: 'center' },
  macroLabel: { fontSize: 11, letterSpacing: 1.4 },
  macroValue: { fontSize: 16, marginTop: 4 },
  section: {
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  body: { fontSize: 14, lineHeight: 22 },
  ingredients: { fontSize: 14, lineHeight: 24 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  ctaButton: {
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
