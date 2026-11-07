// Mindset (refonte de Shaï, nov. 2026) : types, dates locales, traductions des
// contenus et petites règles partagées par tous les écrans de l'onglet.
import { Share } from 'react-native';

import i18n from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types

export type I18nBlock = Record<string, Record<string, string>> | null | undefined;

export type Parcours = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  for_you_if: string | null;
  minutes_range: string | null;
  day_count: number;
  photo_url: string | null;
  sort_order: number;
  i18n?: I18nBlock;
};

export type Phase = 'comprendre' | 'essayer' | 'ancrer';

export type ParcoursDay = {
  id: string;
  program_id: string;
  day_number: number;
  title: string | null;
  prompt_text: string | null;
  phase: Phase | null;
  idea: string | null;
  gesture: string | null;
  take_away: string | null;
  minutes: number | null;
  i18n?: I18nBlock;
};

export type ParcoursProgress = {
  id: string;
  user_id: string;
  program_id: string;
  current_day: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  answers: Record<string, string> | null;
  anchor: string | null;
  backup: string | null;
  satisfaction_mark: string | null;
  kept: boolean;
  day_done_on: string | null;
};

export type MoodKey = 'calm' | 'light' | 'tired' | 'tense' | 'energized' | 'lost';
export const MOODS: MoodKey[] = ['calm', 'light', 'tired', 'tense', 'energized', 'lost'];

export type JournalEntry = {
  id: string;
  user_id: string;
  kind: 'bilan_du_soir' | 'parcours' | string;
  body: string | null;
  mood: string | null;
  victories: string[] | null;
  gratitude: string | null;
  tomorrow_intention: string | null;
  other_text: string | null;
  program_id: string | null;
  program_day: number | null;
  created_at: string;
  updated_at: string;
};

export type MyRitual = {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  catalog_id: string | null;
  sort_order: number;
  is_active: boolean;
  anchor: string | null;
  program_id: string | null;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Dates (toujours la date LOCALE de l'appareil : tout repart de zéro à minuit)

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function lang() {
  return (i18n.language || 'fr').slice(0, 2);
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** « Jeu. 8 oct. » */
export function shortDate(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d;
  try {
    return cap(x.toLocaleDateString(lang(), { weekday: 'short', day: 'numeric', month: 'short' }));
  } catch {
    return dayKey(x);
  }
}

/** « Octobre » */
export function monthName(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d;
  try {
    return cap(x.toLocaleDateString(lang(), { month: 'long' }));
  } catch {
    return `${x.getMonth() + 1}`;
  }
}

// ---------------------------------------------------------------------------
// Contenus traduits (bloc i18n jsonb : { en: { title, idea, … }, he: … })

export function loc<T extends { i18n?: I18nBlock }>(row: T, fields: (keyof T & string)[]): T {
  const l = lang();
  if (l === 'fr' || !row.i18n?.[l]) return row;
  const block = row.i18n[l];
  const out: any = { ...row };
  for (const f of fields) {
    const v = block[f];
    if (typeof v === 'string' && v.trim()) out[f] = v;
  }
  return out as T;
}

export const PARCOURS_FIELDS: (keyof Parcours & string)[] = ['title', 'subtitle', 'description', 'for_you_if', 'minutes_range'];
export const DAY_FIELDS: (keyof ParcoursDay & string)[] = ['title', 'prompt_text', 'idea', 'gesture', 'take_away'];

// ---------------------------------------------------------------------------
// Règles du parcours

/**
 * Jour visible d'un parcours. Un nouveau jour s'ouvre le lendemain matin (date
 * locale) : si la cliente a terminé un jour aujourd'hui, on lui montre ce jour-là,
 * fait, et le suivant reste fermé jusqu'à demain.
 */
export function parcoursState(progress: ParcoursProgress | null | undefined, dayCount: number) {
  if (!progress) return { day: 1, lockedToday: false, finished: false, started: false };
  if (progress.completed_at) return { day: dayCount, lockedToday: false, finished: true, started: true };
  const lockedToday = progress.day_done_on === dayKey() && progress.current_day > 1;
  return {
    day: lockedToday ? progress.current_day - 1 : progress.current_day,
    lockedToday,
    finished: false,
    started: true,
  };
}

export function isActive(p: ParcoursProgress | null | undefined) {
  return !!p && !p.completed_at;
}

/** Jours 4, 6 et 7 : les trois éléments du « geste gardé ». */
export const KEPT_DAYS = { anchor: 4, backup: 6, satisfaction_mark: 7 } as const;

// « Après avoir posé ma tasse de café, je déroule mon tapis. »
//   → nom du rituel « Je déroule mon tapis », ancrage « Après avoir posé ma tasse de café ».
const AFTER_WORDS = /^(après|apres|after|después|despues|после|אחרי)\b/i;

export function splitAnchor(text: string): { label: string; anchor: string | null } {
  const clean = text.trim().replace(/[.。]+$/, '');
  if (AFTER_WORDS.test(clean)) {
    const i = clean.indexOf(',');
    if (i > 0 && i < clean.length - 2) {
      return { label: cap(clean.slice(i + 1).trim()), anchor: clean.slice(0, i).trim() };
    }
  }
  return { label: cap(clean), anchor: null };
}

export function paragraphs(text: string | null | undefined) {
  return (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // feuille de partage fermée : rien à faire
  }
}

/** Une page vide ne s'enregistre pas : au moins une zone remplie. */
export function entryHasContent(e: Pick<JournalEntry, 'victories' | 'gratitude' | 'tomorrow_intention' | 'other_text'>) {
  return (
    (e.victories ?? []).some((v) => v.trim()) ||
    !!e.gratitude?.trim() ||
    !!e.tomorrow_intention?.trim() ||
    !!e.other_text?.trim()
  );
}

/** Titre et extrait d'une page, pour la liste du journal (aucun champ « titre »). */
export function entryPreview(e: JournalEntry, dayTitle?: string | null) {
  if (e.kind === 'parcours') return { title: dayTitle || '', excerpt: e.body?.trim() || '' };
  if (e.kind === 'journal') {
    const lines = (e.body ?? '').trim().split(/\n+/);
    return { title: lines[0] ?? '', excerpt: lines.slice(1).join(' ') };
  }
  const parts = [...(e.victories ?? []), e.gratitude ?? '', e.tomorrow_intention ?? '', e.other_text ?? '']
    .map((x) => x.trim())
    .filter(Boolean);
  return { title: parts[0] ?? '', excerpt: parts[1] ?? '' };
}
