import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/types';

const LEVEL_OPTIONS = [
  { value: 'debutant', label: 'Débutante' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancée' },
] as const;

type Level = (typeof LEVEL_OPTIONS)[number]['value'];

export default function ProgramEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState<Level | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) console.warn('program fetch', error);
      if (data) {
        const p = data as Program;
        setTitle(p.title);
        setDescription(p.description ?? '');
        setDuration(p.duration_weeks?.toString() ?? '');
        setLevel((p.level as Level) ?? null);
        setCoverUrl(p.cover_url ?? '');
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Titre manquant');
      return;
    }
    setSaving(true);
    try {
      const num = (s: string) => {
        const n = Number.parseInt(s.replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n > 0 ? n : null;
      };
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        duration_weeks: num(duration),
        level,
        cover_url: coverUrl.trim() || null,
      };
      if (isNew) {
        const { error } = await supabase.from('programs').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('programs').update(payload).eq('id', id!);
        if (error) throw error;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer ce programme ?',
      'Les séances liées seront aussi supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('programs').delete().eq('id', id!);
              if (error) throw error;
              router.back();
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
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
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
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
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {isNew ? 'Nouveau programme' : 'Modifier le programme'}
        </Text>

        <Field label="Titre" palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Full body débutant"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Description" palette={palette}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optionnel"
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.textarea, inputStyle(palette)]}
          />
        </Field>

        <Field label="Niveau" palette={palette}>
          <Segmented
            value={level}
            options={LEVEL_OPTIONS as any}
            onChange={(v: Level) => setLevel(v)}
          />
        </Field>

        <Field label="Durée (semaines)" palette={palette}>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="Ex : 4"
            placeholderTextColor={palette.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="URL de la cover (optionnel)" palette={palette}>
          <TextInput
            value={coverUrl}
            onChangeText={setCoverUrl}
            placeholder="https://..."
            placeholderTextColor={palette.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        {!isNew && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.danger,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>
              Supprimer le programme
            </Text>
          </Pressable>
        )}
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
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
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
  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#A8362A',
    marginTop: Spacing.lg,
  },
  dangerText: { color: Palette.albatre, fontSize: 15 },
});
