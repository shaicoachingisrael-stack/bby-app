import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  value: string | number;
  label: string;
};

export function StatCard({ value, label }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <Text style={[styles.value, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          { color: palette.textSecondary, fontFamily: Fonts.sansMedium },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 92,
  },
  value: {
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
});
