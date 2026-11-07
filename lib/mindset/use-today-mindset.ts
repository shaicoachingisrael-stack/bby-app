import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

import {
  addDays,
  DAY_FIELDS,
  dayKey,
  loc,
  PARCOURS_FIELDS,
  type MyRitual,
  type Parcours,
  type ParcoursDay,
  type ParcoursProgress,
  parcoursState,
  startOfDay,
} from './core';
import { ensureParcoursRitual, gestureText } from './use-parcours';
import { setRitualChecked } from './use-my-rituals';

export type TodayGesture = {
  programId: string;
  programTitle: string;
  day: number;
  dayCount: number;
  /** L'ancrage écrit par la cliente (jour 4), sinon le geste du jour. */
  text: string;
  done: boolean;
  markDone: () => Promise<void>;
};

export type TodayMindset = {
  loading: boolean;
  gesture: TodayGesture | null;
  intention: { text: string; from: 'hier soir' } | null;
  ritualsCount: { done: number; total: number; next: string | null };
  refresh: () => Promise<void>;
};

/**
 * Ce que l'onglet Mindset montre sur Aujourd'hui (écran 5) :
 * - le geste du parcours en cours (carte « Ton geste », bouton « C'est fait ») ;
 * - l'intention écrite hier soir dans le bilan du soir ;
 * - le compteur des rituels du jour « X / Y » et le prochain à faire.
 * Tout suit la date locale : les cases repartent de zéro chaque matin.
 */
export function useTodayMindset(): TodayMindset {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    program: Parcours;
    progress: ParcoursProgress;
    day: number;
    text: string;
    ritualId: string | null;
  } | null>(null);
  const [intention, setIntention] = useState<TodayMindset['intention']>(null);
  const [rituals, setRituals] = useState<MyRitual[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(null);
      setIntention(null);
      setRituals([]);
      setChecked(new Set());
      setLoading(false);
      return;
    }
    const today = startOfDay();
    const [progRes, ritRes, chkRes, pageRes] = await Promise.all([
      supabase
        .from('mindset_program_progress')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('last_activity_at', { ascending: false }),
      supabase
        .from('mindset_user_rituals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('mindset_ritual_checks').select('ritual_id').eq('user_id', user.id).eq('check_date', dayKey(today)),
      supabase
        .from('mindset_entries')
        .select('tomorrow_intention, created_at')
        .eq('user_id', user.id)
        .eq('kind', 'bilan_du_soir')
        .gte('created_at', addDays(today, -1).toISOString())
        .lt('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const ritualList = (ritRes.data as MyRitual[] | null) ?? [];
    setRituals(ritualList);
    setChecked(new Set(((chkRes.data as { ritual_id: string }[] | null) ?? []).map((x) => x.ritual_id)));

    const it = (pageRes.data as { tomorrow_intention: string | null } | null)?.tomorrow_intention?.trim();
    setIntention(it ? { text: it, from: 'hier soir' } : null);

    // Parcours en cours le plus récent… parmi les parcours structurés.
    let found: typeof state = null;
    for (const pr of (progRes.data as ParcoursProgress[] | null) ?? []) {
      const [p, d] = await Promise.all([
        supabase.from('mindset_programs').select('*').eq('id', pr.program_id).maybeSingle(),
        supabase.from('mindset_program_steps').select('*').eq('program_id', pr.program_id).order('day_number'),
      ]);
      const days = ((d.data as ParcoursDay[] | null) ?? []).map((x) => loc(x, DAY_FIELDS));
      if (!p.data || !days.some((x) => x.idea)) continue;
      const program = loc(p.data as Parcours, PARCOURS_FIELDS);
      const st = parcoursState(pr, program.day_count);
      const text = gestureText(pr, days.find((x) => x.day_number === st.day));
      if (!text) continue;
      const ritual = ritualList.find((r) => r.program_id === pr.program_id);
      found = { program, progress: pr, day: st.day, text, ritualId: ritual?.id ?? null };
      break;
    }
    setState(found);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Nouvelle journée : nouvelle lecture au retour au premier plan.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const markDone = useCallback(async () => {
    if (!user || !state || busy.current) return;
    busy.current = true;
    try {
      const id = state.ritualId ?? (await ensureParcoursRitual(user.id, state.program.id, state.text));
      if (!id) return;
      setChecked((prev) => new Set(prev).add(id));
      await setRitualChecked(user.id, id, true);
      await refresh();
    } finally {
      busy.current = false;
    }
  }, [user, state, refresh]);

  const done = rituals.filter((r) => checked.has(r.id)).length;
  const next = rituals.find((r) => !checked.has(r.id))?.label ?? null;

  const gesture: TodayGesture | null = state
    ? {
        programId: state.program.id,
        programTitle: state.program.title,
        day: state.day,
        dayCount: state.program.day_count,
        text: state.text,
        done: !!state.ritualId && checked.has(state.ritualId),
        markDone,
      }
    : null;

  return { loading, gesture, intention, ritualsCount: { done, total: rituals.length, next }, refresh };
}
