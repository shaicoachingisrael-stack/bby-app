import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ImagePlus, RefreshCw, Trash2, Video } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FileKind, inferExt, pickMedia, uploadMedia } from '@/lib/upload';

type Props = {
  kind: FileKind;
  bucket: 'program-covers' | 'session-videos';
  pathPrefix: string; // e.g. `${programId}` or `${sessionId}`
  url: string | null;
  onChange: (newUrl: string | null) => void;
};

export function MediaUploader({ kind, bucket, pathPrefix, url, onChange }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);

  async function handlePick() {
    setBusy('upload');
    try {
      const picked = await pickMedia(kind);
      if (!picked) {
        setBusy(null);
        return;
      }
      const ext = inferExt(picked.mimeType, kind === 'image' ? 'jpg' : 'mp4');
      const filename = kind === 'image' ? `cover.${ext}` : `main.${ext}`;
      const newUrl = await uploadMedia(bucket, `${pathPrefix}/${filename}`, picked);
      onChange(newUrl);
    } catch (e: any) {
      Alert.alert('Upload impossible', e?.message ?? 'Erreur.');
    } finally {
      setBusy(null);
    }
  }

  function handleRemove() {
    Alert.alert(
      kind === 'image' ? "Supprimer l'image ?" : 'Supprimer la vidéo ?',
      'Le fichier reste dans le storage mais ne sera plus lié.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onChange(null),
        },
      ],
    );
  }

  if (!url) {
    return (
      <Pressable
        onPress={handlePick}
        disabled={busy !== null}
        style={({ pressed }) => [
          styles.empty,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {busy === 'upload' ? (
          <>
            <ActivityIndicator color={palette.text} />
            <Text style={[styles.emptyText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
              {kind === 'image' ? 'Upload en cours…' : 'Upload de la vidéo…'}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.emptyIcon, { backgroundColor: palette.text }]}>
              {kind === 'image' ? (
                <ImagePlus size={20} color={palette.background} />
              ) : (
                <Video size={20} color={palette.background} />
              )}
            </View>
            <Text style={[styles.emptyText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              {kind === 'image' ? 'Ajouter une image' : 'Ajouter une vidéo'}
            </Text>
            <Text
              style={[
                styles.emptyHint,
                { color: palette.textSecondary, fontFamily: Fonts.sans },
              ]}
            >
              Depuis ta photothèque
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.previewWrap, { backgroundColor: palette.surface }]}>
      {kind === 'image' ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <VideoPreview url={url} />
      )}

      <View style={styles.previewBar}>
        <Pressable
          onPress={handlePick}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.barBtn,
            { backgroundColor: 'rgba(10,10,10,0.65)', opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {busy === 'upload' ? (
            <ActivityIndicator color={Palette.albatre} size="small" />
          ) : (
            <>
              <RefreshCw size={14} color={Palette.albatre} />
              <Text style={styles.barBtnText}>Remplacer</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={handleRemove}
          style={({ pressed }) => [
            styles.barBtn,
            { backgroundColor: 'rgba(168,54,42,0.85)', opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Trash2 size={14} color={Palette.albatre} />
          <Text style={styles.barBtnText}>Retirer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VideoPreview({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    aspectRatio: 16 / 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: { fontSize: 15 },
  emptyHint: { fontSize: 12 },
  previewWrap: {
    aspectRatio: 16 / 9,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  previewBar: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  barBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  barBtnText: {
    color: Palette.albatre,
    fontSize: 11,
    fontWeight: '600',
  },
});
