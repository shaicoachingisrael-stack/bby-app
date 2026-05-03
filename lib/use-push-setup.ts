import { useEffect } from 'react';

import { useAuth } from './auth-provider';
import {
  registerPushToken,
  scheduleDailyReminders,
} from './notifications';

// Run once per session: ask permissions, persist token, schedule local reminders.
export function usePushSetup() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    void (async () => {
      try {
        await registerPushToken(user.id);
        await scheduleDailyReminders();
      } catch (e) {
        console.warn('push setup error', e);
      }
    })();
  }, [user, loading]);
}
