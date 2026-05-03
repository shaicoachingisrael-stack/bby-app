import { Image } from 'expo-image';
import { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status?: 'pending' | 'done' | 'skipped';
  imageSource?: string | null;
  onPress?: () => void;
};

export function ActivityCard({
  icon: Icon,
  title,
  subtitle,
  status = 'pending',
  imageSource,
  onPress,
}: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: palette.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: imageSource ? palette.text : palette.background,
            overflow: 'hidden',
          },
        ]}
      >
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Icon size={20} color={palette.text} strokeWidth={1.8} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {subtitle}
        </Text>
      </View>
      {status === 'done' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 15, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.encre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Palette.albatre,
    fontSize: 13,
    fontWeight: '700',
  },
});
