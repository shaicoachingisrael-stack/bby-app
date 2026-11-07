import { Redirect } from 'expo-router';

// Ancienne liste des parcours : elle vit maintenant dans la page Mindset (puce « Parcours »).
export default function ProgramsRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/mindset', params: { filter: 'parcours' } } as any} />;
}
