import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react';

import i18n, { Locale, SUPPORTED_LOCALES } from './i18n';
import { useProfile } from './use-profile';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
};

const LocaleContext = createContext<Ctx>({
  locale: 'fr',
  setLocale: async () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { profile, update } = useProfile();

  // When profile.locale changes (after login or fetch), sync i18next
  useEffect(() => {
    const stored = profile?.locale as Locale | null | undefined;
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored) && i18n.language !== stored) {
      i18n.changeLanguage(stored);
    }
  }, [profile?.locale]);

  const setLocale = useCallback(
    async (l: Locale) => {
      if (i18n.language !== l) await i18n.changeLanguage(l);
      try {
        await update({ locale: l as any });
      } catch (e) {
        console.warn('locale persist error', e);
      }
    },
    [update],
  );

  const locale = ((profile?.locale as Locale | undefined) ?? (i18n.language as Locale)) ?? 'fr';

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
