import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  source: number;
  eyebrow: string;
  title: string;
  meta: string;
  onPress?: () => void;
};

export function HeroVideoCard({ source, eyebrow, title, meta, onPress }: Props) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>{meta}</Text>
          <View style={styles.playButton}>
            <Play size={18} color={Palette.encre} fill={Palette.encre} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.32)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  eyebrow: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Palette.albatre,
    opacity: 0.85,
  },
  title: {
    fontFamily: Fonts.displayBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: Palette.albatre,
    maxWidth: '85%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.albatre,
    opacity: 0.85,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.albatre,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
