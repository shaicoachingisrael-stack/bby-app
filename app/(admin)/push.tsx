import { useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

export default function PushAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Champs manquants', 'Renseigne un titre et un message.');
      return;
    }
    Alert.alert(
      'Envoyer à toutes les utilisatrices ?',
      'Le push sera envoyé immédiatement à tous les appareils enregistrés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          style: 'destructive',
          onPress: () => doSend(),
        },
      ],
    );
  }

  async function doSend() {
    setSending(true);
    try {
      const url = linkUrl.trim();
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          title: title.trim(),
          body: body.trim(),
          data: url ? { url } : undefined,
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const errors = (data as any)?.errors ?? 0;
      const total = (data as any)?.total ?? 0;
      Alert.alert(
        'Push envoyé',
        `${sent} envoyé(s) sur ${total}${errors ? ` (${errors} erreurs)` : ''}.`,
      );
      setTitle('');
      setBody('');
      setLinkUrl('');
    } catch (e: any) {
      Alert.alert('Échec', e?.message ?? 'Erreur inconnue.');
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            Retour
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Envoyer un push
        </Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          Le message sera envoyé à toutes tes utilisatrices ayant accepté les notifications.
        </Text>

        <Field label="Titre" palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Nouvelle séance dispo"
            placeholderTextColor={palette.textSecondary}
            maxLength={60}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Message" palette={palette}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Ex : Full body 30 min, rejoins-moi maintenant 💪"
            placeholderTextColor={palette.textSecondary}
            multiline
            maxLength={200}
            style={[styles.textarea, inputStyle(palette)]}
          />
        </Field>

        <Field label="Lien (optionnel)" palette={palette}>
          <TextInput
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="/training, /today, /session/<id>…"
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, inputStyle(palette)]}
          />
          <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sans, fontSize: 12 }}>
            Au tap sur la notif, l'app ouvre cette page. Laisse vide pour rester là où elle est.
          </Text>
        </Field>

        <Pressable
          onPress={handleSend}
          disabled={sending}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: palette.text,
              opacity: pressed || sending ? 0.85 : 1,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <>
              <Send size={18} color={palette.background} />
              <Text
                style={[styles.ctaText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}
              >
                Envoyer à tout le monde
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  palette,
}: {
  label: string;
  children: React.ReactNode;
  palette: any;
}) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text
        style={{
          color: palette.textSecondary,
          fontFamily: Fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 1.4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function inputStyle(palette: any) {
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: Fonts.sans,
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 32, letterSpacing: -0.5, marginTop: Spacing.lg },
  subtitle: { fontSize: 14, lineHeight: 22 },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textarea: {
    minHeight: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 56,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  ctaText: { fontSize: 16 },
});
