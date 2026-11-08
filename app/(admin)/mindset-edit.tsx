import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { MediaList } from '@/components/ui/media-list';
import { MediaUploader } from '@/components/ui/media-uploader';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';
import type { MindsetContent } from '@/lib/types';

const KIND_OPTIONS = [
  { key: 'meditation', label: 'Méditation' },
  { key: 'article', label: 'Article' },
  { key: 'affirmation', label: 'Affirmation' },
] as const;

type Kind = (typeof KIND_OPTIONS)[number]['key'];

export default function MindsetEditScreen() {
  const router = useRouter();
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

  // « Quitter sans enregistrer ? » : on compare aux valeurs chargées.
  const snapshot = () => JSON.stringify([kind, title, body, coverUrl, duration]);
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
      Alert.alert('Il manque le titre', 'Donne un titre à ce contenu avant d’enregistrer.');
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
      triggerTranslate('mindset_content', itemId);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer ce contenu ?', 'Il sera effacé définitivement.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            leaving.current = true;
            const { error } = await supabase.from('mindset_content').delete().eq('id', id!);
            if (error) throw error;
            router.back();
          } catch (e: any) {
            leaving.current = false;
            Alert.alert('Suppression impossible', e?.message ?? 'Réessaie dans un instant.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  const bodyPlaceholder = {
    meditation: 'Étapes de la méditation guidée…',
    article: 'Le texte de ton article…',
    affirmation: '« Je suis à ma juste place. »',
  }[kind];

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
          title={isNew ? 'Nouveau contenu' : 'Le contenu'}
          intro="Méditation, article ou affirmation de ta bibliothèque Mindset."
        />

        <AdminField label="Type" hint="Le genre de contenu.">
          <AdminChoice options={KIND_OPTIONS as unknown as { key: Kind; label: string }[]} value={kind} onChange={setKind} />
        </AdminField>

        <AdminField label="Titre" hint="Le titre affiché en haut du contenu.">
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Respiration consciente" />
        </AdminField>

        <AdminField label="Photo de couverture" hint="L’image en haut du contenu. Facultatif.">
          <MediaUploader kind="image" bucket="mindset-media" pathPrefix={`${itemId}/cover`} url={coverUrl || null} onChange={(u) => setCoverUrl(u ?? '')} />
        </AdminField>

        <AdminField label="Vidéos" hint="Vidéos ajoutées sous le texte. Facultatif.">
          <MediaList parentType="mindset" parentId={itemId} bucket="mindset-media" />
        </AdminField>

        <AdminField label="Durée (minutes)" hint="Affichée à côté du type : « 5 min ».">
          <AdminInput value={duration} onChangeText={setDuration} placeholder="5" keyboardType="number-pad" style={{ width: 120 }} />
        </AdminField>

        <AdminField label="Texte" hint="Le contenu lui-même. Laisse une ligne vide entre deux paragraphes.">
          <AdminInput big value={body} onChangeText={setBody} placeholder={bodyPlaceholder} style={{ minHeight: 220 }} />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer ce contenu" onPress={handleDelete} danger /> : null}
      </View>
    </FooterScreen>
  );
}
