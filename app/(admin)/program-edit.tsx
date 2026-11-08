import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { MediaUploader } from '@/components/ui/media-uploader';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';
import type { Program } from '@/lib/types';

const LEVEL_OPTIONS = [
  { key: 'debutant', label: 'Débutante' },
  { key: 'intermediaire', label: 'Intermédiaire' },
  { key: 'avance', label: 'Avancée' },
] as const;

type Level = (typeof LEVEL_OPTIONS)[number]['key'];

// Un programme d'entraînement : la carte de l'onglet Training.
export default function ProgramEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  // Generate a stable UUID for new programs so the cover upload path is well-defined.
  const programId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState<Level | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // « Quitter sans enregistrer ? » : on compare aux valeurs chargées.
  const snapshot = () => JSON.stringify([title, description, duration, level, coverUrl]);
  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);
  useEffect(() => {
    if (!loading && initial.current === null) initial.current = snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      Alert.alert('Il manque le titre', 'Donne un nom à ton programme avant d’enregistrer.');
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
        cover_url: coverUrl?.trim() || null,
      };
      if (isNew) {
        const { error } = await supabase.from('programs').insert({ id: programId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('programs').update(payload).eq('id', id!);
        if (error) throw error;
      }
      triggerTranslate('programs', programId);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
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
              leaving.current = true;
              router.back();
            } catch (e: any) {
              Alert.alert('Suppression impossible', e?.message ?? 'Réessaie dans un instant.');
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Check}
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={handleSave}
          disabled={saving}
          note="Traduit automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title={isNew ? 'Nouveau programme' : 'Le programme'}
          intro="La grande carte jaune de l’onglet Training et la liste des programmes."
        />

        <AdminField label="Titre" hint="Le titre de la carte du programme.">
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Full body débutant" />
        </AdminField>

        <AdminField label="Description" hint="Quelques lignes sur le programme. Facultatif.">
          <AdminInput value={description} onChangeText={setDescription} placeholder="Ex : Quatre semaines pour reprendre en douceur…" multiline />
        </AdminField>

        <AdminField label="Niveau" hint="Affiché à côté du titre.">
          <AdminChoice options={LEVEL_OPTIONS as any} value={level} onChange={(v: Level) => setLevel(v)} />
        </AdminField>

        <AdminField label="Durée (semaines)" hint="Affiché sur la carte : « 4 sem. ».">
          <AdminInput value={duration} onChangeText={setDuration} placeholder="Ex : 4" keyboardType="number-pad" style={{ width: 120 }} />
        </AdminField>

        <AdminField label="Photo" hint="La photo des séances de ce programme (Training et Aujourd’hui).">
          <MediaUploader
            kind="image"
            bucket="program-covers"
            pathPrefix={programId}
            url={coverUrl || null}
            onChange={(u) => setCoverUrl(u ?? '')}
          />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer ce programme" onPress={handleDelete} danger /> : null}
      </View>
    </FooterScreen>
  );
}
