import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Clock, type LucideIcon } from 'lucide-react-native';
import { useId } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { TileColors, type TileColor } from '@/components/ui/tiles';
import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  videoSource?: number | string | null;
  imageSource?: string | null;
  duration: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  // sans image ni vidéo : un fond dégradé de cette couleur avec cette icône
  icon?: LucideIcon;
  color?: TileColor;
};

export function RecommendationCard({
  videoSource,
  imageSource,
  duration,
  title,
  subtitle,
  onPress,
  icon: Icon,
  color = 'violet',
}: Props) {
  const gid = useId().replace(/:/g, '');
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
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      {videoSource ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={TileColors[color].from} />
                <Stop offset="1" stopColor={TileColors[color].to} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
          </Svg>
          {Icon ? (
            <View style={styles.fallbackIcon}>
              <Icon size={64} color="rgba(255,255,255,0.85)" strokeWidth={1.4} />
            </View>
          ) : null}
        </View>
      )}
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.duration}>
          <Clock size={11} color={Palette.albatre} />
          <Text style={styles.durationText}>{duration}</Text>
        </View>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
  },
  fallbackIcon: { position: 'absolute', right: 16, top: 52 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.28)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  duration: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  durationText: {
    color: Palette.albatre,
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
  },
  title: {
    color: Palette.albatre,
    fontSize: 15,
    fontFamily: Fonts.sansSemibold,
    letterSpacing: -0.1,
  },
  subtitle: {
    color: Palette.albatre,
    fontSize: 12,
    fontFamily: Fonts.sans,
    opacity: 0.85,
    marginTop: 2,
  },
});
