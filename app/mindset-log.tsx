import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
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

import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const KIND_OPTIONS = [
  { value: 'intention', label: 'Intention' },
  { value: 'journal', label: 'Journal' },
  { value: 'meditation_done', label: 'Méditation' },
] as const;

const MOOD_OPTIONS = [
  { value: 'great', label: 'Top' },
  { value: 'good', label: 'Bien' },
  { value: 'neutral', label: 'Neutre' },
  { value: 'tired', label: 'Fatigue' },
  { value: 'low', label: 'Bas' },
] as const;

type Kind = (typeof KIND_OPTIONS)[number]['value'];
type Mood = (typeof MOOD_OPTIONS)[number]['value'];

const PLACEHOLDERS: Record<Kind, string> = {
  intention: 'Ex : « Je fais ce qui est bon pour moi. »',
  journal: 'Comment tu te sens, ce qui s\'est passé aujourd\'hui…',
  meditation_done: 'Quelques mots sur ta séance de méditation.',
};

export default function MindsetLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ kind?: string }>();

  const [kind, setKind] = useState<Kind>(
    KIND_OPTIONS.some((k) => k.value === params.kind)
      ? (params.kind as Kind)
      : 'intention',
  );
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!body.trim()) {
      Alert.alert('Vide', 'Écris quelque chose avant de sauvegarder.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('mindset_entries').insert({
        user_id: user.id,
        kind,
        body: body.trim(),
        mood,
      });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
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
        <Pressable onPress={save} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              Enregistrer
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Mindset
        </Text>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>Type</Label>
          <Segmented value={kind} options={KIND_OPTIONS as any} onChange={(v: Kind) => setKind(v)} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>Humeur</Label>
          <Segmented
            value={mood}
            options={MOOD_OPTIONS as any}
            onChange={(v: Mood) => setMood(v)}
          />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>Contenu</Label>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={PLACEHOLDERS[kind]}
            placeholderTextColor={palette.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.textarea,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
                fontFamily: Fonts.sans,
              },
            ]}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ children, palette }: any) {
  return (
    <Text
      style={{
        color: palette.textSecondary,
        fontFamily: Fonts.sansMedium,
        fontSize: 11,
        letterSpacing: 1.4,
      }}
    >
      {children.toString().toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: Spacing.lg,
  },
  textarea: {
    minHeight: 220,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    fontSize: 16,
    lineHeight: 22,
  },
});
