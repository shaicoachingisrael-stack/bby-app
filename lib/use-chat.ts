import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from './supabase';
import { useAuth } from './auth-provider';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const tempId = useRef(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) console.warn('chat history error', error);
    setMessages(((data ?? []) as ChatMessage[]).filter((m) => m.role !== 'system' as any));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      tempId.current += 1;
      const optimistic: ChatMessage = {
        id: `local-${tempId.current}`,
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        const { data, error } = await supabase.functions.invoke('coach-chat', {
          body: { message: trimmed },
        });
        if (error) throw error;
        const assistant: ChatMessage = {
          id: `local-a-${tempId.current}`,
          role: 'assistant',
          content: (data as any).content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistant]);
      } catch (e: any) {
        const fallback: ChatMessage = {
          id: `local-err-${tempId.current}`,
          role: 'assistant',
          content:
            "Désolée, je n'ai pas pu répondre. Vérifie ta connexion et réessaie dans un instant.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallback]);
        console.warn('coach-chat invoke error', e);
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  return { messages, loading, sending, send, refresh };
}
