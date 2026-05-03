import { useVideoPlayer, VideoView } from 'expo-video';
import { Clock, Play } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  duration?: string;
  level?: string;
  videoSource?: number;
  onPress?: () => void;
};

export function SessionCard({
  eyebrow,
  title,
  subtitle,
  duration,
  level,
  videoSource,
  onPress,
}: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  const player = useVideoPlayer(videoSource ?? null, (p) => {
    if (videoSource) {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {eyebrow}
        </Text>
        <Text
          style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        {(duration || level) && (
          <View style={styles.meta}>
            {duration && (
              <View style={styles.metaItem}>
                <Clock size={12} color={palette.textSecondary} />
                <Text style={[styles.metaText, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                  {duration}
                </Text>
              </View>
            )}
            {level && (
              <Text style={[styles.metaText, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
                {level}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.right}>
        {videoSource && (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        )}
        <View style={styles.playBadge}>
          <Play size={14} color={Palette.albatre} fill={Palette.albatre} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: 160,
    gap: Spacing.lg,
    alignItems: 'stretch',
  },
  left: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.6 },
  title: { fontSize: 22, lineHeight: 26, letterSpacing: -0.3, marginTop: 6 },
  subtitle: { fontSize: 13, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  right: {
    width: 130,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  playBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.encre,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
