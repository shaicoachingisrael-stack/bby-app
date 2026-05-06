import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Apple, Dumbbell, Home, Leaf, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ICONS = {
  today: Home,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Leaf,
} as const;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const LABELS: Record<string, string> = {
    today: t('tabs.today'),
    training: t('tabs.training'),
    nutrition: t('tabs.nutrition'),
    mindset: t('tabs.mindset'),
  };
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const bottom = Math.max(insets.bottom, Spacing.md);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom }]}>
      <View style={[styles.tabPill, { borderColor: palette.border }]}>
        <BlurView
          intensity={scheme === 'dark' ? 40 : 60}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.tabBg,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(20,20,18,0.7)' : 'rgba(250,250,248,0.82)',
            },
          ]}
        />

        <View style={styles.tabRow}>
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
                accessibilityLabel={options.tabBarAccessibilityLabel ?? LABELS[route.name]}
                onPress={onPress}
                style={styles.tabButton}
                hitSlop={8}
              >
                <Icon
                  size={22}
                  color={isFocused ? palette.text : palette.textSecondary}
                  strokeWidth={isFocused ? 2.2 : 1.8}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? palette.text : palette.textSecondary,
                      fontFamily: isFocused ? Fonts.sansSemibold : Fonts.sansMedium,
                    },
                  ]}
                >
                  {LABELS[route.name]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Coach IA"
        onPress={() => router.push('/chat')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.text,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Sparkles size={20} color={palette.background} strokeWidth={2} />
        <Text style={[styles.fabLabel, { color: palette.background, fontFamily: Fonts.sansMedium }]}>
          {t('tabs.coachIa')}
        </Text>
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
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  tabPill: {
    flex: 1,
    height: 76,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabBg: {
    ...StyleSheet.absoluteFillObject,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: { fontSize: 10, letterSpacing: 0.2 },
  fab: {
    width: 70,
    height: 76,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  fabLabel: { fontSize: 9, letterSpacing: 0.2 },
});
