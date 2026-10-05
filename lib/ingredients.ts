import type { Aisle, IngredientUnit, MealType, Recipe } from './types';

// Unités proposées dans l'éditeur. null = à la pièce (« 2 avocats »).
export const UNITS: (IngredientUnit | null)[] = [null, 'g', 'kg', 'ml', 'cl', 'l', 'cas', 'cac'];

// Ordre des rayons = ordre de la liste de courses (un parcours de magasin classique).
export const AISLES: Aisle[] = [
  'fruits_legumes',
  'viandes_poissons',
  'cremerie',
  'epicerie',
  'surgeles',
  'boissons',
  'autre',
];

export const MEAL_TYPES: MealType[] = ['petit_dejeuner', 'dejeuner', 'diner', 'collation'];

export const MEAL_LABEL_KEYS: Record<MealType, string> = {
  petit_dejeuner: 'nutrition.breakfast',
  dejeuner: 'nutrition.lunch',
  diner: 'nutrition.dinner',
  collation: 'nutrition.snack',
};

// 0 = lundi … 6 = dimanche (clés de dateStrip).
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export type IngredientDraft = {
  key: string;
  name: string;
  quantity: string;
  unit: IngredientUnit | null;
};

let draftSeq = 0;
export function newDraft(partial?: Partial<Omit<IngredientDraft, 'key'>>): IngredientDraft {
  draftSeq += 1;
  return { key: `d${draftSeq}`, name: '', quantity: '', unit: null, ...partial };
}

// « 1/2 », « 1,5 », « 150 » → nombre ; vide ou illisible → null.
export function parseQuantity(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!s) return null;
  const frac = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d > 0 ? Math.round((Number(frac[1]) / d) * 1000) / 1000 : null;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatNumber(n: number): string {
  if (n === 0.5) return '½';
  if (n === 0.25) return '¼';
  if (n === 0.75) return '¾';
  const rounded = Math.round(n * 100) / 100;
  return `${rounded}`.replace('.', ',');
}

type T = (key: string) => string;

// Ligne d'ingrédient d'une recette : « 150 g saumon », « ½ avocat », « Graines de sésame ».
export function formatIngredient(
  ing: { name: string; quantity: number | null; unit: IngredientUnit | null },
  t: T,
): string {
  if (ing.quantity === null) return ing.name;
  const unit = ing.unit ? ` ${t(`ingredients.unit.${ing.unit}`)}` : '';
  return `${formatNumber(Number(ing.quantity))}${unit} ${ing.name}`;
}

// Quantité d'une ligne de courses. La base stocke en g / ml : on remonte en kg / L
// dès que c'est plus lisible en magasin.
export function formatShoppingQuantity(quantity: number | null, unit: string, t: T): string | null {
  if (quantity === null) return null;
  const q = Number(quantity);
  if (unit === 'g') return q >= 1000 ? `${formatNumber(q / 1000)} ${t('ingredients.unit.kg')}` : `${formatNumber(q)} ${t('ingredients.unit.g')}`;
  if (unit === 'ml') return q >= 1000 ? `${formatNumber(q / 1000)} ${t('ingredients.unit.l')}` : `${formatNumber(q)} ${t('ingredients.unit.ml')}`;
  if (unit === 'cas' || unit === 'cac') return `${formatNumber(q)} ${t(`ingredients.unit.${unit}`)}`;
  return formatNumber(q);
}

// Devine le rayon à partir du nom, pour que personne n'ait à le saisir.
// Mots-clés français et anglais ; sans correspondance → « autre ».
const AISLE_KEYWORDS: [Aisle, string[]][] = [
  ['surgeles', ['surgel', 'frozen', 'glace', 'ice cream', 'sorbet']],
  ['boissons', ['eau ', 'eau gaz', 'jus', 'juice', 'the ', 'tea', 'cafe', 'coffee', 'tisane', 'kombucha', 'boisson', 'lait d\'amande', 'lait d\'avoine', 'lait de coco', 'lait vegetal']],
  ['viandes_poissons', ['poulet', 'chicken', 'dinde', 'turkey', 'boeuf', 'beef', 'veau', 'porc', 'pork', 'jambon', 'ham', 'steak', 'saumon', 'salmon', 'thon', 'tuna', 'cabillaud', 'cod', 'crevette', 'shrimp', 'prawn', 'poisson', 'fish', 'sardine', 'maquereau', 'truite', 'viande', 'meat', 'agneau', 'lamb', 'canard']],
  ['cremerie', ['lait', 'milk', 'yaourt', 'yogurt', 'yoghurt', 'skyr', 'fromage', 'cheese', 'feta', 'mozzarella', 'parmesan', 'ricotta', 'beurre', 'butter', 'creme', 'cream', 'oeuf', 'egg', 'cottage', 'tofu']],
  ['fruits_legumes', ['avocat', 'avocado', 'tomate', 'tomato', 'salade', 'lettuce', 'epinard', 'spinach', 'courgette', 'zucchini', 'carotte', 'carrot', 'oignon', 'onion', 'ail', 'garlic', 'citron', 'lemon', 'lime', 'pomme', 'apple', 'banane', 'banana', 'fraise', 'strawberr', 'framboise', 'myrtille', 'berry', 'berries', 'fruit', 'legume', 'vegetable', 'brocoli', 'broccoli', 'poivron', 'pepper', 'concombre', 'cucumber', 'champignon', 'mushroom', 'patate', 'potato', 'herbe', 'basilic', 'basil', 'persil', 'parsley', 'coriandre', 'menthe', 'mint', 'gingembre', 'ginger', 'orange', 'mangue', 'mango', 'ananas', 'kiwi', 'poire', 'peche', 'abricot', 'raisin', 'chou', 'cabbage', 'kale', 'aubergine', 'eggplant', 'betterave', 'radis', 'celeri', 'fenouil', 'roquette', 'edamame', 'haricot vert', 'asperge', 'poireau', 'echalote', 'datte', 'figue', 'grenade', 'melon', 'pasteque']],
  ['epicerie', ['riz', 'rice', 'pate', 'pasta', 'quinoa', 'avoine', 'oat', 'farine', 'flour', 'sucre', 'sugar', 'miel', 'honey', 'huile', 'oil', 'vinaigre', 'vinegar', 'sel', 'salt', 'poivre', 'epice', 'spice', 'graine', 'seed', 'amande', 'almond', 'noix', 'nut', 'noisette', 'cacahuete', 'peanut', 'lentille', 'lentil', 'pois chiche', 'chickpea', 'haricot', 'bean', 'sauce', 'moutarde', 'mustard', 'chocolat', 'chocolate', 'cacao', 'cocoa', 'pain', 'bread', 'conserve', 'boulgour', 'semoule', 'couscous', 'sirop', 'syrup', 'proteine', 'protein', 'whey', 'levure', 'vanille', 'cannelle', 'cinnamon', 'curry', 'curcuma', 'paprika', 'bouillon', 'tahini', 'houmous', 'hummus', 'galette', 'tortilla', 'wrap', 'muesli', 'granola', 'cereale', 'cereal']],
];

function fold(s: string): string {
  // œ / æ ne se décomposent pas avec NFD, et l'apostrophe peut être typographique
  const flat = s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/’/g, "'");
  return ` ${flat.normalize('NFD').replace(/[\u0300-\u036f]/g, '')} `;
}

export function guessAisle(name: string): Aisle {
  const n = fold(name);
  for (const [aisle, words] of AISLE_KEYWORDS) {
    if (words.some((w) => n.includes(w))) return aisle;
  }
  return 'autre';
}

// Ancien champ texte des recettes, régénéré à chaque enregistrement : il sert de
// repli d'affichage et alimente la traduction automatique existante.
export function ingredientsToText(drafts: IngredientDraft[], t: T): string {
  return drafts
    .filter((d) => d.name.trim())
    .map((d) => formatIngredient({ name: d.name.trim(), quantity: parseQuantity(d.quantity), unit: d.unit }, t))
    .join('\n');
}

export function draftsToPayload(drafts: IngredientDraft[]) {
  return drafts
    .filter((d) => d.name.trim())
    .map((d) => {
      const quantity = parseQuantity(d.quantity);
      return {
        name: d.name.trim(),
        quantity,
        unit: quantity === null ? null : d.unit,
        aisle: guessAisle(d.name),
      };
    });
}

// Menu généré : pour chaque jour et chaque repas principal, une recette du bon
// type, en tournant dans une liste mélangée pour espacer les répétitions.
// Un créneau sans recette du bon type reste vide (jamais un dîner au petit-déjeuner).
export function generateMenu(recipes: Recipe[]): { day: number; meal_type: MealType; recipe_id: string }[] {
  const slots: MealType[] = ['petit_dejeuner', 'dejeuner', 'diner'];
  const out: { day: number; meal_type: MealType; recipe_id: string }[] = [];
  for (const meal of slots) {
    const pool = recipes.filter((r) => r.meal_type === meal);
    if (pool.length === 0) continue;
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let day = 0; day < 7; day += 1) {
      out.push({ day, meal_type: meal, recipe_id: pool[day % pool.length].id });
    }
  }
  return out;
}
