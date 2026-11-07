import type { Rhythm } from './prefs';

export type Fraction = 'half' | 'third' | 'quarter' | 'sixth';
const VALUE: Record<Fraction, number> = { half: 1 / 2, third: 1 / 3, quarter: 1 / 4, sixth: 1 / 6 };

export type PlateTemplate = { veg: Fraction; protein: Fraction; starch: Fraction };

// Assiette type selon le rythme (valeurs des maquettes de Shaï).
export const PLATES: Record<Rhythm, PlateTemplate> = {
  perte_de_gras: { veg: 'half', protein: 'third', starch: 'sixth' },
  maintien: { veg: 'half', protein: 'quarter', starch: 'quarter' },
  prise_de_masse: { veg: 'third', protein: 'third', starch: 'third' },
};

export const fractionValue = (f: Fraction) => VALUE[f];
