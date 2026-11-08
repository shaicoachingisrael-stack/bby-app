import * as Crypto from 'expo-crypto';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { AdminField, AdminHeader, AdminInput, AdminLink, AdminRow, a, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby, PillButton } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { MediaUploader } from '@/components/ui/media-uploader';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';

type Step = { id: string; day_number: number; title: string | null; phase: string | null; idea: string | null };

const PHASES: Record<string, string> = { comprendre: 'Comprendre', essayer: 'Essayer', ancrer: 'Ancrer' };

// Fiche d'un parcours de 7 jours (Mindset) : textes de la fiche + liste des jours.
export default function MindsetProgramEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isNew = !params.id;
  const itemId = useMemo(() => params.id ?? Crypto.randomUUID(), [params.id]);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [minutesRange, setMinutesRange] = useState('5 à 10 min');
  const [dayCount, setDayCount] = useState('7');
  const [forYouIf, setForYouIf] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exists, setExists] = useState(!isNew);
  const dirtyRef = useRef(false);
  useLeaveGuard(() => dirtyRef.current);

  // Recharge au retour d'un jour (la liste peut avoir changé).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [p, s] = await Promise.all([
          supabase.from('mindset_programs').select('*').eq('id', itemId).maybeSingle(),
          supabase
            .from('mindset_program_steps')
            .select('id, day_number, title, phase, idea')
            .eq('program_id', itemId)
            .order('day_number', { ascending: true }),
        ]);
        if (!alive) return;
        if (p.data && !dirty) {
          const r = p.data as any;
          setTitle(r.title ?? '');
          setSubtitle(r.subtitle ?? '');
          setMinutesRange(r.minutes_range ?? '');
          setDayCount(String(r.day_count ?? 7));
          setForYouIf(r.for_you_if ?? '');
          setDescription(r.description ?? '');
          setPhotoUrl(r.photo_url ?? r.cover_url ?? '');
          setExists(true);
        }
        setSteps((s.data as Step[] | null) ?? []);
        setLoaded(true);
      })();
      return () => {
        alive = false;
      };
    }, [itemId, dirty]),
  );

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    markDirty();
  };

  const days = Math.max(1, Math.min(30, Number.parseInt(dayCount.replace(/\D/g, ''), 10) || 7));

  async function save(thenOpenDay?: number) {
    if (!title.trim()) {
      Alert.alert('Il manque le titre', 'Donne un nom à ton parcours avant d’enregistrer.');
      return false;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        minutes_range: minutesRange.trim() || null,
        day_count: days,
        for_you_if: forYouIf.trim() || null,
        description: description.trim() || null,
        photo_url: photoUrl.trim() || null,
        cover_url: photoUrl.trim() || null,
      };
      const res = exists
        ? await supabase.from('mindset_programs').update(payload).eq('id', itemId)
        : await supabase.from('mindset_programs').insert({ id: itemId, ...payload });
      if (res.error) throw res.error;
      setExists(true);
      dirtyRef.current = false;
      setDirty(false);
      triggerTranslate('mindset_programs', itemId);
      if (thenOpenDay) {
        router.push(`/(admin)/mindset-step-edit?program=${itemId}&day=${thenOpenDay}` as any);
      } else {
        router.back();
      }
      return true;
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Ouvrir un jour : si la fiche n'est pas encore enregistrée, on l'enregistre d'abord.
  const openDay = (n: number) => {
    if (!exists || dirty) save(n);
    else router.push(`/(admin)/mindset-step-edit?program=${itemId}&day=${n}` as any);
  };

  function remove() {
    Alert.alert('Supprimer ce parcours ?', 'Les jours écrits seront supprimés aussi. Les clientes ne le verront plus.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          dirtyRef.current = false;
          const { error } = await supabase.from('mindset_programs').delete().eq('id', itemId);
          if (error) Alert.alert('Suppression impossible', error.message);
          else router.back();
        },
      },
    ]);
  }

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  const byDay = new Map(steps.map((s) => [s.day_number, s]));
  const written = steps.filter((s) => s.idea?.trim()).length;
  const extra = steps.filter((s) => s.day_number > days);

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Check}
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={() => save()}
          disabled={saving}
          note="Traduit automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title={isNew ? 'Nouveau parcours' : 'Le parcours'}
          intro="Ce que la cliente lit sur la fiche du parcours, avant de commencer."
        />

        <AdminField label="Titre" hint="Le grand titre de la fiche et de la liste « À découvrir ».">
          <AdminInput value={title} onChangeText={edit(setTitle)} placeholder="Ex : Installer une nouvelle habitude" />
        </AdminField>

        <AdminField label="Phrase sous le titre" hint="En italique, juste sous le titre.">
          <AdminInput value={subtitle} onChangeText={edit(setSubtitle)} placeholder="Ex : Faire de la place à un geste qui compte…" multiline />
        </AdminField>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AdminField label="Durée par jour" hint="Ex : 5 à 10 min">
              <AdminInput value={minutesRange} onChangeText={edit(setMinutesRange)} placeholder="5 à 10 min" />
            </AdminField>
          </View>
          <View style={{ width: 110 }}>
            <AdminField label="Jours" hint="De 1 à 30">
              <AdminInput value={dayCount} onChangeText={edit(setDayCount)} keyboardType="number-pad" placeholder="7" />
            </AdminField>
          </View>
        </View>

        <AdminField label="Pour toi si" hint="Le bloc « Pour toi si » : à qui s’adresse ce parcours.">
          <AdminInput
            big
            value={forYouIf}
            onChangeText={edit(setForYouIf)}
            placeholder="Ex : Tu as déjà essayé de prendre une habitude qui n’a pas tenu…"
          />
        </AdminField>

        <AdminField label="Photo" hint="En haut de la fiche. Facultatif.">
          <MediaUploader
            kind="image"
            bucket="mindset-media"
            pathPrefix={`${itemId}/cover`}
            url={photoUrl || null}
            onChange={(u) => edit(setPhotoUrl)(u ?? '')}
          />
        </AdminField>

        <AdminField label="Note interne (facultatif)" hint="Description libre, pour toi.">
          <AdminInput value={description} onChangeText={edit(setDescription)} placeholder="Ce que tu veux retenir sur ce parcours" multiline />
        </AdminField>

        <View style={{ gap: 10 }}>
          <View style={a.rowBetween}>
            <Text style={a.label}>Les jours</Text>
            <Text style={a.counter}>{`${written} / ${days} écrits`}</Text>
          </View>
          <Text style={a.hint}>
            Touche un jour pour l’écrire. Le parcours apparaît chez les clientes dès qu’un jour a son « idée du jour ».
          </Text>
          {Array.from({ length: days }, (_, i) => i + 1).map((n) => {
            const s = byDay.get(n);
            const done = !!s?.idea?.trim();
            return (
              <AdminRow
                key={n}
                top={`Jour ${n}${s?.phase ? ` · ${PHASES[s.phase] ?? s.phase}` : ''}`}
                title={done ? s?.title || 'Sans titre' : 'À écrire'}
                sub={done ? s?.idea?.trim() : undefined}
                empty={!done}
                onPress={() => openDay(n)}
              />
            );
          })}
          {extra.length ? (
            <Text style={a.hint}>
              {`${extra.length} jour(s) au-delà du jour ${days} sont gardés mais pas montrés. Augmente le nombre de jours pour les revoir.`}
            </Text>
          ) : null}
          {days < 30 ? (
            <PillButton
              label="Ajouter un jour"
              icon={Plus}
              variant="outline"
              onPress={() => {
                setDayCount(String(days + 1));
                markDirty();
              }}
            />
          ) : null}
        </View>

        {exists ? <AdminLink label="Supprimer ce parcours" onPress={remove} danger /> : null}
      </View>
    </FooterScreen>
  );
}
