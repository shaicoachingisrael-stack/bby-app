import { useVideoPlayer, VideoView } from 'expo-video';
import { Plus, Trash2, Video } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAttachments } from '@/lib/use-attachments';
import {
  inferExt,
  MediaBucket,
  pickMedia,
  uploadMedia,
} from '@/lib/upload';
import type { AttachmentParentType, MediaAttachment } from '@/lib/types';

type Props = {
  parentType: AttachmentParentType;
  parentId: string;
  bucket: MediaBucket;
};

export function MediaList({ parentType, parentId, bucket }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];
  const { items, add, remove } = useAttachments(parentType, parentId);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setBusy(true);
    try {
      const picked = await pickMedia('video');
      if (!picked) {
        setBusy(false);
        return;
      }
      const ext = inferExt(picked.mimeType, 'mp4');
      const filename = `${Date.now()}.${ext}`;
      const url = await uploadMedia(bucket, `${parentId}/extras/${filename}`, picked);
      await add(url);
    } catch (e: any) {
      Alert.alert('Upload impossible', e?.message ?? 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(id: string) {
    Alert.alert('Supprimer cette vidéo ?', 'Action immédiate.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      {items.map((it, i) => (
        <Row key={it.id} item={it} index={i} palette={palette} onRemove={() => handleRemove(it.id)} />
      ))}

      <Pressable
        onPress={handleAdd}
        disabled={busy}
        style={({ pressed }) => [
          styles.addBtn,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed || busy ? 0.85 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <>
            <Plus size={18} color={palette.text} />
            <Text style={[styles.addText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {items.length === 0 ? 'Ajouter une vidéo' : 'Ajouter une autre vidéo'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function Row({
  item,
  index,
  palette,
  onRemove,
}: {
  item: MediaAttachment;
  index: number;
  palette: any;
  onRemove: () => void;
}) {
  const player = useVideoPlayer(item.url, (p) => {
    p.muted = true;
  });

  return (
    <View style={[styles.row, { backgroundColor: palette.surface }]}>
      <View style={styles.thumb}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.thumbOverlay}>
          <Video size={14} color={Palette.albatre} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
          {item.title?.trim() || `Vidéo ${index + 1}`}
        </Text>
        <Text style={[styles.rowMeta, { color: palette.textSecondary, fontFamily: Fonts.sans }]} numberOfLines={1}>
          {new URL(item.url).pathname.split('/').pop()}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Trash2 size={16} color={palette.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Palette.gray[300],
  },
  thumbOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  rowTitle: { fontSize: 14 },
  rowMeta: { fontSize: 11, marginTop: 2 },
  trash: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addText: { fontSize: 14 },
});
