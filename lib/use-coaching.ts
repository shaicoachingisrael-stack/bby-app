import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-provider';
import { supabase } from './supabase';
import type { CoachingAssignment, CoachingConfig, CoachingMessage, CoachingPlan } from './types';

// Offre coaching (page découverte, clientes non-premium) : pitch + formules + demande d'intérêt.
export function useCoachingOffer() {
  const { user } = useAuth();
  const [config, setConfig] = useState<CoachingConfig | null>(null);
  const [plans, setPlans] = useState<CoachingPlan[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [interested, setInterested] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: cfg }, { data: planRows }, prof] = await Promise.all([
      supabase.from('coaching_config').select('*').eq('id', 'default').maybeSingle(),
      supabase.from('coaching_plans').select('*').order('sort_order', { ascending: true }),
      user
        ? supabase.from('profiles').select('is_personal_coaching, coaching_interest').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setConfig((cfg as CoachingConfig | null) ?? null);
    setPlans((planRows as CoachingPlan[] | null) ?? []);
    const p = prof.data as { is_personal_coaching?: boolean; coaching_interest?: boolean } | null;
    setIsClient(!!p?.is_personal_coaching);
    setInterested(!!p?.coaching_interest);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const requestInterest = useCallback(
    async (message: string) => {
      if (!user) return;
      setInterested(true);
      await supabase.from('profiles').update({ coaching_interest: true }).eq('id', user.id);
      if (message.trim()) {
        await supabase.from('coaching_messages').insert({ client_id: user.id, sender: 'client', content: message.trim() });
      }
    },
    [user],
  );

  return { config, plans, isClient, interested, loading, refresh, requestInterest };
}

// Côté cliente : suis-je suivie en perso ? + mon plan de la semaine.
export function useMyCoaching() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [assignments, setAssignments] = useState<CoachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setIsClient(false); setAssignments([]); setLoading(false); return; }
    setLoading(true);
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase.from('profiles').select('is_personal_coaching').eq('id', user.id).maybeSingle(),
      supabase
        .from('coaching_assignments')
        .select('*')
        .eq('client_id', user.id)
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true }),
    ]);
    setIsClient(!!(prof as { is_personal_coaching?: boolean } | null)?.is_personal_coaching);
    setAssignments((rows as CoachingAssignment[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleDone = useCallback(
    async (id: string, current: boolean) => {
      // Optimiste
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, done: !current } : a)));
      const { error } = await supabase
        .from('coaching_assignments')
        .update({ done: !current, done_at: !current ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) console.warn('toggle assignment', error);
    },
    [],
  );

  return { isClient, assignments, loading, refresh, toggleDone };
}

// Messagerie partagée cliente↔coach. role = qui écrit ('client' côté app cliente,
// 'coach' côté admin). clientId identifie la conversation.
export function useCoachMessages(clientId: string | undefined, role: 'client' | 'coach') {
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('coaching_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    if (error) console.warn('coaching messages', error);
    setMessages((data as CoachingMessage[] | null) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { refresh(); }, [refresh]);

  const send = useCallback(
    async (content: string) => {
      if (!clientId || !content.trim()) return;
      const optimistic: CoachingMessage = {
        id: `tmp-${messages.length}-${content.length}`,
        client_id: clientId,
        sender: role,
        content: content.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const { error } = await supabase
        .from('coaching_messages')
        .insert({ client_id: clientId, sender: role, content: content.trim() });
      if (error) console.warn('send message', error);
      await refresh();
    },
    [clientId, role, messages.length, refresh],
  );

  return { messages, loading, refresh, send };
}
