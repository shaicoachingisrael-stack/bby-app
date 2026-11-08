// Date de fin du coaching perso (colonne profiles.coaching_ends_on, format AAAA-MM-JJ).
// Le paiement se fait hors de l'appli : Shaï note jusqu'à quand la cliente a payé,
// et reçoit une alerte 3 jours avant puis le jour J (migration 038).

export const ENDING_SOON_DAYS = 3;

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayIso = () => toIso(new Date());

/** Ajoute des mois (le 31 janvier + 1 mois = le 28/29 février, pas le 3 mars). */
export function addMonths(iso: string, months: number) {
  const d = fromIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toIso(d);
}

export function addDays(iso: string, days: number) {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Jours restants : 0 = se termine aujourd'hui, négatif = déjà terminé. */
export function daysLeft(iso: string) {
  return Math.round((fromIso(iso).getTime() - fromIso(todayIso()).getTime()) / 86400000);
}

export function formatEndDate(iso: string, withYear = true) {
  return fromIso(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export type EndState = 'none' | 'ok' | 'soon' | 'ended';

export function endState(iso: string | null | undefined): EndState {
  if (!iso) return 'none';
  const n = daysLeft(iso);
  if (n < 0) return 'ended';
  if (n <= ENDING_SOON_DAYS) return 'soon';
  return 'ok';
}

/** « dans 12 jours », « demain », « aujourd’hui », « terminé depuis 3 jours ». */
export function endPhrase(iso: string) {
  const n = daysLeft(iso);
  if (n > 1) return `dans ${n} jours`;
  if (n === 1) return 'demain';
  if (n === 0) return 'aujourd’hui';
  if (n === -1) return 'terminé depuis hier';
  return `terminé depuis ${-n} jours`;
}
