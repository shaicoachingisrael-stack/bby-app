import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import i18n, { Locale, SUPPORTED_LOCALES } from './i18n';
import { ensureDirection } from './rtl';
import { useProfile } from './use-profile';

// Le choix est gardé sur le téléphone (lu au lancement, valable avant toute
// connexion) ET dans le profil (suit la cliente d'un appareil à l'autre).
const STORAGE_KEY = 'bby.locale';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
};

const LocaleContext = createContext<Ctx>({
  locale: 'fr',
  setLocale: async () => {},
});

const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(v);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { profile, update } = useProfile();
  const [locale, setLocaleState] = useState<Locale>(isLocale(i18n.language) ? i18n.language : 'fr');

  // Au lancement : la langue choisie sur ce téléphone passe avant celle du système.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (isLocale(saved) && i18n.language !== saved) i18n.changeLanguage(saved);
        if (isLocale(saved)) setLocaleState(saved);
        // Hébreu = de droite à gauche (sinon de gauche à droite), langue choisie ou celle du téléphone.
        ensureDirection(isLocale(saved) ? saved : i18n.language);
      })
      .catch(() => {});
  }, []);

  // Après connexion : le profil fait foi ; s'il n'a pas encore de langue, il prend
  // celle choisie avant la connexion.
  useEffect(() => {
    if (!profile) return;
    const stored = profile.locale as Locale | null | undefined;
    if (isLocale(stored)) {
      if (i18n.language !== stored) i18n.changeLanguage(stored);
      setLocaleState(stored);
      AsyncStorage.setItem(STORAGE_KEY, stored)
        .catch(() => {})
        .then(() => ensureDirection(stored));
    } else if (isLocale(i18n.language)) {
      update({ locale: i18n.language as any }).catch(() => {});
    }
  }, [profile?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback(
    async (l: Locale) => {
      setLocaleState(l);
      if (i18n.language !== l) await i18n.changeLanguage(l);
      await AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
      // sans session (écran d'accueil), seul le téléphone retient le choix
      if (profile) {
        try {
          await update({ locale: l as any });
        } catch (e) {
          console.warn('locale persist error', e);
        }
      }
      // Passage hébreu ↔ autre langue : l'app se recharge pour changer de sens.
      await ensureDirection(l);
    },
    [update, profile],
  );

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
