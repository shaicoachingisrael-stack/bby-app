import i18n from './i18n';

type WithI18n = {
  i18n?: Record<string, Record<string, string>> | null;
} & Record<string, any>;

const FIELD_MAP: Record<string, string[]> = {
  programs: ['title', 'description'],
  sessions: ['title', 'description'],
  recipes: ['title', 'description', 'ingredients', 'steps'],
  mindset_content: ['title', 'body'],
  daily_affirmations: ['text'],
  mindset_ritual_catalog: ['label'],
  mindset_programs: ['title', 'subtitle', 'description'],
  mindset_program_steps: ['title', 'prompt_text'],
};

export function localize<T extends WithI18n>(
  row: T | null | undefined,
  table: keyof typeof FIELD_MAP,
  locale?: string,
): T | null {
  if (!row) return row ?? null;
  const lang = (locale ?? i18n.language ?? 'fr').slice(0, 2);
  if (lang === 'fr') return row;
  const block = row.i18n?.[lang];
  if (!block) return row;
  const fields = FIELD_MAP[table] ?? [];
  const out: any = { ...row };
  for (const f of fields) {
    const v = block[f];
    if (typeof v === 'string' && v.trim().length > 0) out[f] = v;
  }
  return out as T;
}

export function localizeAll<T extends WithI18n>(
  rows: T[] | null | undefined,
  table: keyof typeof FIELD_MAP,
  locale?: string,
): T[] {
  if (!rows) return [];
  return rows.map((r) => localize(r, table, locale)!);
}
