import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import he from './locales/he.json';
import ru from './locales/ru.json';
import v2today_fr from './locales/v2today/fr.json';
import v2today_en from './locales/v2today/en.json';
import v2today_he from './locales/v2today/he.json';
import v2today_es from './locales/v2today/es.json';
import v2today_ru from './locales/v2today/ru.json';
import v2nutrition_fr from './locales/v2nutrition/fr.json';
import v2nutrition_en from './locales/v2nutrition/en.json';
import v2nutrition_he from './locales/v2nutrition/he.json';
import v2nutrition_es from './locales/v2nutrition/es.json';
import v2nutrition_ru from './locales/v2nutrition/ru.json';
import v2mindset_fr from './locales/v2mindset/fr.json';
import v2mindset_en from './locales/v2mindset/en.json';
import v2mindset_he from './locales/v2mindset/he.json';
import v2mindset_es from './locales/v2mindset/es.json';
import v2mindset_ru from './locales/v2mindset/ru.json';

// Textes de la refonte (nov. 2026), un fichier par onglet : clés `v2today.*`, `v2nutrition.*`, `v2mindset.*`.
const v2 = (l: 'fr' | 'en' | 'he' | 'es' | 'ru') =>
  ({
    fr: { v2today: v2today_fr, v2nutrition: v2nutrition_fr, v2mindset: v2mindset_fr },
    en: { v2today: v2today_en, v2nutrition: v2nutrition_en, v2mindset: v2mindset_en },
    he: { v2today: v2today_he, v2nutrition: v2nutrition_he, v2mindset: v2mindset_he },
    es: { v2today: v2today_es, v2nutrition: v2nutrition_es, v2mindset: v2mindset_es },
    ru: { v2today: v2today_ru, v2nutrition: v2nutrition_ru, v2mindset: v2mindset_ru },
  })[l];

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
      fr: { translation: { ...fr, ...v2('fr') } },
      en: { translation: { ...en, ...v2('en') } },
      he: { translation: { ...he, ...v2('he') } },
      es: { translation: { ...es, ...v2('es') } },
      ru: { translation: { ...ru, ...v2('ru') } },
    },
    lng: detectInitialLocale(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
