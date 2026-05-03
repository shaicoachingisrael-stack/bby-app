import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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

import { MediaUploader } from '@/components/ui/media-uploader';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { Program, Session } from '@/lib/types';

export default function SessionEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string; programId?: string }>();
  const id = params.id;
  const isNew = !id;
  const sessionId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string | null>(params.programId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('programs')
        .select('id, title')
        .order('title', { ascending: true });
      setPrograms((data as any) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) console.warn('session fetch', error);
      if (data) {
        const s = data as Session;
        setProgramId(s.program_id ?? null);
        setTitle(s.title);
        setDescription(s.description ?? '');
        setDuration(s.duration_min?.toString() ?? '');
        setVideoUrl(s.video_url ?? '');
        setOrderIndex(s.order_index?.toString() ?? '');
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
        return Number.isFinite(n) && n >= 0 ? n : null;
      };
      const payload = {
        program_id: programId,
        title: title.trim(),
        description: description.trim() || null,
        duration_min: num(duration),
        video_url: videoUrl?.trim() || null,
        order_index: num(orderIndex) ?? 0,
      };
      if (isNew) {
        const { error } = await supabase.from('sessions').insert({ id: sessionId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sessions').update(payload).eq('id', id!);
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
    Alert.alert('Supprimer cette séance ?', 'Action définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('sessions').delete().eq('id', id!);
            if (error) throw error;
            router.back();
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View
        style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}
      >
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
          {isNew ? 'Nouvelle séance' : 'Modifier la séance'}
        </Text>

        <Field label="Programme" palette={palette}>
          <View style={{ gap: Spacing.sm }}>
            <Pressable
              onPress={() => setProgramId(null)}
              style={[
                styles.programOption,
                {
                  backgroundColor: programId === null ? palette.text : palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text
                style={{
                  color: programId === null ? palette.background : palette.text,
                  fontFamily: Fonts.sansMedium,
                  fontSize: 14,
                }}
              >
                Sans programme
              </Text>
              {programId === null && <Check size={16} color={palette.background} />}
            </Pressable>
            {programs.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProgramId(p.id)}
                style={[
                  styles.programOption,
                  {
                    backgroundColor: programId === p.id ? palette.text : palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: programId === p.id ? palette.background : palette.text,
                    fontFamily: Fonts.sansMedium,
                    fontSize: 14,
                  }}
                  numberOfLines={1}
                >
                  {p.title}
                </Text>
                {programId === p.id && <Check size={16} color={palette.background} />}
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Titre" palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Full body — focus glutes"
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

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Durée (min)" palette={palette}>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                placeholder="35"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Ordre" palette={palette}>
              <TextInput
                value={orderIndex}
                onChangeText={setOrderIndex}
                placeholder="0"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                style={[styles.input, inputStyle(palette)]}
              />
            </Field>
          </View>
        </View>

        <Field label="Vidéo" palette={palette}>
          <MediaUploader
            kind="video"
            bucket="session-videos"
            pathPrefix={sessionId}
            url={videoUrl || null}
            onChange={(u) => setVideoUrl(u ?? '')}
          />
        </Field>

        {!isNew && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>
              Supprimer la séance
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
  programOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
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
