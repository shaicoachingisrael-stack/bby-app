import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';

const DISMISS_KEY = 'bby:inbox:dismissed_until';

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedUntil, setDismissedUntil] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const stored = await AsyncStorage.getItem(DISMISS_KEY);
    setDismissedUntil(stored);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let q = supabase
      .from('notifications')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    if (stored) q = q.gt('created_at', stored);

    const { data, error } = await q;
    if (error) console.warn('inbox fetch', error);
    setItems((data as InboxItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Mark all current items as dismissed locally (we keep server data for other devices)
  const dismissAll = useCallback(async () => {
    const stamp = new Date().toISOString();
    await AsyncStorage.setItem(DISMISS_KEY, stamp);
    setDismissedUntil(stamp);
    setItems([]);
  }, []);

  return { items, loading, refresh, dismissAll, dismissedUntil };
}
