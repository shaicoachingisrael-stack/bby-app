import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import type { RitualCatalogItem } from '@/lib/types';

import { addDays, dayKey, loc, type MyRitual, startOfDay } from './core';

// Rituels de la cliente + cases du jour. Les cases sont DÉRIVÉES de la date
// locale : rien n'est reporté d'un jour sur l'autre, aucun historique en score.
export function useMyRituals() {
  const { user } = useAuth();
  const [rituals, setRituals] = useState<MyRitual[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRituals([]);
      setChecked(new Set());
      setLoading(false);
      return;
    }
    const [r, c] = await Promise.all([
      supabase
        .from('mindset_user_rituals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('mindset_ritual_checks').select('ritual_id').eq('user_id', user.id).eq('check_date', dayKey()),
    ]);
    if (r.error) console.warn('rituals', r.error);
    setRituals((r.data as MyRitual[] | null) ?? []);
    setChecked(new Set(((c.data as { ritual_id: string }[] | null) ?? []).map((x) => x.ritual_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (ritualId: string) => {
      if (!user) return;
      const was = checked.has(ritualId);
      setChecked((prev) => {
        const n = new Set(prev);
        if (was) n.delete(ritualId);
        else n.add(ritualId);
        return n;
      });
      await setRitualChecked(user.id, ritualId, !was);
    },
    [user, checked],
  );

  const add = useCallback(
    async (f: { label: string; icon: string; catalogId?: string | null; anchor?: string | null }) => {
      if (!user || !f.label.trim()) return null;
      const { data, error } = await supabase
        .from('mindset_user_rituals')
        .insert({
          user_id: user.id,
          label: f.label.trim(),
          icon: f.icon,
          catalog_id: f.catalogId ?? null,
          anchor: f.anchor?.trim() || null,
          sort_order: rituals.length,
        })
        .select()
        .maybeSingle();
      if (error) console.warn('add ritual', error);
      await refresh();
      return (data as MyRitual | null) ?? null;
    },
    [user, rituals.length, refresh],
  );

  const update = useCallback(
    async (id: string, f: Partial<Pick<MyRitual, 'label' | 'icon' | 'anchor'>>) => {
      const { error } = await supabase.from('mindset_user_rituals').update(f).eq('id', id);
      if (error) console.warn('update ritual', error);
      await refresh();
    },
    [refresh],
  );

  /** « Retirer de ma liste » : archive, l'historique des cases est gardé. */
  const archive = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('mindset_user_rituals').update({ is_active: false }).eq('id', id);
      if (error) console.warn('archive ritual', error);
      await refresh();
    },
    [refresh],
  );

  const done = rituals.filter((r) => checked.has(r.id)).length;
  const next = rituals.find((r) => !checked.has(r.id)) ?? null;

  return { rituals, checked, loading, refresh, toggle, add, update, archive, done, total: rituals.length, next };
}

export async function setRitualChecked(userId: string, ritualId: string, on: boolean) {
  const today = dayKey();
  if (on) {
    const { data } = await supabase
      .from('mindset_ritual_checks')
      .select('id')
      .eq('user_id', userId)
      .eq('ritual_id', ritualId)
      .eq('check_date', today)
      .limit(1)
      .maybeSingle();
    if (data) return;
    const { error } = await supabase.from('mindset_ritual_checks').insert({ user_id: userId, ritual_id: ritualId, check_date: today });
    if (error) console.warn('check ritual', error);
  } else {
    const { error } = await supabase
      .from('mindset_ritual_checks')
      .delete()
      .eq('user_id', userId)
      .eq('ritual_id', ritualId)
      .eq('check_date', today);
    if (error) console.warn('uncheck ritual', error);
  }
}

/** Détail d'un rituel : jours faits cette semaine et ce mois-ci (aucun jour manqué n'est montré). */
export function useRitualDetail(id: string | undefined) {
  const { user } = useAuth();
  const [ritual, setRitual] = useState<MyRitual | null>(null);
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    const since = dayKey(addDays(startOfDay(), -40));
    const [r, c] = await Promise.all([
      supabase.from('mindset_user_rituals').select('*').eq('id', id).maybeSingle(),
      supabase.from('mindset_ritual_checks').select('check_date').eq('user_id', user.id).eq('ritual_id', id).gte('check_date', since),
    ]);
    setRitual((r.data as MyRitual | null) ?? null);
    setDates(new Set(((c.data as { check_date: string }[] | null) ?? []).map((x) => x.check_date)));
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = startOfDay();
  const todayKey = dayKey(today);
  const doneToday = dates.has(todayKey);

  // Semaine du lundi au dimanche.
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  let week = 0;
  for (let i = 0; i < 7; i++) if (dates.has(dayKey(addDays(monday, i)))) week++;

  // Mois : jours faits / jours écoulés depuis le début du mois (ou l'ajout du rituel).
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const created = ritual ? startOfDay(new Date(ritual.created_at)) : monthStart;
  const from = created > monthStart ? created : monthStart;
  const elapsed = Math.max(1, Math.round((today.getTime() - from.getTime()) / 86400000) + 1);
  let month = 0;
  for (let i = 0; i < elapsed; i++) if (dates.has(dayKey(addDays(from, i)))) month++;

  const toggleToday = useCallback(async () => {
    if (!user || !id) return;
    const on = !dates.has(todayKey);
    setDates((prev) => {
      const n = new Set(prev);
      if (on) n.add(todayKey);
      else n.delete(todayKey);
      return n;
    });
    await setRitualChecked(user.id, id, on);
  }, [user, id, dates, todayKey]);

  return { ritual, loading, refresh, doneToday, week, month, elapsed, toggleToday };
}

/** Catalogue BBY (éditorial, traduit). */
export function useCatalog() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<RitualCatalogItem[]>([]);
  const refresh = useCallback(async () => {
    const { data } = await supabase.from('mindset_ritual_catalog').select('*').order('sort_order', { ascending: true });
    setItems(((data as RitualCatalogItem[] | null) ?? []).map((x) => loc(x, ['label'])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { items, refresh };
}
