import type { IngredientUnit } from '@/lib/types';

// Champ quantité libre de « Ta recette » (« 300 g », « 1 c. à soupe », « 2 ») →
// un nombre et une unité distincts, pour calculer les macros et la liste de courses.

const UNIT_WORDS: [IngredientUnit, RegExp][] = [
  ['kg', /^(kg|kilo|kilos|kilogrammes?|кг|ק"ג|ק״ג|קילו)$/],
  ['g', /^(g|gr|grs|grammes?|grams?|gramos?|г|гр|גרם|ג)$/],
  ['ml', /^(ml|millilitres?|milliliters?|mililitros?|мл|מ"ל|מ״ל)$/],
  ['cl', /^(cl|centilitres?|centiliters?|cл|סמ"ל)$/],
  ['l', /^(l|litres?|liters?|litros?|л|ליטר)$/],
  ['cas', /^(cas|càs|c\.?a\.?s\.?|cs|c\.? ?à\.? ?s(oupe)?|c\.? ?a\.? ?soupe|cuill?(è|e)res? à soupe|tbsp|tablespoons?|cda\.?|cucharadas?|ст\.? ?л\.?|כף|כפות)$/],
  ['cac', /^(cac|càc|c\.?a\.?c\.?|cc|c\.? ?à\.? ?c(af(é|e))?|c\.? ?a\.? ?caf(é|e)|cuill?(è|e)res? à caf(é|e)|tsp|teaspoons?|cdta\.?|cucharaditas?|ч\.? ?л\.?|כפית|כפיות)$/],
];

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

export function parseQuantityText(input: string): { quantity: number | null; unit: IngredientUnit | null } {
  const s = input.trim().toLowerCase();
  if (!s) return { quantity: null, unit: null };
  const m = s.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔])\s*(.*)$/);
  if (!m) return { quantity: null, unit: null };
  let q: number;
  if (FRACTIONS[m[1]]) q = FRACTIONS[m[1]];
  else if (m[1].includes('/')) {
    const [a, b] = m[1].split('/').map((x) => Number(x.trim().replace(',', '.')));
    q = b > 0 ? a / b : NaN;
  } else q = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(q) || q <= 0) return { quantity: null, unit: null };
  const rest = m[2].replace(/\s+/g, ' ').trim();
  // « 2 citrons » : le reste est un nom, pas une unité → à la pièce.
  const unit = rest ? UNIT_WORDS.find(([, re]) => re.test(rest))?.[0] ?? null : null;
  return { quantity: Math.round(q * 1000) / 1000, unit };
}
