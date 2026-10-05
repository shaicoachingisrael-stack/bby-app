import { useAppearance } from '@/lib/appearance';
import type { SchemeName } from '@/constants/theme';

// L'app est sombre dans les deux apparences : « ember » (refonte) ou « dark »
// (identité encre / albâtre d'origine). Le choix se fait dans Mon compte.
export function useColorScheme(): SchemeName {
  return useAppearance() === 'ember' ? 'ember' : 'dark';
}
