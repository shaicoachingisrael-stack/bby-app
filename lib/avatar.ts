import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type PickResult = {
  uri: string;
  mimeType: string;
};

export async function pickAvatarFromLibrary(): Promise<PickResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Accès à la photothèque refusé. Active-le dans les Réglages.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function takeAvatarPhoto(): Promise<PickResult | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Accès à la caméra refusé. Active-le dans les Réglages.");
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function uploadAvatar(userId: string, picked: PickResult) {
  const ext = picked.mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const bytes = await new File(picked.uri).bytes();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: picked.mimeType,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the new avatar shows up immediately even though path is stable.
  return `${data.publicUrl}?v=${Date.now()}`;
}
