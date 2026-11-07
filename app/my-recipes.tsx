import { Redirect } from 'expo-router';

// Ancienne route conservée : elle ouvre maintenant la section de l'onglet Nutrition.
export default function Screen() {
  return <Redirect href={{ pathname: '/(tabs)/nutrition', params: { section: 'recettes', filter: 'mine', at: `${Date.now()}` } } as any} />;
}
