import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './auth-provider';
import { cancelAllReminders, registerPushToken, scheduleDailyReminders } from './notifications';
import { useProfile } from './use-profile';

// Une fois par session : permission, jeton enregistré, rappels du jour. Les rappels
// sont reprogrammés quand la langue ou le suivi nutrition change, et annulés à la
// déconnexion (sinon ils continuent sur le téléphone d'une autre personne).
export function usePushSetup() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { i18n } = useTranslation();
  const tracking = profile?.nutrition_tracking === true;
  const hadUser = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    registerPushToken(user.id).catch((e) => console.warn('push token error', e));
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (hadUser.current) cancelAllReminders().catch(() => {});
      hadUser.current = false;
      return;
    }
    hadUser.current = true;
    scheduleDailyReminders(tracking).catch((e) => console.warn('reminders error', e));
  }, [user, loading, tracking, i18n.language]);
}
