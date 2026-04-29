import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function Screen({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingHorizontal: Spacing.xl,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            { color: palette.text, fontFamily: Fonts.displayBold },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: palette.textSecondary,
                fontFamily: Fonts.sans,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
        <View style={{ marginTop: Spacing.xl }}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: Spacing.xs },
});
