import { useVideoPlayer, VideoView } from 'expo-video';
import { Plus, Trash2, Video } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/text';

import { BFont, Bby } from '@/components/bby/kit';
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
      Alert.alert('Envoi impossible', e?.message ?? 'Erreur.');
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
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <Row key={it.id} item={it} index={i} onRemove={() => handleRemove(it.id)} />
      ))}

      <Pressable
        onPress={handleAdd}
        disabled={busy}
        style={({ pressed }) => [
          styles.addBtn,
          {
            backgroundColor: Bby.card,
            borderColor: Bby.line,
            opacity: pressed || busy ? 0.85 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={Bby.text} />
        ) : (
          <>
            <Plus size={18} color={Bby.text} />
            <Text style={[styles.addText, { color: Bby.text, fontFamily: BFont.sansSemibold }]}>
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
  onRemove,
}: {
  item: MediaAttachment;
  index: number;
  onRemove: () => void;
}) {
  const player = useVideoPlayer(item.url, (p) => {
    p.muted = true;
  });

  return (
    <View style={[styles.row, { backgroundColor: Bby.card }]}>
      <View style={styles.thumb}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.thumbOverlay}>
          <Video size={14} color={Bby.text} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: Bby.text, fontFamily: BFont.sansSemibold }]}>
          {item.title?.trim() || `Vidéo ${index + 1}`}
        </Text>
        <Text style={[styles.rowMeta, { color: Bby.muted, fontFamily: BFont.sans }]} numberOfLines={1}>
          {fileName(item.url)}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={({ pressed }) => [styles.trash, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Trash2 size={16} color={Bby.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 16,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Bby.cardAlt,
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
  rowTitle: { fontSize: 15 },
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
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addText: { fontSize: 14 },
});

// Nom du fichier d'une adresse ; une adresse mal formée ne doit pas faire tomber l'écran.
function fileName(url: string) {
  try {
    return new URL(url).pathname.split('/').pop() ?? url;
  } catch {
    return url;
  }
}
