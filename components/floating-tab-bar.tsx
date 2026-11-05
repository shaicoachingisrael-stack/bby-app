import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Apple, Dumbbell, Home, Leaf, MessageCircleMore } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentFill } from '@/components/ui/accent-fill';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_MUTED = '#A99DAA';

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
          intensity={scheme === 'light' ? 60 : 40}
          tint={scheme === 'light' ? 'light' : 'dark'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.tabBg,
            { backgroundColor: palette.tabBar },
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
                {/* l'onglet actif : icône claire posée sur une petite pastille de verre */}
                <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
                  <Icon size={22} color={isFocused ? palette.text : TAB_MUTED} strokeWidth={isFocused ? 2.1 : 1.9} />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? palette.text : TAB_MUTED,
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
        accessibilityLabel={t('tabs.coachIa')}
        onPress={() => router.push('/chat')}
        style={({ pressed }) => [
          styles.fab,
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <View style={styles.fabInner}>
          <AccentFill />
          <MessageCircleMore size={24} color="#FFFFFF" strokeWidth={2} />
        </View>
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
    maxWidth: 520,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
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
  iconPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  iconPillActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  // Coach IA : rond braise à part du menu, cerclé d'un halo de verre
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  fabInner: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
