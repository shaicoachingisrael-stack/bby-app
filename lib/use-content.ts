import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';
import type { Program, Session } from './types';

// Fetch all programs (catalog read is open to authenticated users)
export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('programs fetch', error);
    setPrograms((data as Program[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { programs, loading, refresh };
}

// Fetch all sessions (optionally filter by program)
export function useSessions(programId?: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (programId) query = query.eq('program_id', programId);
    const { data, error } = await query;
    if (error) console.warn('sessions fetch', error);
    setSessions((data as Session[]) ?? []);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, refresh };
}

// "Today's session" — first session in the most recent program for now.
// Later we can plug a smarter rule (current week, last completed, etc.).
export function useTodaySession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.warn("today's session fetch", error);
    setSession((data as Session | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}

// Fetch a single session by id
export function useSession(id: string | undefined) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) console.warn('session fetch', error);
    setSession((data as Session | null) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
