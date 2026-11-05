import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, Check, History, Leaf, Moon, PenLine, Sparkles, Sun, Target, Wind } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationCard } from '@/components/ui/recommendation-card';
import { IconBadge, IconTile, SectionLabel, TileCard, TileText } from '@/components/ui/tiles';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMindsetContent } from '@/lib/use-content';
import { useDailyAffirmation } from '@/lib/use-daily-affirmation';
import { useDayData } from '@/lib/use-day-data';
import { useMindsetPrograms } from '@/lib/use-mindset-programs';
import { useRituals } from '@/lib/use-rituals';

const INTRO_VIDEO = require('@/assets/videos/intro.mp4');

const isVideo = (url: string | null | undefined) => !!url && /\.(mp4|mov|m4v)(\?|$)/i.test(url);

// Mindset (maquette « en tuiles ») : l'affirmation du jour en haut — la même pour
// toutes, selon la date locale —, puis six carrés « j'ai envie de ». Aucun compteur
// de jours, aucun historique chiffré.
export default function MindsetScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const { t } = useTranslation();
  const { data, refresh } = useDayData();
  const { items: mindsetItems, refresh: refreshMindset } = useMindsetContent();
  const { rituals, checkedToday, refresh: refreshRituals } = useRituals();
  const { affirmation: affirmationText, loading: affirmationLoading, refresh: refreshAffirmation } = useDailyAffirmation();
  const { programs, progress, refresh: refreshPrograms } = useMindsetPrograms();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshMindset();
      refreshRituals();
      refreshAffirmation();
      refreshPrograms();
    }, [refresh, refreshMindset, refreshRituals, refreshAffirmation, refreshPrograms]),
  );

  const activeProgram = programs.find((p) => progress[p.id] && !progress[p.id].completed_at);
  const showAffirmation = affirmationLoading || !!affirmationText;
  const ritualsDone = rituals.filter((r) => checkedToday.has(r.id)).length;
  const done = <IconBadge icon={Check} color="mint" size={18} round strokeWidth={3.5} iconSize={11} />;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{t('tiles.careForYou').toUpperCase()}</Text>
        <Text style={[styles.title, { fontFamily: Fonts.displayBold }]}>{t('mindset.title')}</Text>

        {/* L'affirmation du jour */}
        {showAffirmation ? (
          <View style={styles.affirmation}>
            <View pointerEvents="none" style={styles.affGlow} />
            <View style={styles.affHead}>
              <IconBadge icon={Sparkles} color="violet" size={28} iconSize={15} />
              <Text style={[styles.eyebrow, { color: TileText.secondary }]}>{t('tiles.myAffirmation').toUpperCase()}</Text>
            </View>
            {affirmationText ? (
              <Text style={[styles.affText, { fontFamily: Fonts.display }]}>{affirmationText}</Text>
            ) : null}
          </View>
        ) : null}

        {/* J'ai envie de : six carrés */}
        <SectionLabel>{t('tiles.iFeelLike')}</SectionLabel>
        <View style={styles.row3}>
          <IconTile icon={Wind} color="mint" size={52} label={t('tiles.breathe')} onPress={() => router.push('/mindset/breathing' as any)} />
          <IconTile
            icon={Moon}
            color="violet"
            size={52}
            label={t('tiles.meditate')}
            onPress={() => router.push('/mindset-log?kind=meditation_done' as any)}
          />
          <IconTile
            icon={PenLine}
            color="rose"
            size={52}
            label={t('tiles.journal')}
            onPress={() => router.push('/mindset/entries?kind=journal' as any)}
          />
        </View>
        <View style={[styles.row3, { marginTop: 10 }]}>
          <IconTile
            icon={Target}
            color="orange"
            size={52}
            label={t('tiles.intention')}
            onPress={() => router.push('/mindset-log?kind=intention' as any)}
            badge={data.mindset_intention ? done : undefined}
          />
          <IconTile
            icon={Sun}
            color="blue"
            size={52}
            label={t('tiles.rituals')}
            onPress={() => router.push('/mindset/rituals' as any)}
            badge={rituals.length > 0 && ritualsDone === rituals.length ? done : undefined}
          />
          <IconTile
            icon={Leaf}
            color="ember"
            size={52}
            label={t('tiles.journeys')}
            onPress={() =>
              router.push((activeProgram ? `/mindset/program/${activeProgram.id}` : '/mindset/programs') as any)
            }
          />
        </View>

        {/* Parcours en cours */}
        {activeProgram ? (
          <TileCard
            radius={22}
            style={styles.continue}
            onPress={() => router.push(`/mindset/program/${activeProgram.id}` as any)}
            accessibilityLabel={activeProgram.title}
          >
            <IconBadge icon={Leaf} color="ember" size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.continueEyebrow}>
                {t('programs.dayProgress', {
                  current: progress[activeProgram.id].current_day,
                  total: activeProgram.day_count,
                }).toUpperCase()}
              </Text>
              <Text numberOfLines={1} style={styles.continueTitle}>
                {activeProgram.title}
              </Text>
            </View>
          </TileCard>
        ) : null}

        {/* Favoris + notes */}
        <View style={[styles.row2, { marginTop: 10 }]}>
          <TileCard
            radius={18}
            style={styles.mini}
            onPress={() => router.push('/mindset/favorites' as any)}
            accessibilityLabel={t('tiles.favorites')}
          >
            <Bookmark size={18} color="#FF8DB5" strokeWidth={2} />
            <Text style={styles.miniText}>{t('tiles.favorites')}</Text>
          </TileCard>
          <TileCard
            radius={18}
            style={styles.mini}
            onPress={() => router.push('/mindset/history' as any)}
            accessibilityLabel={t('tiles.myNotes')}
          >
            <History size={18} color="#97D5FF" strokeWidth={2} />
            <Text style={styles.miniText}>{t('tiles.myNotes')}</Text>
          </TileCard>
        </View>

        {/* Explorer : les contenus publiés par Shy */}
        <SectionLabel>{t('mindset.explore')}</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.explore}
          contentContainerStyle={styles.exploreRow}
        >
          {mindsetItems.length === 0 ? (
            <RecommendationCard
              videoSource={INTRO_VIDEO}
              duration="—"
              title={t('common.comingSoon')}
              subtitle={t('today.placeholderTitle')}
            />
          ) : (
            mindsetItems.slice(0, 6).map((m) => (
              <RecommendationCard
                key={m.id}
                videoSource={isVideo(m.cover_url) ? m.cover_url : null}
                imageSource={isVideo(m.cover_url) ? null : (m.cover_url ?? null)}
                duration={m.duration_min ? `${m.duration_min} min` : '—'}
                title={m.title}
                subtitle={
                  m.kind === 'meditation'
                    ? t('mindset.kind.meditation')
                    : m.kind === 'article'
                      ? t('mindset.kind.article')
                      : t('mindset.kind.affirmation')
                }
                onPress={() => router.push(`/mindset/${m.id}` as any)}
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
  content: { paddingHorizontal: 20, paddingBottom: 140, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  title: { fontSize: 30, letterSpacing: -0.5, color: TileText.primary, marginTop: 4 },
  affirmation: {
    marginTop: 20,
    borderRadius: 28,
    padding: 20,
    paddingBottom: 22,
    overflow: 'hidden',
    backgroundColor: '#2C1540',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#7451EE',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  affGlow: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(201,179,255,0.18)',
  },
  affHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  affText: { marginTop: 14, fontSize: 22, lineHeight: 28, letterSpacing: -0.2, color: TileText.primary },
  row3: { flexDirection: 'row', gap: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  continue: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  continueEyebrow: { fontSize: 10, letterSpacing: 1.2, color: TileText.muted, fontFamily: Fonts.sansSemibold },
  continueTitle: { marginTop: 2, fontSize: 14, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  mini: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  miniText: { fontSize: 13, color: TileText.primary, fontFamily: Fonts.sansSemibold },
  explore: { marginHorizontal: -20 },
  exploreRow: { paddingHorizontal: 20, gap: 12 },
});
