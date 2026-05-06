import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import he from './locales/he.json';
import ru from './locales/ru.json';

export type Locale = 'fr' | 'en' | 'he' | 'es' | 'ru';

export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en', 'he', 'es', 'ru'];

function detectInitialLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'fr';
  return (SUPPORTED_LOCALES as readonly string[]).includes(tag) ? (tag as Locale) : 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      he: { translation: he },
      es: { translation: es },
      ru: { translation: ru },
    },
    lng: detectInitialLocale(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
