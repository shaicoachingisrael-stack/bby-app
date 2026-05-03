// Forced dark mode for now while design is finalized.
// To re-enable system-following: revert to `export { useColorScheme } from 'react-native';`
export function useColorScheme(): 'dark' | 'light' {
  return 'dark';
}
