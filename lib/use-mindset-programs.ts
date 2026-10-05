import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './auth-provider';
import { localize, localizeAll } from './localize';
import { supabase } from './supabase';
import type { MindsetProgram, MindsetProgramProgress, MindsetProgramStep } from './types';

// Catalogue des parcours + progression de l'utilisateur (map program_id -> progress).
export function useMindsetPrograms() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<MindsetProgram[]>([]);
  const [progress, setProgress] = useState<Record<string, MindsetProgramProgress>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [progRes, progressRes] = await Promise.all([
      supabase.from('mindset_programs').select('*').order('sort_order', { ascending: true }),
      user
        ? supabase.from('mindset_program_progress').select('*').eq('user_id', user.id)
        : Promise.resolve({ data: [] as MindsetProgramProgress[] }),
    ]);
    setPrograms(localizeAll(progRes.data as MindsetProgram[] | null, 'mindset_programs', i18n.language));
    const map: Record<string, MindsetProgramProgress> = {};
    ((progressRes.data as MindsetProgramProgress[] | null) ?? []).forEach((p) => { map[p.program_id] = p; });
    setProgress(map);
    setLoading(false);
  }, [i18n.language, user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { programs, progress, loading, refresh };
}

// Détail d'un parcours : programme + étapes + progression.
export function useMindsetProgram(id: string | undefined) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [program, setProgram] = useState<MindsetProgram | null>(null);
  const [steps, setSteps] = useState<MindsetProgramStep[]>([]);
  const [progress, setProgress] = useState<MindsetProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) { setProgram(null); setSteps([]); setProgress(null); setLoading(false); return; }
    setLoading(true);
    const [progRes, stepsRes, progressRes] = await Promise.all([
      supabase.from('mindset_programs').select('*').eq('id', id).maybeSingle(),
      supabase.from('mindset_program_steps').select('*').eq('program_id', id)
        .order('day_number', { ascending: true }).order('sort_order', { ascending: true }),
      user
        ? supabase.from('mindset_program_progress').select('*').eq('user_id', user.id).eq('program_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setProgram(localize(progRes.data as MindsetProgram | null, 'mindset_programs', i18n.language));
    setSteps(localizeAll(stepsRes.data as MindsetProgramStep[] | null, 'mindset_program_steps', i18n.language));
    setProgress((progressRes.data as MindsetProgramProgress | null) ?? null);
    setLoading(false);
  }, [id, i18n.language, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const start = useCallback(async () => {
    if (!user || !id) return;
    const { data, error } = await supabase
      .from('mindset_program_progress')
      .upsert(
        { user_id: user.id, program_id: id, current_day: 1, last_activity_at: new Date().toISOString() },
        { onConflict: 'user_id,program_id' },
      )
      .select()
      .maybeSingle();
    if (error) console.warn('start program', error);
    if (data) setProgress(data as MindsetProgramProgress);
  }, [user, id]);

  const completeDay = useCallback(async (day: number) => {
    if (!user || !id || !program || !progress) return;
    const next = day + 1;
    const done = next > program.day_count;
    const { data, error } = await supabase
      .from('mindset_program_progress')
      .update({
        current_day: done ? program.day_count : next,
        last_activity_at: new Date().toISOString(),
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq('id', progress.id)
      .select()
      .maybeSingle();
    if (error) console.warn('complete day', error);
    if (data) setProgress(data as MindsetProgramProgress);
  }, [user, id, program, progress]);

  return { program, steps, progress, loading, refresh, start, completeDay };
}
