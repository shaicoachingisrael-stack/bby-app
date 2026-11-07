// Barre du bas de la refonte : capsule sombre flottante, l'onglet actif est une
// pilule jaune. Le cinquième bouton ouvre le Coach IA (écran à part, pas un onglet).
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Dumbbell, Feather, MessageCircle, Sun, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bby } from '@/components/bby/kit';

const ICONS: Record<string, LucideIcon> = {
  today: Sun,
  training: Dumbbell,
  nutrition: UtensilsCrossed,
  mindset: Feather,
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const LABELS: Record<string, string> = {
    today: t('tabs.today'),
    training: t('tabs.training'),
    nutrition: t('tabs.nutrition'),
    mindset: t('tabs.mindset'),
  };
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const Icon = ICONS[route.name];
          if (!Icon) return null;
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? LABELS[route.name]}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
              hitSlop={4}
            >
              <Icon size={24} color={isFocused ? Bby.ink : Bby.muted} strokeWidth={1.9} />
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.coachIa')}
          onPress={() => router.push('/chat')}
          style={styles.tab}
          hitSlop={4}
        >
          <MessageCircle size={24} color={Bby.muted} strokeWidth={1.9} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 18 },
  bar: {
    width: '100%',
    maxWidth: 520,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1E1E1D',
    borderWidth: 1,
    borderColor: 'rgba(250,250,248,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: { flex: 1, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  tabActive: { flex: 1.6, backgroundColor: Bby.yellow },
});
