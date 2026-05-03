import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEGAL_URLS } from '@/lib/legal';

import {
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/auth';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Mode = 'signIn' | 'signUp';
type LoadingState = 'apple' | 'google' | 'email' | null;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<LoadingState>(null);

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

  async function handleEmail() {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Renseigne ton email et ton mot de passe.');
      return;
    }
    if (mode === 'signUp' && password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Au moins 6 caractères.');
      return;
    }
    setLoading('email');
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        const { user, session } = await signUpWithEmail(email, password);
        if (user && !session) {
          Alert.alert(
            'Vérifie ta boîte mail',
            "Un email de confirmation t'a été envoyé. Clique le lien pour activer ton compte.",
          );
        }
      }
    } catch (e: any) {
      Alert.alert(
        mode === 'signIn' ? 'Connexion impossible' : 'Inscription impossible',
        e?.message ?? 'Erreur.',
      );
    } finally {
      setLoading(null);
    }
  }

  const submitting = loading !== null;
  const submitLabel = mode === 'signIn' ? 'Se connecter' : 'Créer mon compte';
  const toggleLabel =
    mode === 'signIn' ? "Pas encore de compte ? Inscris-toi" : 'Déjà inscrit·e ? Connecte-toi';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={Radius.md}
              style={styles.appleButton}
              onPress={handleApple}
            />
          )}

          <Pressable
            onPress={handleGoogle}
            disabled={submitting}
            style={({ pressed }) => [
              styles.oauthButton,
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
                <View style={styles.googleLogo}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={[styles.oauthText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                  Continuer avec Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: palette.border }]} />
          <Text style={[styles.dividerText, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            ou
          </Text>
          <View style={[styles.line, { backgroundColor: palette.border }]} />
        </View>

        <View style={{ gap: Spacing.md }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={palette.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
          />
          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor={palette.textSecondary}
            secureTextEntry
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
          />

          <Pressable
            onPress={handleEmail}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: palette.text,
                opacity: pressed || submitting ? 0.8 : 1,
              },
            ]}
          >
            {loading === 'email' ? (
              <ActivityIndicator color={palette.background} />
            ) : (
              <Text style={[styles.submitText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
                {submitLabel}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'))}
            disabled={submitting}
            hitSlop={12}
          >
            <Text
              style={[
                styles.toggle,
                { color: palette.textSecondary, fontFamily: Fonts.sansMedium },
              ]}
            >
              {toggleLabel}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.legal, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          En continuant, tu acceptes nos{' '}
          <Text
            onPress={() => Linking.openURL(LEGAL_URLS.terms)}
            style={{ color: palette.text, textDecorationLine: 'underline' }}
          >
            conditions
          </Text>
          {' '}et notre{' '}
          <Text
            onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
            style={{ color: palette.text, textDecorationLine: 'underline' }}
          >
            politique de confidentialité
          </Text>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  header: { gap: Spacing.md, marginTop: Spacing.lg },
  eyebrow: { fontSize: 11, letterSpacing: 1.8 },
  title: {
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '92%',
  },
  appleButton: { width: '100%', height: 52 },
  oauthButton: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
  },
  oauthText: { fontSize: 16 },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.albatre,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: { fontSize: 14, fontWeight: '700', color: '#4285F4' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, letterSpacing: 0.4 },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  submitText: { fontSize: 16 },
  toggle: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: Spacing.sm,
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 'auto',
  },
});
