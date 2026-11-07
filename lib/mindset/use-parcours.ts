import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

import {
  DAY_FIELDS,
  dayKey,
  isActive,
  KEPT_DAYS,
  loc,
  PARCOURS_FIELDS,
  type Parcours,
  type ParcoursDay,
  type ParcoursProgress,
  parcoursState,
  splitAnchor,
} from './core';

// ---------------------------------------------------------------------------
// Rituel du parcours : le geste du jour apparaît dans « Tes rituels » avec
// l'étiquette « Parcours · Jour 4/7 ». Un seul rituel actif par parcours.

export async function ensureParcoursRitual(userId: string, programId: string, text: string): Promise<string | null> {
  const { label, anchor } = splitAnchor(text);
  if (!label) return null;
  const { data: existing } = await supabase
    .from('mindset_user_rituals')
    .select('id')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from('mindset_user_rituals').update({ label, anchor }).eq('id', existing.id);
    return existing.id as string;
  }
  const { count } = await supabase
    .from('mindset_user_rituals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  const { data, error } = await supabase
    .from('mindset_user_rituals')
    .insert({ user_id: userId, label, anchor, icon: 'leaf', program_id: programId, sort_order: count ?? 0 })
    .select('id')
    .maybeSingle();
  if (error) console.warn('parcours ritual', error);
  return (data?.id as string) ?? null;
}

/** Texte du geste rappelé sur Aujourd'hui : l'ancrage de la cliente, sinon le geste du jour. */
export function gestureText(progress: ParcoursProgress | null, day: ParcoursDay | undefined) {
  return progress?.anchor?.trim() || day?.gesture?.trim() || '';
}

// ---------------------------------------------------------------------------
// Liste : seuls les parcours structurés (jours avec une « idée ») sont montrés.

export type ActiveParcours = {
  program: Parcours;
  progress: ParcoursProgress;
  day: number;
  dayTitle: string;
  lockedToday: boolean;
};

export function useParcoursList() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Parcours[]>([]);
  const [days, setDays] = useState<ParcoursDay[]>([]);
  const [progress, setProgress] = useState<Record<string, ParcoursProgress>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [progRes, daysRes, progressRes] = await Promise.all([
      supabase.from('mindset_programs').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('mindset_program_steps')
        .select('id, program_id, day_number, title, gesture, phase, minutes, i18n')
        .not('idea', 'is', null)
        .order('day_number', { ascending: true }),
      user
        ? supabase.from('mindset_program_progress').select('*').eq('user_id', user.id)
        : Promise.resolve({ data: [] as ParcoursProgress[] }),
    ]);
    const ds = ((daysRes.data as ParcoursDay[] | null) ?? []).map((d) => loc(d, DAY_FIELDS));
    const structured = new Set(ds.map((d) => d.program_id));
    setDays(ds);
    setPrograms(
      ((progRes.data as Parcours[] | null) ?? []).filter((p) => structured.has(p.id)).map((p) => loc(p, PARCOURS_FIELDS)),
    );
    const map: Record<string, ParcoursProgress> = {};
    ((progressRes.data as ParcoursProgress[] | null) ?? []).forEach((p) => (map[p.program_id] = p));
    setProgress(map);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = useMemo<ActiveParcours[]>(() => {
    return programs
      .filter((p) => isActive(progress[p.id]))
      .map((p) => {
        const pr = progress[p.id];
        const st = parcoursState(pr, p.day_count);
        const d = days.find((x) => x.program_id === p.id && x.day_number === st.day);
        return { program: p, progress: pr, day: st.day, dayTitle: d?.title ?? '', lockedToday: st.lockedToday };
      })
      .sort((a, b) => (b.progress.last_activity_at || '').localeCompare(a.progress.last_activity_at || ''));
  }, [programs, progress, days]);

  const toDiscover = useMemo(() => programs.filter((p) => !isActive(progress[p.id])), [programs, progress]);

  return { programs, days, progress, active, toDiscover, loading, refresh };
}

// ---------------------------------------------------------------------------
// Un parcours : fiche, jours, réponses, clôture.

export function useParcours(id: string | undefined) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [program, setProgram] = useState<Parcours | null>(null);
  const [days, setDays] = useState<ParcoursDay[]>([]);
  const [progress, setProgress] = useState<ParcoursProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const [progRes, daysRes, progressRes] = await Promise.all([
      supabase.from('mindset_programs').select('*').eq('id', id).maybeSingle(),
      supabase.from('mindset_program_steps').select('*').eq('program_id', id).order('day_number', { ascending: true }),
      user
        ? supabase.from('mindset_program_progress').select('*').eq('user_id', user.id).eq('program_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setProgram(progRes.data ? loc(progRes.data as Parcours, PARCOURS_FIELDS) : null);
    setDays(((daysRes.data as ParcoursDay[] | null) ?? []).map((d) => loc(d, DAY_FIELDS)));
    setProgress((progressRes.data as ParcoursProgress | null) ?? null);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, i18n.language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dayOf = useCallback((n: number) => days.find((d) => d.day_number === n), [days]);

  const patch = useCallback(
    async (fields: Partial<ParcoursProgress>) => {
      if (!progress) return null;
      const { data, error } = await supabase
        .from('mindset_program_progress')
        .update({ ...fields, last_activity_at: new Date().toISOString() })
        .eq('id', progress.id)
        .select()
        .maybeSingle();
      if (error) console.warn('parcours progress', error);
      if (data) setProgress(data as ParcoursProgress);
      return (data as ParcoursProgress | null) ?? null;
    },
    [progress],
  );

  /** « Commencer » (ou « Recommencer ») : jour 1, réponses vierges. */
  const start = useCallback(async () => {
    if (!user || !id) return;
    const { data, error } = await supabase
      .from('mindset_program_progress')
      .upsert(
        {
          user_id: user.id,
          program_id: id,
          current_day: 1,
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          completed_at: null,
          answers: {},
          anchor: null,
          backup: null,
          satisfaction_mark: null,
          kept: false,
          day_done_on: null,
        },
        { onConflict: 'user_id,program_id' },
      )
      .select()
      .maybeSingle();
    if (error) console.warn('start parcours', error);
    if (data) setProgress(data as ParcoursProgress);
    const first = dayOf(1);
    if (first?.gesture) await ensureParcoursRitual(user.id, id, first.gesture);
  }, [user, id, dayOf]);

  /** Brouillon de la réponse (enregistré à la frappe, privé). */
  const saveAnswer = useCallback(
    async (day: number, text: string) => {
      if (!progress) return;
      const answers = { ...(progress.answers ?? {}), [String(day)]: text };
      const fields: Partial<ParcoursProgress> = { answers };
      if (day === KEPT_DAYS.anchor) fields.anchor = text.trim() || null;
      if (day === KEPT_DAYS.backup) fields.backup = text.trim() || null;
      if (day === KEPT_DAYS.satisfaction_mark) fields.satisfaction_mark = text.trim() || null;
      await patch(fields);
    },
    [progress, patch],
  );

  /** « Terminer le jour » : le suivant s'ouvrira demain matin. */
  const finishDay = useCallback(
    async (day: number, answer: string) => {
      if (!user || !id || !program || !progress) return null;
      const done = day >= program.day_count;
      const answers = { ...(progress.answers ?? {}), [String(day)]: answer };
      const fields: Partial<ParcoursProgress> = {
        answers,
        current_day: done ? program.day_count : Math.max(progress.current_day, day + 1),
        day_done_on: dayKey(),
        completed_at: done ? new Date().toISOString() : null,
      };
      if (day === KEPT_DAYS.anchor) fields.anchor = answer.trim() || null;
      if (day === KEPT_DAYS.backup) fields.backup = answer.trim() || null;
      if (day === KEPT_DAYS.satisfaction_mark) fields.satisfaction_mark = answer.trim() || null;
      const next = await patch(fields);

      // La réponse rejoint le journal (« Parcours · Écouter sa faim »).
      if (answer.trim()) await upsertParcoursPage(user.id, id, day, answer.trim());

      // Le geste rappelé dans les rituels suit le jour suivant (ou l'ancrage).
      if (!done) {
        const text = gestureText(next, dayOf(day + 1));
        if (text) await ensureParcoursRitual(user.id, id, text);
      }
      return next;
    },
    [user, id, program, progress, patch, dayOf],
  );

  /** Correction des trois lignes du geste gardé (crayon de la clôture). */
  const saveKept = useCallback(
    async (f: { anchor: string; backup: string; satisfaction_mark: string }) => {
      if (!progress) return;
      const answers = {
        ...(progress.answers ?? {}),
        [String(KEPT_DAYS.anchor)]: f.anchor,
        [String(KEPT_DAYS.backup)]: f.backup,
        [String(KEPT_DAYS.satisfaction_mark)]: f.satisfaction_mark,
      };
      await patch({
        answers,
        anchor: f.anchor.trim() || null,
        backup: f.backup.trim() || null,
        satisfaction_mark: f.satisfaction_mark.trim() || null,
      });
    },
    [progress, patch],
  );

  /** « Garder ce rituel » : le geste devient un rituel permanent. */
  const keep = useCallback(async (anchorText?: string) => {
    if (!user || !id || !progress) return;
    const text = anchorText?.trim() || progress.anchor?.trim() || dayOf(KEPT_DAYS.anchor)?.gesture || program?.title || '';
    await ensureParcoursRitual(user.id, id, text);
    await patch({ kept: true });
  }, [user, id, progress, program, patch, dayOf]);

  /** La croix ferme sans garder : le geste du parcours quitte la liste (il reste récupérable). */
  const closeWithoutKeeping = useCallback(async () => {
    if (!user || !id || !progress || progress.kept) return;
    await supabase
      .from('mindset_user_rituals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('program_id', id)
      .eq('is_active', true);
  }, [user, id, progress]);

  const state = parcoursState(progress, program?.day_count ?? 7);

  return { program, days, progress, state, loading, refresh, dayOf, start, saveAnswer, finishDay, saveKept, keep, closeWithoutKeeping };
}

// ---------------------------------------------------------------------------

export async function upsertParcoursPage(userId: string, programId: string, day: number, body: string) {
  const { data: existing } = await supabase
    .from('mindset_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'parcours')
    .eq('program_id', programId)
    .eq('program_day', day)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from('mindset_entries').update({ body, updated_at: new Date().toISOString() }).eq('id', existing.id);
    return existing.id as string;
  }
  const { data, error } = await supabase
    .from('mindset_entries')
    .insert({ user_id: userId, kind: 'parcours', body, program_id: programId, program_day: day })
    .select('id')
    .maybeSingle();
  if (error) console.warn('parcours page', error);
  return (data?.id as string) ?? null;
}
