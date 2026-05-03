import { Check, LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

export function OnboardingOption({ icon: Icon, title, description, selected, onPress }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? palette.text : palette.surface,
          borderColor: selected ? palette.text : palette.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: selected ? palette.background : palette.background },
        ]}
      >
        <Icon size={20} color={selected ? palette.text : palette.text} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.title,
            {
              color: selected ? palette.background : palette.text,
              fontFamily: Fonts.sansSemibold,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.desc,
            {
              color: selected ? palette.background : palette.textSecondary,
              opacity: selected ? 0.85 : 1,
              fontFamily: Fonts.sans,
            },
          ]}
        >
          {description}
        </Text>
      </View>
      {selected && (
        <View style={[styles.check, { backgroundColor: palette.background }]}>
          <Check size={14} color={palette.text} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, marginBottom: 2 },
  desc: { fontSize: 13 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
