import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

import { addDays, DAY_FIELDS, dayKey, type JournalEntry, loc, type ParcoursDay, startOfDay } from './core';

// Journal privé : un « bilan du soir » par soir, plus les réponses des parcours.
// Visible par la cliente seule (RLS) ; rien n'est lu par la coach sans action
// explicite « En parler au Coach ».

export type DayInfo = { title: string | null; question: string | null; programTitle: string };

export function useJournal(programId?: string) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [dayInfo, setDayInfo] = useState<Record<string, DayInfo>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let q = supabase
      .from('mindset_entries')
      .select('*')
      .eq('user_id', user.id)
      .in('kind', ['bilan_du_soir', 'parcours', 'journal'])
      .order('created_at', { ascending: false })
      .limit(300);
    if (programId) q = q.eq('program_id', programId);
    const { data, error } = await q;
    if (error) console.warn('journal', error);
    const list = (data as JournalEntry[] | null) ?? [];
    setEntries(list);
    setDayInfo(await loadDayInfo(list));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, programId, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = dayKey();
  const yesterday = dayKey(addDays(startOfDay(), -1));
  const todayPage = useMemo(
    () => entries.find((e) => e.kind === 'bilan_du_soir' && dayKey(new Date(e.created_at)) === today) ?? null,
    [entries, today],
  );
  const yesterdayPage = useMemo(
    () => entries.find((e) => e.kind === 'bilan_du_soir' && dayKey(new Date(e.created_at)) === yesterday) ?? null,
    [entries, yesterday],
  );

  return { entries, dayInfo, loading, refresh, todayPage, yesterdayPage };
}

/** Titres des jours de parcours (et nom du parcours) pour les pages « Parcours ». */
export async function loadDayInfo(list: JournalEntry[]): Promise<Record<string, DayInfo>> {
  const ids = [...new Set(list.filter((e) => e.kind === 'parcours' && e.program_id).map((e) => e.program_id as string))];
  if (!ids.length) return {};
  const [steps, progs] = await Promise.all([
    supabase.from('mindset_program_steps').select('program_id, day_number, title, prompt_text, i18n').in('program_id', ids),
    supabase.from('mindset_programs').select('id, title, i18n').in('id', ids),
  ]);
  const titles: Record<string, string> = {};
  ((progs.data as { id: string; title: string; i18n: any }[] | null) ?? []).forEach((p) => (titles[p.id] = loc(p, ['title']).title));
  const map: Record<string, DayInfo> = {};
  ((steps.data as ParcoursDay[] | null) ?? []).forEach((s) => {
    const d = loc(s, DAY_FIELDS);
    map[`${s.program_id}:${s.day_number}`] = { title: d.title, question: d.prompt_text, programTitle: titles[s.program_id] ?? '' };
  });
  return map;
}

export function dayInfoKey(e: JournalEntry) {
  return `${e.program_id}:${e.program_day}`;
}

export function useJournalEntry(id: string | undefined) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [info, setInfo] = useState<DayInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('mindset_entries').select('*').eq('id', id).maybeSingle();
    const e = (data as JournalEntry | null) ?? null;
    setEntry(e);
    if (e?.kind === 'parcours') {
      const m = await loadDayInfo([e]);
      setInfo(m[dayInfoKey(e)] ?? null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(async () => {
    if (!id) return;
    const { error } = await supabase.from('mindset_entries').delete().eq('id', id);
    if (error) console.warn('delete page', error);
  }, [id]);

  return { entry, info, loading, refresh, remove };
}

export type BilanFields = {
  victories: string[];
  gratitude: string;
  tomorrow_intention: string;
  other_text: string;
  mood: string | null;
};

/** « Garder ma page » : crée ou met à jour le bilan du soir. */
export async function saveBilan(userId: string, id: string | null, f: BilanFields): Promise<string | null> {
  const row = {
    victories: f.victories.map((v) => v.trim()).filter(Boolean),
    gratitude: f.gratitude.trim() || null,
    tomorrow_intention: f.tomorrow_intention.trim() || null,
    other_text: f.other_text.trim() || null,
    mood: f.mood,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await supabase.from('mindset_entries').update(row).eq('id', id);
    if (error) {
      console.warn('save page', error);
      return null;
    }
    return id;
  }
  const { data, error } = await supabase
    .from('mindset_entries')
    .insert({ ...row, user_id: userId, kind: 'bilan_du_soir' })
    .select('id')
    .maybeSingle();
  if (error) console.warn('save page', error);
  return (data?.id as string) ?? null;
}

// Brouillon local, enregistré à la frappe (aucune zone n'est obligatoire).
const draftKey = (userId: string, ref: string) => `bby.mindset.draft.${userId}.${ref}`;

export async function readDraft(userId: string, ref: string): Promise<BilanFields | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(userId, ref));
    return raw ? (JSON.parse(raw) as BilanFields) : null;
  } catch {
    return null;
  }
}

export async function writeDraft(userId: string, ref: string, f: BilanFields) {
  try {
    await AsyncStorage.setItem(draftKey(userId, ref), JSON.stringify(f));
  } catch {
    // stockage indisponible : la page reste à l'écran
  }
}

export async function clearDraft(userId: string, ref: string) {
  try {
    await AsyncStorage.removeItem(draftKey(userId, ref));
  } catch {
    // rien
  }
}
