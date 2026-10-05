import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Fond « zone lumineuse » : le dégradé braise en apparence Ember, un aplat encre
// sinon. À poser en premier enfant d'un conteneur `overflow: 'hidden'` ; une seule
// zone de ce type par écran — celle qu'il faut toucher.
export function AccentFill() {
  const palette = Colors[useColorScheme() ?? 'light'];
  const id = useId().replace(/:/g, '');

  if (palette.accent === palette.accentEnd) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.accent }]} />;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.accent} />
            <Stop offset="0.55" stopColor={palette.accentMid} />
            <Stop offset="1" stopColor={palette.accentEnd} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
