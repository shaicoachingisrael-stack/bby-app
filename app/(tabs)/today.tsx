import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight, Leaf, Plus, Star, UtensilsCrossed, Wind } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { AdminButton } from '@/components/ui/admin-button';
import { DateStrip } from '@/components/ui/date-strip';
import { LanguageButton } from '@/components/ui/language-button';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { useRituals } from '@/lib/use-rituals';
import { useMyCoaching } from '@/lib/use-coaching';
import { useMindsetContent, useRecipes, useTodaySession } from '@/lib/use-content';
import { useProfile } from '@/lib/use-profile';

// Aujourd'hui (maquette Ember v2) : une seule grande action en haut, puis
// « Ma journée » (les rituels en puces + le « + » qui ajoute un repas, de l'eau
// ou une note), puis « Pour toi ». Aucun compteur de jours, aucune récompense.
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { session: todaySession, refresh: refreshToday } = useTodaySession();
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const { items: mindsetItems, refresh: refreshMindset } = useMindsetContent();
  const { rituals, checkedToday, toggleCheck, refresh: refreshRituals } = useRituals();
  const { isClient: hasCoach, refresh: refreshCoaching } = useMyCoaching();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refreshToday();
      refreshRecipes();
      refreshMindset();
      refreshRituals();
      refreshCoaching();
    }, [refreshToday, refreshRecipes, refreshMindset, refreshRituals, refreshCoaching]),
  );

  const firstName = (profile?.display_name || user?.email?.split('@')[0] || '').split(' ')[0];
  const initial = (firstName || '?')[0].toUpperCase();
  const dateLabel = capitalize(
    new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }),
  );
  const tracking = profile?.nutrition_tracking === true;

  // Le « + » de « Ma journée » : ajouter en deux gestes, depuis l'accueil.
  function handleAdd() {
    Alert.alert(t('today.addTitle'), undefined, [
      // un repas ne s'enregistre que si le suivi nutrition est activé
      ...(tracking ? [{ text: t('today.addMeal'), onPress: () => router.push('/meal-log' as any) }] : []),
      { text: t('today.addWater'), onPress: () => router.push('/hydration-log' as any) },
      { text: t('today.addNote'), onPress: () => router.push('/mindset-log' as any) },
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  }

  const featuredRecipe = recipes[0];
  const featuredMindset = mindsetItems[0];
  const macros = featuredRecipe
    ? [
        featuredRecipe.protein_g ? `P ${featuredRecipe.protein_g} g` : null,
        featuredRecipe.fat_g ? `L ${featuredRecipe.fat_g} g` : null,
        featuredRecipe.carbs_g ? `G ${featuredRecipe.carbs_g} g` : null,
      ].filter(Boolean)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.lg, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête : prénom + date à gauche, avatar à droite */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.hello, { color: palette.text, fontFamily: Fonts.displayBold }]}>
              {t('today.hello', { name: firstName ? capitalize(firstName) : '' }).replace(/,\s*$/, '')}
            </Text>
            <Text style={[styles.date, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {dateLabel}
            </Text>
          </View>
          <AdminButton />
          <LanguageButton />
          <Pressable
            onPress={() => router.push('/notifications' as any)}
            hitSlop={8}
            style={[styles.round, { backgroundColor: palette.surface }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={palette.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/account' as any)}
            hitSlop={8}
            style={styles.avatar}
            accessibilityLabel={t('account.title')}
          >
            <AccentFill />
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <Text style={[styles.avatarInitial, { color: palette.onAccent, fontFamily: Fonts.sansBold }]}>
                {initial}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={{ marginTop: Spacing.lg }}>
          <DateStrip value={selectedDate} onChange={setSelectedDate} />
        </View>

        {/* La seule zone lumineuse de l'écran : la séance du jour */}
        <Pressable
          onPress={() => router.push((todaySession ? `/session/${todaySession.id}` : '/training') as any)}
          style={({ pressed }) => [styles.hero, { opacity: pressed ? 0.92 : 1 }]}
        >
          <AccentFill />
          <View>
            <Text style={[styles.heroEyebrow, { color: palette.onAccent, fontFamily: Fonts.sansBold }]}>
              {t('today.sessionOfDay').toUpperCase()}
            </Text>
            <Text numberOfLines={3} style={[styles.heroTitle, { color: palette.onAccent, fontFamily: Fonts.displayBold }]}>
              {todaySession ? todaySession.title : t('today.nothingPlanned')}
            </Text>
            {!todaySession ? (
              <Text style={[styles.heroSub, { color: palette.onAccent, fontFamily: Fonts.sans }]}>
                {t('today.nothingPlannedSub')}
              </Text>
            ) : null}
          </View>
          <View style={styles.heroFoot}>
            <View style={[styles.heroCta, { backgroundColor: palette.onAccent }]}>
              <Text style={[styles.heroCtaText, { color: palette.text, fontFamily: Fonts.sansBold }]}>
                {todaySession ? t('today.ctaStart') : t('today.explore')}
              </Text>
            </View>
            {todaySession?.duration_min ? (
              <Text style={[styles.heroMeta, { color: palette.onAccent, fontFamily: Fonts.sansBold }]}>
                {todaySession.duration_min} min
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* Ma journée : rituels en puces, « + » pour ajouter */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.display }]}>
              {t('today.myDay')}
            </Text>
            <Pressable
              onPress={handleAdd}
              hitSlop={10}
              accessibilityLabel={t('today.addTitle')}
              style={[styles.plus, { backgroundColor: palette.text }]}
            >
              <Plus size={18} color={palette.background} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={styles.chips}>
            {rituals.map((r) => {
              const checked = checkedToday.has(r.id);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggleCheck(r.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  style={[
                    styles.chip,
                    checked
                      ? { borderColor: palette.done, backgroundColor: palette.accentSoft }
                      : { borderColor: palette.border },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: checked ? Fonts.sansSemibold : Fonts.sans,
                      color: checked ? palette.done : palette.textSecondary,
                    }}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
            {rituals.length === 0 ? (
              <Pressable
                onPress={() => router.push('/mindset/rituals' as any)}
                style={[styles.chip, { borderColor: palette.border }]}
              >
                <Text style={{ fontSize: 13, fontFamily: Fonts.sansMedium, color: palette.text }}>
                  {t('today.noRituals')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Coaching personnel : une ligne discrète, pas une seconde zone lumineuse */}
        <Pressable
          onPress={() => router.push((hasCoach ? '/my-coach' : '/coaching-offer') as any)}
          style={({ pressed }) => [
            styles.rowCard,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.thumb, { backgroundColor: palette.surfaceAlt }]}>
            <Star size={18} color={palette.text} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {hasCoach ? t('coaching.myCoachTitle') : t('coachingOffer.discoverTitle')}
            </Text>
            <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {hasCoach ? t('coaching.todayCardSub') : t('coachingOffer.discoverSub')}
            </Text>
          </View>
          <ChevronRight size={18} color={palette.textSecondary} />
        </Pressable>

        {/* Pour toi */}
        <View style={styles.sectionHead}>
          <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.display }]}>
            {t('today.forYou')}
          </Text>
        </View>
        <View style={styles.list}>
          {featuredRecipe ? (
            <Pressable
              onPress={() => router.push(`/recipe/${featuredRecipe.id}` as any)}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.thumb, { backgroundColor: palette.surfaceAlt }]}>
                {featuredRecipe.cover_url ? (
                  <Image source={{ uri: featuredRecipe.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                ) : (
                  <UtensilsCrossed size={18} color={palette.text} strokeWidth={1.8} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {featuredRecipe.title}
                </Text>
                <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {[t('today.recipeTag'), ...macros].join(' · ')}
                </Text>
              </View>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push('/mindset/breathing' as any)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.thumb, { backgroundColor: palette.surfaceAlt }]}>
              <Wind size={18} color={palette.text} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                {t('breathing.title')}
              </Text>
              <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                {t('breathing.subtitle')}
              </Text>
            </View>
          </Pressable>
          {featuredMindset ? (
            <Pressable
              onPress={() => router.push(`/mindset/${featuredMindset.id}` as any)}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.thumb, { backgroundColor: palette.surfaceAlt }]}>
                {featuredMindset.cover_url ? (
                  <Image source={{ uri: featuredMindset.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                ) : (
                  <Leaf size={18} color={palette.text} strokeWidth={1.8} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  {featuredMindset.title}
                </Text>
                <Text numberOfLines={1} style={[styles.rowSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                  {[
                    t(`mindset.kind.${featuredMindset.kind}`),
                    featuredMindset.duration_min ? `${featuredMindset.duration_min} min` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  hello: { fontSize: 26, letterSpacing: -0.6 },
  date: { fontSize: 13, marginTop: 2 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 16 },
  hero: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: 28,
    padding: Spacing.xl,
    minHeight: 190,
    justifyContent: 'space-between',
    gap: Spacing.xl,
    overflow: 'hidden',
  },
  heroEyebrow: { fontSize: 11, letterSpacing: 1.6, opacity: 0.75 },
  heroTitle: { fontSize: 30, lineHeight: 32, letterSpacing: -0.8, marginTop: 6 },
  heroSub: { fontSize: 14, marginTop: 6, opacity: 0.8 },
  heroFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCta: { borderRadius: Radius.pill, paddingHorizontal: 20, paddingVertical: 11 },
  heroCtaText: { fontSize: 14 },
  heroMeta: { fontSize: 14 },
  card: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, letterSpacing: -0.3 },
  plus: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  sectionHead: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  list: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
});
