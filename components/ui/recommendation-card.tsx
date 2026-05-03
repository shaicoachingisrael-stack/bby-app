import { useVideoPlayer, VideoView } from 'expo-video';
import { Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  videoSource: number;
  duration: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function RecommendationCard({ videoSource, duration, title, subtitle, onPress }: Props) {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
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
