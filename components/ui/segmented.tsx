import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T | null | undefined;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function Segmented<T extends string>({ value, options, onChange, disabled }: Props<T>) {
  const palette = Colors[useColorScheme() ?? 'light'];
  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              selected && {
                backgroundColor: palette.text,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? palette.background : palette.text,
                  fontFamily: selected ? Fonts.sansSemibold : Fonts.sansMedium,
                },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, letterSpacing: 0.2 },
});
