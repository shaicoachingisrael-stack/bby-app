import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// Reads `data.url` from any notification the user taps and routes there.
// Covers all 3 cases: foreground tap, background tap, killed-state cold start.
export function useNotificationResponse() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastResponse) return;
    // Avoid handling the same response twice (e.g. on hot reload)
    const id = lastResponse.notification.request.identifier;
    if (handledIdRef.current === id) return;

    const data = lastResponse.notification.request.content.data ?? {};
    // send-push pose `url` à la racine du message APNs, qu'expo ne recopie pas
    // dans `data` (il ne lit que la clé `body`) : on le relit dans le message brut.
    const payload = (lastResponse.notification.request.trigger as any)?.payload ?? {};
    const raw = (data as any).url ?? payload.url ?? payload.body?.url;
    const url = typeof raw === 'string' ? raw : null;

    if (url && url.startsWith('/')) {
      handledIdRef.current = id;
      // small delay to let the navigator be ready
      setTimeout(() => router.push(url as any), 50);
    }
  }, [lastResponse, router]);
}
