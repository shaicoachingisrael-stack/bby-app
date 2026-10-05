import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AccentFill } from '@/components/ui/accent-fill';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const { t } = useTranslation();

  const DAY_LABELS = [
    t('dateStrip.sun'),
    t('dateStrip.mon'),
    t('dateStrip.tue'),
    t('dateStrip.wed'),
    t('dateStrip.thu'),
    t('dateStrip.fri'),
    t('dateStrip.sat'),
  ];

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
            style={[styles.cell, { backgroundColor: palette.surface }]}
          >
            {selected ? <AccentFill /> : null}
            <Text
              style={[
                styles.label,
                {
                  color: selected ? palette.onAccent : palette.textSecondary,
                  fontFamily: Fonts.sansMedium,
                },
              ]}
            >
              {DAY_LABELS[d.getDay()]}
            </Text>
            <Text
              style={[
                styles.num,
                {
                  color: selected ? palette.onAccent : palette.text,
                  fontFamily: Fonts.displayBold,
                },
              ]}
            >
              {d.getDate()}
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
    width: 54,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  num: { fontSize: 20, letterSpacing: -0.4 },
  label: { fontSize: 11, letterSpacing: 0.6 },
});
