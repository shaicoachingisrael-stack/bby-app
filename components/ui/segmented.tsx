import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { BFont, Bby } from '@/components/bby/kit';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T | null | undefined;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function Segmented<T extends string>({ value, options, onChange, disabled }: Props<T>) {
  return (
    <View style={[styles.container, { backgroundColor: Bby.card }]}>
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
                backgroundColor: Bby.yellow,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? Bby.ink : Bby.text,
                  fontFamily: selected ? BFont.sansBold : BFont.sansMedium,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
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
    borderRadius: 24,
    gap: 4,
    borderWidth: 1.5,
    borderColor: Bby.line,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, textAlign: 'center' },
});
