import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MediaAttachment } from '@/lib/types';

type Props = {
  attachments: MediaAttachment[];
  title?: string;
};

export function AttachmentCarousel({ attachments, title = 'Vidéos supplémentaires' }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];

  if (attachments.length === 0) return null;

  return (
    <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
      <View style={{ paddingHorizontal: Spacing.xl }}>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {title}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
      >
        {attachments.map((a, i) => (
          <AttachmentTile key={a.id} attachment={a} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

function AttachmentTile({
  attachment,
  index,
}: {
  attachment: MediaAttachment;
  index: number;
}) {
  const router = useRouter();
  const player = useVideoPlayer(attachment.url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <Pressable
      onPress={() =>
        router.push(
          `/video-viewer?url=${encodeURIComponent(attachment.url)}&title=${encodeURIComponent(
            attachment.title ?? `Vidéo ${index + 1}`,
          )}` as any,
        )
      }
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
      <View style={styles.playBadge}>
        <Play size={18} color={Palette.encre} fill={Palette.encre} />
      </View>
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          {attachment.title?.trim() || `Vidéo ${index + 1}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, letterSpacing: -0.3 },
  tile: {
    width: 200,
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.gray[200],
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.22)',
  },
  playBadge: {
    alignSelf: 'flex-end',
    margin: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.albatre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    margin: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  labelText: {
    color: Palette.albatre,
    fontSize: 12,
    fontFamily: Fonts.sansSemibold,
  },
});
