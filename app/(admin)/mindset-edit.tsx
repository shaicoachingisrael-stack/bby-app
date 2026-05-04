import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
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

import { MediaList } from '@/components/ui/media-list';
import { MediaUploader } from '@/components/ui/media-uploader';
import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { MindsetContent } from '@/lib/types';

const KIND_OPTIONS = [
  { value: 'meditation', label: 'Méditation' },
  { value: 'article', label: 'Article' },
  { value: 'affirmation', label: 'Affirmation' },
] as const;

type Kind = (typeof KIND_OPTIONS)[number]['value'];

export default function MindsetEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  const itemId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [kind, setKind] = useState<Kind>('article');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('mindset_content').select('*').eq('id', id!).maybeSingle();
      if (error) console.warn('mindset_content fetch', error);
      if (data) {
        const m = data as MindsetContent;
        setKind(m.kind as Kind);
        setTitle(m.title);
        setBody(m.body ?? '');
        setCoverUrl(m.cover_url ?? '');
        setDuration(m.duration_min?.toString() ?? '');
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
        kind,
        title: title.trim(),
        body: body.trim() || null,
        cover_url: coverUrl?.trim() || null,
        duration_min: num(duration),
      };
      if (isNew) {
        const { error } = await supabase.from('mindset_content').insert({ id: itemId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mindset_content').update(payload).eq('id', id!);
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
    Alert.alert('Supprimer ce contenu ?', 'Action définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('mindset_content').delete().eq('id', id!);
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
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  const bodyPlaceholder = {
    meditation: 'Étapes de la méditation guidée…',
    article: 'Le texte de ton article…',
    affirmation: '« Je suis à ma juste place. »',
  }[kind];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
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
          {isNew ? 'Nouveau contenu mindset' : 'Modifier le contenu'}
        </Text>

        <Field label="Type" palette={palette}>
          <Segmented
            value={kind}
            options={KIND_OPTIONS as any}
            onChange={(v: Kind) => setKind(v)}
          />
        </Field>

        <Field label="Titre" palette={palette}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Respiration consciente"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Image de couverture" palette={palette}>
          <MediaUploader
            kind="image"
            bucket="mindset-media"
            pathPrefix={`${itemId}/cover`}
            url={coverUrl || null}
            onChange={(u) => setCoverUrl(u ?? '')}
          />
        </Field>

        <Field label="Vidéos supplémentaires" palette={palette}>
          <MediaList
            parentType="mindset"
            parentId={itemId}
            bucket="mindset-media"
          />
        </Field>

        <Field label="Durée (min)" palette={palette}>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="5"
            placeholderTextColor={palette.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Contenu" palette={palette}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={bodyPlaceholder}
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.textareaTall, inputStyle(palette)]}
          />
        </Field>

        {!isNew && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>
              Supprimer le contenu
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, palette }: { label: string; children: React.ReactNode; palette: any }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 1.4 }}>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  input: {
    height: 52, borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, fontSize: 16,
  },
  textareaTall: {
    minHeight: 200, borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.lg, fontSize: 15, lineHeight: 22, textAlignVertical: 'top',
  },
  danger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 52, borderRadius: Radius.md, backgroundColor: '#A8362A', marginTop: Spacing.lg,
  },
  dangerText: { color: Palette.albatre, fontSize: 15 },
});
