import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Palette, Spacing } from '@/constants/theme';

export default function VideoViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();

  const player = useVideoPlayer(url ?? null, (p) => {
    if (url) {
      p.loop = false;
      p.muted = false;
      p.play();
    }
  });

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
      />
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={[
          styles.close,
          { top: insets.top + Spacing.sm, right: Spacing.lg },
        ]}
      >
        <X size={20} color={Palette.encre} />
      </Pressable>
      {title ? (
        <View style={[styles.titleBar, { top: insets.top + Spacing.sm }]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  close: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.albatre,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleBar: {
    position: 'absolute',
    left: Spacing.lg,
    right: 60,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    color: Palette.albatre,
    fontFamily: Fonts.sansSemibold,
    fontSize: 14,
  },
});
