// Aujourd'hui — refonte de Shaï (nov. 2026, « BBY — Aujourd'hui.pdf »).
// Le mois en grand, la semaine, UNE carte jaune inclinée (ton geste de parcours,
// sinon ton intention posée hier soir, sinon l'accueil), puis « Ta journée » :
// séance, nutrition, rituels — cartes séparées, aucun score.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Play, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BbyScreen,
  BFont,
  Bby,
  Editorial,
  PhotoCard,
  PillButton,
  RoundButton,
  RowCard,
  SectionHeader,
  TiltCard,
  TopBar,
  WeekStrip,
  isoDay,
  weekOf,
} from '@/components/bby/kit';
import { AdminButton } from '@/components/ui/admin-button';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { useTodayMindset } from '@/lib/mindset/use-today-mindset';
import type { MealType } from '@/lib/types';
import { useTodaySession } from '@/lib/use-content';
import { useDayData } from '@/lib/use-day-data';
import { useMenu } from '@/lib/use-meal-plan';
import { useProfile } from '@/lib/use-profile';

const SLOTS: { key: MealType; hour: string; until: number }[] = [
  { key: 'petit_dejeuner', hour: '8 h', until: 10 },
  { key: 'dejeuner', hour: '12 h 30', until: 14.5 },
  { key: 'collation', hour: '16 h 30', until: 17.5 },
  { key: 'diner', hour: '19 h 30', until: 24 },
];

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function TodayScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { session, refresh: refreshSession } = useTodaySession();
  const { items: menu, refresh: refreshMenu } = useMenu();
  const { data: day, refresh: refreshDay } = useDayData();
  const mindset = useTodayMindset();
  const refreshMindset = mindset.refresh;

  // Les séances n'ont pas d'image propre : on montre celle de leur programme.
  const [sessionCover, setSessionCover] = useState<string | null>(null);
  const programId = session?.program_id ?? null;
  useEffect(() => {
    if (!programId) {
      setSessionCover(null);
      return;
    }
    let alive = true;
    supabase
      .from('programs')
      .select('cover_url')
      .eq('id', programId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setSessionCover((data as { cover_url: string | null } | null)?.cover_url ?? null);
      });
    return () => {
      alive = false;
    };
  }, [programId]);

  const today = useMemo(() => new Date(), []);
  const todayKey = isoDay(today);
  const [selected, setSelected] = useState(todayKey);
  const [anchor, setAnchor] = useState(today); // semaine affichée
  const [intentionDone, setIntentionDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshSession();
      refreshMenu();
      refreshDay();
      refreshMindset();
    }, [refreshSession, refreshMenu, refreshDay, refreshMindset]),
  );

  const intentionKey = `bby.intentionDone.${todayKey}`;
  useEffect(() => {
    AsyncStorage.getItem(intentionKey)
      .then((v) => setIntentionDone(v === '1'))
      .catch(() => {});
  }, [intentionKey]);

  const firstName = profile ? capitalize((profile.display_name || user?.email?.split('@')[0] || '').split(' ')[0]) : '';
  const letters = t('v2today.weekLetters', { returnObjects: true }) as unknown;
  const week = weekOf(anchor, Array.isArray(letters) && letters.length === 7 ? (letters as string[]) : undefined);
  const selDate = week.find((d) => d.key === selected)?.date ?? today;
  const month = capitalize(selDate.toLocaleDateString(i18n.language, { month: 'long' }));
  const dayLabel = capitalize(selDate.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' }));

  const shiftWeek = (n: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7 * n);
    setAnchor(d);
    const w = weekOf(d);
    setSelected(w.some((x) => x.key === todayKey) ? todayKey : w[0].key);
  };

  // --- Nutrition : prochain repas du menu pour le jour choisi -------------------
  const tracking = profile?.nutrition_tracking === true;
  const weekday = (selDate.getDay() + 6) % 7; // 0 = lundi
  const isToday = selected === todayKey;
  const now = new Date();
  const hourNow = now.getHours() + now.getMinutes() / 60;
  const slot = (isToday ? SLOTS.find((s) => hourNow < s.until) : SLOTS[1]) ?? SLOTS[3];
  const meal = menu.find((m) => m.day === weekday && m.meal_type === slot.key);
  const mealsLogged = (['petit_dejeuner', 'dejeuner', 'collation', 'diner'] as const).filter((k) => day.meals[k].logged).length;
  const hasMenu = menu.length > 0;

  // --- Rituels -----------------------------------------------------------------
  const r = mindset.ritualsCount;
  const isNewcomer = !mindset.loading && !mindset.gesture && r.total === 0 && !hasMenu;

  const doneBadge = (
    <View style={styles.doneBadge}>
      <Check size={18} color={Bby.ink} strokeWidth={2.6} />
      <Text style={styles.doneText}>{t('v2today.done')}</Text>
    </View>
  );

  // --- La carte jaune ----------------------------------------------------------
  let tilt: React.ReactNode;
  if (mindset.gesture) {
    const g = mindset.gesture;
    tilt = (
      <TiltCard>
        <Pressable onPress={() => router.push(`/mindset/day?program=${g.programId}` as any)} style={{ alignSelf: 'flex-start' }}>
          <View style={styles.tiltChip}>
            <Text style={styles.tiltChipText}>{t('v2today.programDay', { day: g.day, count: g.dayCount })}</Text>
          </View>
        </Pressable>
        <Text style={styles.tiltTitle}>{t('v2today.yourGesture')}</Text>
        <Text style={styles.tiltBody}>{g.text}</Text>
        <View style={styles.tiltFoot}>
          <Text style={styles.tiltSmall} numberOfLines={2}>
            {g.programTitle}
          </Text>
          {g.done ? doneBadge : <PillButton label={t('v2today.itsDone')} icon={Check} onPress={() => g.markDone()} />}
        </View>
      </TiltCard>
    );
  } else if (mindset.intention) {
    tilt = (
      <TiltCard>
        <View style={styles.tiltHead}>
          <Text style={[styles.tiltTitle, { marginTop: 0 }]}>{t('v2today.yourIntention')}</Text>
          <Text style={styles.tiltSmall}>{t('v2today.setLastNight')}</Text>
        </View>
        <Editorial dark style={{ fontSize: 26, lineHeight: 34, marginTop: 10 }}>
          {mindset.intention.text}
        </Editorial>
        <View style={[styles.tiltFoot, { justifyContent: 'flex-end' }]}>
          {intentionDone ? (
            doneBadge
          ) : (
            <PillButton
              label={t('v2today.itsDone')}
              icon={Check}
              onPress={() => {
                setIntentionDone(true);
                AsyncStorage.setItem(intentionKey, '1').catch(() => {});
              }}
            />
          )}
        </View>
      </TiltCard>
    );
  } else {
    tilt = (
      <TiltCard>
        <Text style={[styles.tiltTitle, { marginTop: 0 }]}>{t('v2today.welcome')}</Text>
        <Editorial dark style={{ fontSize: 26, lineHeight: 34, marginTop: 8 }}>
          {t('v2today.welcomeLine')}
        </Editorial>
        <PillButton
          label={isNewcomer ? t('v2today.chooseFirstSession') : t('v2today.chooseJourney')}
          icon={Plus}
          onPress={() => router.push((isNewcomer ? '/training' : '/mindset/programs') as any)}
          style={{ marginTop: 16 }}
        />
      </TiltCard>
    );
  }

  const goSession = () => router.push((session ? `/session/${session.id}` : '/training') as any);
  const goMeal = () => router.push((meal?.recipe ? `/recipe/${meal.recipe.id}` : '/nutrition') as any);
  const goRituals = () =>
    r.total ? router.navigate({ pathname: '/(tabs)/mindset', params: { filter: 'rituals' } } as any) : router.push('/mindset/rituals' as any);

  return (
    <BbyScreen>
      <TopBar name={firstName} onSettings={() => router.push('/account' as any)} />
      <AdminButton />

      <View style={styles.monthRow}>
        <Text style={styles.month} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {month}
        </Text>
        <View style={styles.arrows}>
          <Pressable onPress={() => shiftWeek(-1)} hitSlop={8} accessibilityLabel={t('v2today.prevWeek')} style={styles.arrow}>
            <ArrowLeft size={20} color={Bby.text} />
          </Pressable>
          <Pressable onPress={() => shiftWeek(1)} hitSlop={8} accessibilityLabel={t('v2today.nextWeek')} style={styles.arrow}>
            <ArrowRight size={20} color={Bby.text} />
          </Pressable>
        </View>
      </View>
      <WeekStrip days={week} selected={selected} onSelect={setSelected} />

      {tilt}

      {isNewcomer ? (
        <>
          <SectionHeader title={t('v2today.toStart')} />
          <PhotoCard
            label={t('v2today.session')}
            title={t('v2today.chooseProgram')}
            sub={t('v2today.chooseProgramSub')}
            button={<RoundButton icon={ArrowRight} variant="outline" onPress={() => router.push('/training' as any)} />}
            onPress={() => router.push('/training' as any)}
          />
          <PhotoCard
            label={t('v2today.nutrition')}
            title={t('v2today.choosePlan')}
            sub={t('v2today.choosePlanSub')}
            button={<RoundButton icon={ArrowRight} variant="outline" onPress={() => router.push('/nutrition' as any)} />}
            onPress={() => router.push('/nutrition' as any)}
          />
          <RowCard
            label={t('v2today.rituals')}
            title={t('v2today.firstRitual')}
            sub={t('v2today.firstRitualSub')}
            right={<RoundButton icon={ArrowRight} variant="outline" onPress={goRituals} />}
            onPress={goRituals}
          />
        </>
      ) : (
        <>
          <SectionHeader title={t('v2today.yourDay')} right={dayLabel} />
          <PhotoCard
            tone="light"
            label={t('v2today.sessionOfDay')}
            title={session?.title ?? t('v2today.nothingPlanned')}
            sub={session?.duration_min ? t('v2today.minutes', { count: session.duration_min }) : t('v2today.atYourPace')}
            photo={sessionCover}
            button={<RoundButton icon={Play} filled variant="black" size={64} label={t('v2today.sessionOfDay')} onPress={goSession} />}
            onPress={goSession}
          />
          <PhotoCard
            label={t('v2today.nutrition')}
            title={meal?.recipe?.title ?? t(`v2today.slot.${slot.key}`)}
            sub={
              tracking && isToday
                ? `${slot.hour} · ${t('v2today.mealsLogged', { done: mealsLogged, total: 4 })}`
                : meal?.recipe
                  ? `${t(`v2today.slot.${slot.key}`)} · ${slot.hour}`
                  : t('v2today.noMealPlanned')
            }
            photo={meal?.recipe?.cover_url}
            button={<RoundButton icon={ArrowRight} variant="outline" onPress={goMeal} />}
            onPress={goMeal}
          />
          <RowCard
            label={t('v2today.rituals')}
            title={r.total ? `${r.done} / ${r.total}` : t('v2today.firstRitual')}
            sub={r.total ? (r.next ? t('v2today.next', { name: r.next }) : t('v2today.allDone')) : t('v2today.firstRitualSub')}
            right={<RoundButton icon={ArrowRight} variant="outline" onPress={goRituals} />}
            onPress={goRituals}
          />
        </>
      )}
    </BbyScreen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  month: { fontFamily: BFont.display, fontSize: 50, color: Bby.text, letterSpacing: -1, flexShrink: 1 },
  arrows: { flexDirection: 'row', borderWidth: 1.5, borderColor: Bby.text, borderRadius: 999, height: 44, alignItems: 'center' },
  arrow: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  tiltChip: { borderWidth: 1.5, borderColor: Bby.ink, borderRadius: 999, paddingHorizontal: 14, height: 34, justifyContent: 'center' },
  tiltChipText: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.ink },
  tiltHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  tiltTitle: { fontFamily: BFont.display, fontSize: 28, color: Bby.ink, letterSpacing: -0.4, marginTop: 12 },
  tiltBody: { fontFamily: BFont.sans, fontSize: 19, lineHeight: 26, color: Bby.ink, marginTop: 10 },
  tiltFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 },
  tiltSmall: { fontFamily: BFont.sans, fontSize: 14, color: Bby.ink, flexShrink: 1 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 50, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1.5, borderColor: Bby.ink },
  doneText: { fontFamily: BFont.sansBold, fontSize: 16, color: Bby.ink },
});
