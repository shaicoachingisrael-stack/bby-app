import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Bell, BookOpen, Check, Clock, Droplet, PenLine, Play, Star, Utensils, Wind } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { AdminButton } from '@/components/ui/admin-button';
import { LanguageButton } from '@/components/ui/language-button';
import { IconBadge, IconTile, SectionLabel, TileCard, TileColors, TileText, type TileColor } from '@/components/ui/tiles';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { ritualIcon } from '@/lib/ritual-icons';
import { useMyCoaching } from '@/lib/use-coaching';
import { useRecipes, useTodaySession } from '@/lib/use-content';
import { useProfile } from '@/lib/use-profile';
import { useRituals } from '@/lib/use-rituals';

// Couleur des rituels pas encore cochés, dans l'ordre.
const RITUAL_COLORS: TileColor[] = ['rose', 'blue', 'violet', 'orange', 'mint'];

// Aujourd'hui (maquette « en tuiles ») : la séance du jour en grand, puis des
// carrés à grosse icône — j'ajoute, mes rituels, pour toi. Un ou deux mots par
// carré, aucun compteur de jours, aucune récompense.
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { session: todaySession, loading: sessionLoading, refresh: refreshToday } = useTodaySession();
  const { recipes, refresh: refreshRecipes } = useRecipes();
  const { rituals, checkedToday, loading: ritualsLoading, toggleCheck, refresh: refreshRituals } = useRituals();
  const { isClient: hasCoach, refresh: refreshCoaching } = useMyCoaching();

  useFocusEffect(
    useCallback(() => {
      refreshToday();
      refreshRecipes();
      refreshRituals();
      refreshCoaching();
    }, [refreshToday, refreshRecipes, refreshRituals, refreshCoaching]),
  );

  // Tant que le profil n'est pas là, pas de repli sur l'e-mail (sinon « Bonjour Appreview.bby » une seconde).
  const firstName = profile
    ? (profile.display_name || user?.email?.split('@')[0] || '').split(' ')[0]
    : '';
  const initial = (firstName || ' ')[0].toUpperCase();
  const dateLabel = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  // un repas ne s'enregistre que si le suivi nutrition est activé ; sinon le carré ouvre le menu
  const tracking = profile?.nutrition_tracking === true;
  const featuredRecipe = recipes[0];
  const doneCount = rituals.filter((r) => checkedToday.has(r.id)).length;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête : date + prénom, puis cloche et avatar */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{dateLabel.toUpperCase()}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.hello, { fontFamily: Fonts.displayBold }]}>
              {t('today.hello', { name: firstName ? capitalize(firstName) : '' }).replace(/,\s*$/, '')}
            </Text>
          </View>
          <AdminButton />
          <LanguageButton />
          <TileCard
            onPress={() => router.push('/notifications' as any)}
            accessibilityLabel="Notifications"
            radius={15}
            style={styles.square}
          >
            <Bell size={20} color={TileText.primary} strokeWidth={1.9} />
          </TileCard>
          <Pressable
            onPress={() => router.push('/account' as any)}
            hitSlop={8}
            style={styles.avatarRing}
            accessibilityLabel={t('account.title')}
          >
            <AccentFill />
            <View style={styles.avatarInner}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarInitial, { fontFamily: Fonts.displayBold }]}>{initial}</Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* La seule zone lumineuse de l'écran : la séance du jour */}
        <Pressable
          onPress={() => router.push((todaySession ? `/session/${todaySession.id}` : '/training') as any)}
          style={({ pressed }) => [styles.hero, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <AccentFill />
          <View pointerEvents="none" style={styles.heroDisc} />
          <View pointerEvents="none" style={styles.heroRing} />
          <View style={{ flex: 1 }}>
            <View style={styles.heroTag}>
              <Text style={[styles.heroTagText, { color: palette.onAccent }]}>
                {t('today.sessionOfDay').toUpperCase()}
              </Text>
            </View>
            <Text numberOfLines={2} style={[styles.heroTitle, { color: palette.onAccent, fontFamily: Fonts.displayBold }]}>
              {todaySession ? todaySession.title : sessionLoading ? ' ' : t('today.nothingPlanned')}
            </Text>
            {todaySession?.duration_min ? (
              <View style={styles.heroMeta}>
                <Clock size={15} color={palette.onAccent} strokeWidth={2.2} />
                <Text style={[styles.heroMetaText, { color: palette.onAccent }]}>{todaySession.duration_min} min</Text>
              </View>
            ) : !todaySession && !sessionLoading ? (
              <Text style={[styles.heroMetaText, { color: palette.onAccent, marginTop: 8 }]}>
                {t('today.nothingPlannedSub')}
              </Text>
            ) : null}
          </View>
          <View style={[styles.play, { backgroundColor: palette.onAccent }]}>
            <Play size={24} color={TileText.primary} fill={TileText.primary} style={{ marginLeft: 3 }} />
          </View>
        </Pressable>

        {/* J'ajoute : un geste */}
        <SectionLabel>{t('tiles.iAdd')}</SectionLabel>
        <View style={styles.row4}>
          <IconTile icon={Droplet} color="blue" label={t('tiles.water')} onPress={() => router.push('/hydration-log' as any)} />
          <IconTile
            icon={Utensils}
            color="orange"
            label={tracking ? t('tiles.meal') : t('tiles.menu')}
            onPress={() => router.push((tracking ? '/meal-log' : '/menu') as any)}
          />
          <IconTile icon={PenLine} color="violet" label={t('tiles.note')} onPress={() => router.push('/mindset-log' as any)} />
          <IconTile icon={Wind} color="mint" label={t('tiles.breathe')} onPress={() => router.push('/mindset/breathing' as any)} />
        </View>

        {/* Mes rituels : des ronds à toucher */}
        <SectionLabel right={rituals.length ? `${doneCount} / ${rituals.length}` : undefined}>
          {t('rituals.title')}
        </SectionLabel>
        <TileCard radius={24} style={styles.ritualCard}>
          {rituals.length === 0 && ritualsLoading ? (
            // Pendant le chargement : un emplacement neutre, pas « choisis tes rituels ».
            <View style={styles.ritualEmpty} />
          ) : rituals.length === 0 ? (
            <Pressable onPress={() => router.push('/mindset/rituals' as any)} style={styles.ritualEmpty}>
              <IconBadge icon={Star} color="rose" size={44} round />
              <Text style={styles.ritualEmptyText}>{t('today.noRituals')}</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ritualRow}>
              {rituals.map((r, i) => {
                const checked = checkedToday.has(r.id);
                const color = TileColors[RITUAL_COLORS[i % RITUAL_COLORS.length]];
                const Icon = ritualIcon(r.icon);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => toggleCheck(r.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={r.label}
                    style={styles.ritual}
                  >
                    {checked ? (
                      <IconBadge icon={Check} color="mint" size={52} round strokeWidth={2.6} iconSize={22} />
                    ) : (
                      <View style={[styles.ritualOpen, { borderColor: color.soft + '8C', backgroundColor: color.soft + '1A' }]}>
                        <Icon size={22} color={color.soft} strokeWidth={1.9} />
                      </View>
                    )}
                    <Text numberOfLines={2} style={styles.ritualLabel}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </TileCard>

        {/* Pour toi */}
        <SectionLabel>{t('today.forYou')}</SectionLabel>
        <View style={styles.row2}>
          {featuredRecipe ? (
            <TileCard
              radius={24}
              style={styles.wide}
              onPress={() => router.push(`/recipe/${featuredRecipe.id}` as any)}
              accessibilityLabel={featuredRecipe.title}
            >
              <IconBadge icon={BookOpen} color="orange" size={44} />
              <Text numberOfLines={2} style={styles.wideText}>
                {featuredRecipe.title}
              </Text>
            </TileCard>
          ) : null}
          <TileCard
            radius={24}
            style={styles.wide}
            onPress={() => router.push((hasCoach ? '/my-coach' : '/coaching-offer') as any)}
            accessibilityLabel={hasCoach ? t('coaching.myCoachTitle') : t('coachingOffer.discoverTitle')}
          >
            <IconBadge icon={Star} color="violet" size={44} />
            <Text numberOfLines={2} style={styles.wideText}>
              {hasCoach ? t('coaching.myCoachTitle') : t('coachingOffer.discoverTitle')}
            </Text>
          </TileCard>
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
  content: { paddingHorizontal: 20, paddingBottom: 140, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  hello: { fontSize: 30, letterSpacing: -0.5, color: TileText.primary, marginTop: 4 },
  square: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { width: 44, height: 44, borderRadius: 15, padding: 2, overflow: 'hidden' },
  avatarInner: {
    flex: 1,
    borderRadius: 13,
    backgroundColor: '#1A1020',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { fontSize: 17, color: TileText.primary },
  hero: {
    marginTop: 22,
    minHeight: 156,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  heroDisc: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroRing: {
    position: 'absolute',
    right: 40,
    top: -90,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(26,11,20,0.14)',
  },
  heroTagText: { fontSize: 11, letterSpacing: 1.2, fontFamily: Fonts.sansBold },
  heroTitle: { fontSize: 26, lineHeight: 28, letterSpacing: -0.4, marginTop: 10 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  heroMetaText: { fontSize: 13, fontFamily: Fonts.sansSemibold },
  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  row4: { flexDirection: 'row', gap: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  ritualCard: { paddingVertical: 14 },
  ritualRow: { paddingHorizontal: 4, gap: 0, flexGrow: 1, justifyContent: 'space-between' },
  ritual: { alignItems: 'center', gap: 7, width: 70 },
  ritualOpen: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualLabel: { fontSize: 11, lineHeight: 14, textAlign: 'center', color: TileText.secondary, fontFamily: Fonts.sansMedium },
  ritualEmpty: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14 },
  ritualEmptyText: { fontSize: 14, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  wide: { flex: 1, minHeight: 96, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  wideText: { flex: 1, fontSize: 14, lineHeight: 18, color: TileText.primary, fontFamily: Fonts.sansSemibold },
});
