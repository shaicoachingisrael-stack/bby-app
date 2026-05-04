import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';

export type HeroItem = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: string;
  videoSource?: number | string | null;
  imageSource?: string | null;
  cta?: string;
  onPress?: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const SLIDE_HEIGHT = SLIDE_WIDTH * 1.25;

type Props = {
  items: HeroItem[];
};

export function HeroSwiper({ items }: Props) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  return (
    <View style={{ alignItems: 'center' }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH + Spacing.md}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          gap: Spacing.md,
        }}
        onMomentumScrollEnd={(e) => {
          const offset = e.nativeEvent.contentOffset.x;
          const i = Math.round(offset / (SLIDE_WIDTH + Spacing.md));
          setIndex(Math.max(0, Math.min(items.length - 1, i)));
        }}
      >
        {items.map((it) => (
          <HeroSlide key={it.id} item={it} />
        ))}
      </ScrollView>

      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === index ? 24 : 6,
                  backgroundColor: i === index ? Palette.encre : Palette.gray[300],
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function HeroSlide({ item }: { item: HeroItem }) {
  const player = useVideoPlayer(item.videoSource ?? null, (p) => {
    if (item.videoSource) {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  });

  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.slide,
        { opacity: pressed ? 0.95 : 1 },
      ]}
    >
      {item.videoSource ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : item.imageSource ? (
        <Image
          source={{ uri: item.imageSource }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.gray[300] }]} />
      )}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      <View style={styles.content}>
        <Text style={styles.eyebrow}>{item.eyebrow.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
        {item.meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {item.meta}
          </Text>
        )}
        {item.cta && (
          <View style={styles.ctaPill}>
            {item.videoSource && <Play size={14} color={Palette.albatre} fill={Palette.albatre} />}
            <Text style={styles.ctaText}>{item.cta}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(10,10,10,0.18)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(10,10,10,0.45)',
  },
  content: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
    gap: 6,
  },
  eyebrow: {
    color: Palette.albatre,
    fontSize: 11,
    letterSpacing: 1.6,
    fontFamily: Fonts.sansSemibold,
    opacity: 0.9,
    marginBottom: 6,
  },
  title: {
    color: Palette.albatre,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontFamily: Fonts.displayBold,
  },
  subtitle: {
    color: Palette.albatre,
    fontSize: 16,
    fontFamily: Fonts.sans,
    opacity: 0.92,
    marginTop: 2,
  },
  meta: {
    color: Palette.albatre,
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    opacity: 0.85,
    marginTop: 2,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Palette.encre,
    marginTop: Spacing.md,
  },
  ctaText: {
    color: Palette.albatre,
    fontSize: 13,
    fontFamily: Fonts.sansSemibold,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
