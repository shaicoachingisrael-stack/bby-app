import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';
import type { CoachingAssignment, CoachingAssignmentType, CoachingClient, CoachingConfig, CoachingPlan } from './types';

// Gestion de l'offre (pitch + formules) côté admin.
export function useCoachingOfferAdmin() {
  const [config, setConfig] = useState<CoachingConfig | null>(null);
  const [plans, setPlans] = useState<CoachingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: cfg }, { data: planRows }] = await Promise.all([
      supabase.from('coaching_config').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('coaching_plans').select('*').order('sort_order', { ascending: true }),
    ]);
    setConfig((cfg as CoachingConfig | null) ?? null);
    setPlans((planRows as CoachingPlan[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveConfig = useCallback(async (pitch: string, perks: string) => {
    const { error } = await supabase
      .from('coaching_config')
      .upsert({ id: 'default', pitch, perks, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) console.warn('save coaching config', error);
  }, []);

  const addPlan = useCallback(
    async (months: number, priceText: string, subtitle: string, highlighted: boolean) => {
      const { error } = await supabase.from('coaching_plans').insert({
        months,
        price_text: priceText,
        subtitle: subtitle || null,
        highlighted,
        sort_order: months,
      });
      if (error) console.warn('add plan', error);
      await refresh();
    },
    [refresh],
  );

  const removePlan = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('coaching_plans').delete().eq('id', id);
      if (error) console.warn('remove plan', error);
      await refresh();
    },
    [refresh],
  );

  return { config, plans, loading, refresh, saveConfig, addPlan, removePlan };
}

// Liste des clientes : celles en coaching perso (en tête) + toutes (pour en activer une).
export function useCoachingClients() {
  const [clients, setClients] = useState<CoachingClient[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, goal, is_personal_coaching, coaching_interest, coaching_note, coaching_started_at')
      .order('is_personal_coaching', { ascending: false })
      .order('coaching_interest', { ascending: false })
      .order('display_name', { ascending: true });
    if (error) console.warn('coaching clients', error);
    setClients((data as CoachingClient[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { clients, loading, refresh };
}

// Détail d'une cliente pour le coach : profil + plan + mutations.
export function useClientDetail(clientId: string | undefined) {
  const [client, setClient] = useState<CoachingClient | null>(null);
  const [assignments, setAssignments] = useState<CoachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) { setClient(null); setAssignments([]); setLoading(false); return; }
    setLoading(true);
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url, goal, is_personal_coaching, coaching_note, coaching_started_at')
        .eq('id', clientId)
        .maybeSingle(),
      supabase
        .from('coaching_assignments')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true }),
    ]);
    setClient((prof as CoachingClient | null) ?? null);
    setAssignments((rows as CoachingAssignment[] | null) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { refresh(); }, [refresh]);

  const setPremium = useCallback(
    async (on: boolean) => {
      if (!clientId) return;
      const patch: Record<string, unknown> = { is_personal_coaching: on };
      if (on) patch.coaching_started_at = new Date().toISOString();
      const { error } = await supabase.from('profiles').update(patch).eq('id', clientId);
      if (error) console.warn('set premium', error);
      await refresh();
    },
    [clientId, refresh],
  );

  const setNote = useCallback(
    async (note: string) => {
      if (!clientId) return;
      const { error } = await supabase.from('profiles').update({ coaching_note: note }).eq('id', clientId);
      if (error) console.warn('set note', error);
    },
    [clientId],
  );

  const addAssignment = useCallback(
    async (input: {
      item_type: CoachingAssignmentType;
      ref_id?: string | null;
      title?: string | null;
      description?: string | null;
      video_url?: string | null;
      coach_note?: string | null;
      scheduled_date?: string | null;
    }) => {
      if (!clientId) return;
      const { error } = await supabase.from('coaching_assignments').insert({
        client_id: clientId,
        item_type: input.item_type,
        ref_id: input.ref_id ?? null,
        title: input.title ?? null,
        description: input.description ?? null,
        video_url: input.video_url ?? null,
        coach_note: input.coach_note ?? null,
        scheduled_date: input.scheduled_date ?? null,
        sort_order: assignments.length,
      });
      if (error) console.warn('add assignment', error);
      await refresh();
    },
    [clientId, assignments.length, refresh],
  );

  const removeAssignment = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('coaching_assignments').delete().eq('id', id);
      if (error) console.warn('remove assignment', error);
      await refresh();
    },
    [refresh],
  );

  return { client, assignments, loading, refresh, setPremium, setNote, addAssignment, removeAssignment };
}
