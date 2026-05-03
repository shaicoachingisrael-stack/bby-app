import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type FileKind = 'image' | 'video';

export type PickedFile = {
  uri: string;
  mimeType: string;
};

export async function pickMedia(kind: FileKind): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Accès à la photothèque refusé. Active-le dans les Réglages.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      kind === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: kind === 'image',
    aspect: kind === 'image' ? [16, 9] : undefined,
    quality: kind === 'image' ? 0.85 : undefined,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
    videoMaxDuration: 600, // 10 min cap
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType:
      asset.mimeType ?? (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
  };
}

export type MediaBucket =
  | 'program-covers'
  | 'session-videos'
  | 'recipe-media'
  | 'mindset-media';

export async function uploadMedia(
  bucket: MediaBucket,
  path: string,
  picked: PickedFile,
): Promise<string> {
  const bytes = await new File(picked.uri).bytes();

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: picked.mimeType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  // Cache-bust so a re-upload at the same path shows the new asset immediately.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function inferExt(mimeType: string, fallback: 'jpg' | 'mp4') {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('quicktime') || mimeType.includes('mov')) return 'mov';
  if (mimeType.includes('mp4')) return 'mp4';
  return fallback;
}
