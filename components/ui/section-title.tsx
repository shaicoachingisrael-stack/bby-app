import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  title: string;
  action?: string;
  onActionPress?: () => void;
};

export function SectionTitle({ title, action, onActionPress }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
        {title}
      </Text>
      {action && (
        <Text
          onPress={onActionPress}
          style={[styles.action, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}
        >
          {action}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  action: {
    fontSize: 13,
  },
});
