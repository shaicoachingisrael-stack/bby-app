import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';

const DISMISS_UNTIL_KEY = 'bby:inbox:dismissed_until';
const DISMISSED_IDS_KEY = 'bby:inbox:dismissed_ids';

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

async function readDismissedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

async function writeDismissedIds(ids: Set<string>) {
  await AsyncStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(Array.from(ids)));
}

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const dismissedUntil = await AsyncStorage.getItem(DISMISS_UNTIL_KEY);
    const dismissedIds = await readDismissedIds();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let q = supabase
      .from('notifications')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    if (dismissedUntil) q = q.gt('created_at', dismissedUntil);

    const { data, error } = await q;
    if (error) console.warn('inbox fetch', error);

    const all = ((data as InboxItem[]) ?? []).filter((it) => !dismissedIds.has(it.id));
    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismissAll = useCallback(async () => {
    const stamp = new Date().toISOString();
    await AsyncStorage.setItem(DISMISS_UNTIL_KEY, stamp);
    setItems([]);
  }, []);

  const dismissOne = useCallback(async (id: string) => {
    const ids = await readDismissedIds();
    ids.add(id);
    await writeDismissedIds(ids);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, refresh, dismissAll, dismissOne };
}
