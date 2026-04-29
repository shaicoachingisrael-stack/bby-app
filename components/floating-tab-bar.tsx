import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Calendar, Dumbbell, Apple, Sparkles, MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ICONS = {
  today: Calendar,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Sparkles,
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const bottom = Math.max(insets.bottom, Spacing.lg);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: scheme === 'dark' ? Palette.gray[700] : Palette.encre,
            shadowColor: Palette.encre,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const Icon = ICONS[route.name as keyof typeof ICONS];
          if (!Icon) return null;
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
              hitSlop={8}
            >
              <Icon
                size={22}
                color={isFocused ? Palette.albatre : Palette.gray[400]}
                strokeWidth={isFocused ? 2.4 : 1.8}
              />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Coach IA"
        onPress={() => router.push('/chat')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.background,
            shadowColor: Palette.encre,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <MessageCircle size={24} color={palette.text} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
});
