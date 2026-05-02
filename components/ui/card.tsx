import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  children: ReactNode;
  variant?: 'surface' | 'inverse';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'surface', style }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: variant === 'inverse' ? palette.text : palette.surface,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
});
