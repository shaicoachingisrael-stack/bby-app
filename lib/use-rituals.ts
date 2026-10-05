import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './auth-provider';
import { localizeAll } from './localize';
import { supabase } from './supabase';
import type { RitualCatalogItem, UserRitual } from './types';

// Clé de date locale (YYYY-MM-DD) — le reset "à minuit" suit l'heure locale.
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Catalogue suggéré par la marque (auto-traduit).
export function useRitualCatalog() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<RitualCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mindset_ritual_catalog')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) console.warn('ritual_catalog fetch', error);
    setItems(localizeAll(data as RitualCatalogItem[] | null, 'mindset_ritual_catalog', i18n.language));
    setLoading(false);
  }, [i18n.language]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

// Rituels personnels de la cliente + coches du jour.
export function useRituals() {
  const { user } = useAuth();
  const [rituals, setRituals] = useState<UserRitual[]>([]);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRituals([]);
      setCheckedToday(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = localDateKey();
    const [ritualsRes, checksRes] = await Promise.all([
      supabase
        .from('mindset_user_rituals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('mindset_ritual_checks')
        .select('ritual_id')
        .eq('user_id', user.id)
        .eq('check_date', today),
    ]);
    if (ritualsRes.error) console.warn('user_rituals fetch', ritualsRes.error);
    if (checksRes.error) console.warn('ritual_checks fetch', checksRes.error);
    setRituals((ritualsRes.data as UserRitual[] | null) ?? []);
    setCheckedToday(new Set((checksRes.data ?? []).map((r) => r.ritual_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addRitual = useCallback(
    async (label: string, icon: string, catalogId: string | null) => {
      if (!user || !label.trim()) return;
      const { error } = await supabase.from('mindset_user_rituals').insert({
        user_id: user.id,
        label: label.trim(),
        icon,
        catalog_id: catalogId,
        sort_order: rituals.length,
      });
      if (error) console.warn('add ritual', error);
      await refresh();
    },
    [user, rituals.length, refresh],
  );

  const removeRitual = useCallback(
    async (ritualId: string) => {
      if (!user) return;
      // Soft-delete : on désactive pour garder l'historique des coches.
      const { error } = await supabase
        .from('mindset_user_rituals')
        .update({ is_active: false })
        .eq('id', ritualId);
      if (error) console.warn('remove ritual', error);
      await refresh();
    },
    [user, refresh],
  );

  const toggleCheck = useCallback(
    async (ritualId: string) => {
      if (!user) return;
      const today = localDateKey();
      const isChecked = checkedToday.has(ritualId);
      // Optimiste
      setCheckedToday((prev) => {
        const next = new Set(prev);
        if (isChecked) next.delete(ritualId);
        else next.add(ritualId);
        return next;
      });
      if (isChecked) {
        const { error } = await supabase
          .from('mindset_ritual_checks')
          .delete()
          .eq('user_id', user.id)
          .eq('ritual_id', ritualId)
          .eq('check_date', today);
        if (error) console.warn('uncheck ritual', error);
      } else {
        const { error } = await supabase
          .from('mindset_ritual_checks')
          .insert({ user_id: user.id, ritual_id: ritualId, check_date: today });
        if (error) console.warn('check ritual', error);
      }
    },
    [user, checkedToday],
  );

  return { rituals, checkedToday, loading, refresh, addRitual, removeRitual, toggleCheck };
}
