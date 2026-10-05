import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Apparence de l'app. « ember » = proposition de refonte (nuit prune + braise) ;
// « encre » = identité d'origine de Shy (encre / albâtre). Le choix est gardé sur
// l'appareil : il sert à comparer les deux à mise en page égale.
export type Appearance = 'ember' | 'encre';

const KEY = 'bby.appearance';
const DEFAULT: Appearance = 'ember';

let current: Appearance = DEFAULT;
const listeners = new Set<() => void>();

export function getAppearance(): Appearance {
  return current;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// À appeler une fois au démarrage, avant le premier rendu des écrans.
export async function loadAppearance(): Promise<Appearance> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved === 'ember' || saved === 'encre') current = saved;
  } catch {
    // stockage indisponible : on garde l'apparence par défaut
  }
  emit();
  return current;
}

export function setAppearance(next: Appearance) {
  if (next === current) return;
  current = next;
  emit();
  AsyncStorage.setItem(KEY, next).catch(() => {});
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, getAppearance, getAppearance);
}
