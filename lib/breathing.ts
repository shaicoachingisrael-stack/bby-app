// Respirations guidées (Note dev §3.1).
// Jeu de patterns standard, fixe et universel — défini en code (pas de table
// admin : la structure des phases ne change pas). Les noms/descriptions sont
// traduits via i18n (breathing.patterns.<slug>.*).

export type BreathPhaseKind = 'inhale' | 'hold' | 'exhale' | 'hold_out';

export type BreathPhase = {
  phase: BreathPhaseKind;
  seconds: number;
};

export type BreathingPattern = {
  slug: string;
  nameKey: string;
  descKey: string;
  phases: BreathPhase[];
  durations: number[]; // minutes proposées
};

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    slug: 'coherence',
    nameKey: 'breathing.patterns.coherence.name',
    descKey: 'breathing.patterns.coherence.desc',
    phases: [
      { phase: 'inhale', seconds: 5 },
      { phase: 'exhale', seconds: 5 },
    ],
    durations: [3, 5, 10],
  },
  {
    slug: '478',
    nameKey: 'breathing.patterns.478.name',
    descKey: 'breathing.patterns.478.desc',
    phases: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 7 },
      { phase: 'exhale', seconds: 8 },
    ],
    durations: [3, 5],
  },
  {
    slug: 'box',
    nameKey: 'breathing.patterns.box.name',
    descKey: 'breathing.patterns.box.desc',
    phases: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 4 },
      { phase: 'hold_out', seconds: 4 },
    ],
    durations: [3, 5, 10],
  },
  {
    slug: 'calm',
    nameKey: 'breathing.patterns.calm.name',
    descKey: 'breathing.patterns.calm.desc',
    phases: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'exhale', seconds: 6 },
    ],
    durations: [3, 5, 10],
  },
];

export function patternBySlug(slug: string | undefined): BreathingPattern | undefined {
  return BREATHING_PATTERNS.find((p) => p.slug === slug);
}

export function patternCycleLabel(p: BreathingPattern): string {
  return p.phases.map((ph) => ph.seconds).join('-');
}
