import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';

type Phase = 'comprendre' | 'essayer' | 'ancrer';
const PHASES: { key: Phase; label: string }[] = [
  { key: 'comprendre', label: 'Comprendre' },
  { key: 'essayer', label: 'Essayer' },
  { key: 'ancrer', label: 'Ancrer' },
];

// Un jour d'un parcours : tout ce que la cliente lit sur l'écran « Jour ».
export default function MindsetStepEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ program: string; day: string }>();
  const programId = params.program;
  const day = Number.parseInt(params.day ?? '1', 10) || 1;

  const [stepId, setStepId] = useState<string | null>(null);
  const [programTitle, setProgramTitle] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<Phase | null>(null);
  const [minutes, setMinutes] = useState('');
  const [idea, setIdea] = useState('');
  const [question, setQuestion] = useState('');
  const [gesture, setGesture] = useState('');
  const [takeAway, setTakeAway] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // « Quitter sans enregistrer ? » : on compare aux valeurs chargées.
  const snapshot = () => JSON.stringify([title, phase, minutes, idea, question, gesture, takeAway]);
  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);
  useEffect(() => {
    if (loaded && initial.current === null) initial.current = snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        supabase.from('mindset_programs').select('title').eq('id', programId).maybeSingle(),
        supabase.from('mindset_program_steps').select('*').eq('program_id', programId).eq('day_number', day).order('sort_order').limit(1),
      ]);
      setProgramTitle((p.data as { title?: string } | null)?.title ?? '');
      const r = ((s.data as any[] | null) ?? [])[0];
      if (r) {
        setStepId(r.id);
        setTitle(r.title ?? '');
        setPhase((r.phase as Phase) ?? null);
        setMinutes(r.minutes ? String(r.minutes) : '');
        setIdea(r.idea ?? '');
        setQuestion(r.prompt_text ?? '');
        setGesture(r.gesture ?? '');
        setTakeAway(r.take_away ?? '');
      } else {
        // Proposition pour un nouveau jour : la phase suit l'ordre habituel des 7 jours.
        setPhase(day <= 2 ? 'comprendre' : day <= 5 ? 'essayer' : 'ancrer');
        setMinutes('5');
      }
      setLoaded(true);
    })();
  }, [programId, day]);

  async function save() {
    if (!title.trim()) {
      Alert.alert('Il manque le titre du jour', 'Ex : « Choisir un seul geste ».');
      return;
    }
    if (!idea.trim()) {
      Alert.alert(
        'Il manque l’idée du jour',
        'C’est le texte principal du jour. Sans lui, ce jour ne s’affiche pas chez les clientes.',
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        program_id: programId,
        day_number: day,
        kind: 'journal_prompt',
        sort_order: 0,
        title: title.trim(),
        phase,
        minutes: Number.parseInt(minutes.replace(/\D/g, ''), 10) || null,
        idea: idea.trim(),
        prompt_text: question.trim() || null,
        gesture: gesture.trim() || null,
        take_away: takeAway.trim() || null,
      };
      const id = stepId ?? Crypto.randomUUID();
      const res = stepId
        ? await supabase.from('mindset_program_steps').update(payload).eq('id', id)
        : await supabase.from('mindset_program_steps').insert({ id, ...payload });
      if (res.error) throw res.error;
      triggerTranslate('mindset_program_steps', id);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!stepId) return router.back();
    Alert.alert(`Effacer le jour ${day} ?`, 'Ses textes seront supprimés.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: async () => {
          leaving.current = true;
          const { error } = await supabase.from('mindset_program_steps').delete().eq('id', stepId);
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

  return (
    <FooterScreen
      footer={
        <ActionBar
          icon={Check}
          label={saving ? 'Enregistrement…' : 'Enregistrer le jour'}
          onPress={save}
          disabled={saving}
          note="Traduit automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader title={`Jour ${day}`} intro={programTitle ? `Parcours « ${programTitle} »` : undefined} />

        <AdminField label="Titre du jour" hint="Le grand titre de l’écran du jour.">
          <AdminInput value={title} onChangeText={setTitle} placeholder="Ex : Choisir un seul geste" />
        </AdminField>

        <AdminField label="Étape" hint="La petite étiquette à côté de « Jour 1/7 ».">
          <AdminChoice options={PHASES} value={phase} onChange={setPhase} />
        </AdminField>

        <AdminField label="Durée (minutes)" hint="Affiché sous le titre : « 5 min ».">
          <AdminInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" placeholder="5" style={{ width: 120 }} />
        </AdminField>

        <AdminField
          label="L’idée du jour"
          hint="Le texte principal, dans la carte blanche. Laisse une ligne vide entre deux paragraphes."
          counter={idea.trim() ? `${idea.trim().length} caractères` : undefined}
        >
          <AdminInput big value={idea} onChangeText={setIdea} placeholder="On a souvent envie de tout changer d’un coup…" style={{ minHeight: 220 }} />
        </AdminField>

        <AdminField label="La question" hint="En italique ; la cliente y répond par écrit (réponse visible par elle seule).">
          <AdminInput value={question} onChangeText={setQuestion} placeholder="Ex : Quel geste aimerais-tu accueillir dans tes journées ?" multiline />
        </AdminField>

        <AdminField label="Le geste" hint="La carte jaune, rappelée aussi sur l’écran Aujourd’hui.">
          <AdminInput value={gesture} onChangeText={setGesture} placeholder="Ex : Imagine-toi en train de faire ce geste, une fois, en entier." multiline />
        </AdminField>

        <AdminField label="La phrase à emporter" hint="En bas de l’écran ; la cliente peut la garder ou la partager.">
          <AdminInput value={takeAway} onChangeText={setTakeAway} placeholder="Ex : Petit n’est pas moins. Petit, c’est ce qui revient." multiline />
        </AdminField>

        {stepId ? <AdminLink label={`Effacer le jour ${day}`} onPress={remove} danger /> : null}
      </View>
    </FooterScreen>
  );
}
