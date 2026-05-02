import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { supabase } from './supabase';

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

GoogleSignin.configure({
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error("Sign in with Apple n'est disponible que sur iOS.");
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign in failed: no identity token returned.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;

  if (data.user && credential.fullName) {
    const displayName = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    if (displayName) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user.id);
    }
  }

  return data;
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();

    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error('Google sign in failed: no id token returned.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return data;
  } catch (e: any) {
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw e;
  }
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore: user might not be Google-signed-in
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
