import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { MediaList } from '@/components/ui/media-list';
import { MediaUploader } from '@/components/ui/media-uploader';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';
import type { Program, Session } from '@/lib/types';

// Une séance : sa vidéo, son titre, son programme.
export default function SessionEditScreen() {
  const router = useRouter();
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

  // « Quitter sans enregistrer ? » : on compare aux valeurs chargées.
  const snapshot = () => JSON.stringify([programId, title, description, duration, videoUrl, orderIndex]);
  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);
  useEffect(() => {
    if (!loading && initial.current === null) initial.current = snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      Alert.alert('Il manque le titre', 'Donne un nom à ta séance avant d’enregistrer.');
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
      triggerTranslate('sessions', sessionId);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer cette séance ?', 'C’est définitif.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('sessions').delete().eq('id', id!);
            if (error) throw error;
            leaving.current = true;
            router.back();
          } catch (e: any) {
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

  const options: { id: string | null; title: string }[] = [{ id: null, title: 'Sans programme' }, ...programs];

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
          title={isNew ? 'Nouvelle séance' : 'La séance'}
          intro="Ce que la cliente voit quand elle ouvre une séance de l’onglet Training."
        />

        <AdminField label="Programme" hint="Le programme dans lequel la séance apparaît.">
          <View style={{ gap: 8 }}>
            {options.map((p) => {
              const on = programId === p.id;
              return (
                <Pressable
                  key={p.id ?? 'none'}
                  onPress={() => setProgramId(p.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[s.option, on && s.optionOn]}
                >
                  <Text style={[s.optionText, on && { color: Bby.ink }]} numberOfLines={1}>
                    {p.title}
                  </Text>
                  {on ? <Check size={18} color={Bby.ink} /> : null}
                </Pressable>
              );
            })}
          </View>
        </AdminField>

        <AdminField label="Titre" hint="Le titre de la séance (Training et Aujourd’hui).">
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Full body — focus glutes" />
        </AdminField>

        <AdminField label="Description" hint="Sous la vidéo, dans la séance. Facultatif.">
          <AdminInput value={description} onChangeText={setDescription} placeholder="Ex : Un enchaînement sans sauts…" multiline />
        </AdminField>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AdminField label="Durée (min)" hint="Ex : 35">
              <AdminInput value={duration} onChangeText={setDuration} placeholder="35" keyboardType="number-pad" />
            </AdminField>
          </View>
          <View style={{ flex: 1 }}>
            <AdminField label="Ordre" hint="1re séance = 0">
              <AdminInput value={orderIndex} onChangeText={setOrderIndex} placeholder="0" keyboardType="number-pad" />
            </AdminField>
          </View>
        </View>

        <AdminField label="Vidéo principale" hint="La vidéo qui se lance dans la séance.">
          <MediaUploader
            kind="video"
            bucket="session-videos"
            pathPrefix={sessionId}
            url={videoUrl || null}
            onChange={(u) => setVideoUrl(u ?? '')}
          />
        </AdminField>

        <AdminField label="Vidéos supplémentaires" hint="D’autres vidéos sous la principale. Ajoutées tout de suite, sans enregistrer.">
          <MediaList parentType="session" parentId={sessionId} bucket="session-videos" />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer cette séance" onPress={handleDelete} danger /> : null}
      </View>
    </FooterScreen>
  );
}

const s = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Bby.line,
    backgroundColor: Bby.card,
  },
  optionOn: { backgroundColor: Bby.yellow, borderColor: 'transparent' },
  optionText: { flex: 1, fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
});
