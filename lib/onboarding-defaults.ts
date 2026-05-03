// Smart defaults for daily targets, computed from the chosen goal + level.
// Conservative ballpark values for an adult woman; user can always adjust.

type Goal =
  | 'perte_de_poids'
  | 'prise_de_masse'
  | 'tonification'
  | 'remise_en_forme'
  | 'bien_etre';

type Level = 'debutant' | 'intermediaire' | 'avance';

export function computeDefaults(goal: Goal, level: Level) {
  const baseKcal = {
    perte_de_poids: 1700,
    prise_de_masse: 2200,
    tonification: 1900,
    remise_en_forme: 1900,
    bien_etre: 1900,
  }[goal];

  const proteinPerKg = {
    perte_de_poids: 1.8,
    prise_de_masse: 2.0,
    tonification: 1.6,
    remise_en_forme: 1.4,
    bien_etre: 1.2,
  }[goal];

  // Reference body weight assumption (60 kg). User edits later.
  const protein = Math.round(60 * proteinPerKg / 5) * 5;

  // Slight bump for higher fitness levels (more energy needs)
  const kcalAdj = { debutant: 0, intermediaire: 50, avance: 100 }[level];
  const kcal = baseKcal + kcalAdj;

  return {
    daily_kcal_target: kcal,
    protein_target_g: protein,
    hydration_target_ml: 2500,
  };
}
