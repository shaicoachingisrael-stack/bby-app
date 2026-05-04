import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';
import type { AttachmentParentType, MediaAttachment } from './types';

export function useAttachments(parentType: AttachmentParentType, parentId: string | undefined) {
  const [items, setItems] = useState<MediaAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!parentId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('media_attachments')
      .select('*')
      .eq('parent_type', parentType)
      .eq('parent_id', parentId)
      .order('order_index', { ascending: true });
    if (error) console.warn('attachments fetch', error);
    setItems((data as MediaAttachment[]) ?? []);
    setLoading(false);
  }, [parentType, parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (url: string, title?: string) => {
      if (!parentId) return;
      const next = items.length;
      const { data, error } = await supabase
        .from('media_attachments')
        .insert({
          parent_type: parentType,
          parent_id: parentId,
          kind: 'video',
          url,
          title: title ?? null,
          order_index: next,
        })
        .select()
        .single();
      if (error) {
        console.warn('attachment insert', error);
        return;
      }
      setItems((prev) => [...prev, data as MediaAttachment]);
    },
    [parentType, parentId, items.length],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('media_attachments').delete().eq('id', id);
    if (error) {
      console.warn('attachment delete', error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, refresh, add, remove };
}
