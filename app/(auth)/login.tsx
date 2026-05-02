import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInWithApple, signInWithGoogle } from '@/lib/auth';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  async function handleApple() {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Connexion impossible', e?.message ?? 'Erreur Apple.');
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Connexion impossible', e?.message ?? 'Erreur Google.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top + Spacing.xxxl,
          paddingBottom: insets.bottom + Spacing.xxl,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary, fontFamily: Fonts.sansSemibold }]}>
          BODY BY YOU
        </Text>
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Bienvenue.
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Ton coaching muscu, nutrition et mindset, dans une seule app.
        </Text>
      </View>

      <View style={{ gap: Spacing.md }}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              palette.background === Palette.encre
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={Radius.md}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}

        <Pressable
          onPress={handleGoogle}
          disabled={loading !== null}
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading === 'google' ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <>
              <GoogleLogo />
              <Text style={[styles.googleText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                Continuer avec Google
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={[styles.legal, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
        En continuant, tu acceptes nos conditions et notre politique de confidentialité.
      </Text>
    </View>
  );
}

function GoogleLogo() {
  return (
    <View style={styles.googleLogo}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  header: { gap: Spacing.md, marginTop: Spacing.xxl },
  eyebrow: { fontSize: 11, letterSpacing: 1.8 },
  title: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '92%',
  },
  appleButton: {
    width: '100%',
    height: 54,
  },
  googleButton: {
    height: 54,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
  },
  googleText: { fontSize: 16 },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
