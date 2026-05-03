import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  range?: number;
};

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function DateStrip({ value, onChange, range = 14 }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  const today = startOfDay(new Date());
  const days: Date[] = [];
  // Start a few days before today, end a few days after.
  for (let i = -3; i < range; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((d) => {
        const selected = isSameDay(d, value);
        return (
          <Pressable
            key={d.toISOString()}
            onPress={() => onChange(d)}
            style={[
              styles.cell,
              {
                backgroundColor: selected ? palette.text : palette.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.num,
                {
                  color: selected ? palette.background : palette.text,
                  fontFamily: Fonts.displayBold,
                },
              ]}
            >
              {d.getDate()}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: selected ? palette.background : palette.textSecondary,
                  fontFamily: Fonts.sansMedium,
                },
              ]}
            >
              {DAY_LABELS[d.getDay()]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  cell: {
    width: 56,
    height: 76,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  num: { fontSize: 20, letterSpacing: -0.4 },
  label: { fontSize: 11, letterSpacing: 0.6 },
});
