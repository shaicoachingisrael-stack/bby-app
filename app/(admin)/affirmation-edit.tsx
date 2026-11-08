import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { AdminField, AdminHeader, AdminInput, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby, TiltCard } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Modifier l'affirmation d'une date ; aperçu de la carte jaune telle que la cliente la verra.
export default function AffirmationEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ month: string; day: string }>();
  const month = Number(params.month);
  const day = Number(params.day);
  const [text, setText] = useState('');
  const [exists, setExists] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  useLeaveGuard(() => !leaving.current && initial.current !== null && text.trim() !== initial.current);

  useEffect(() => {
    supabase
      .from('daily_affirmations')
      .select('text')
      .eq('month', month)
      .eq('day', day)
      .maybeSingle()
      .then(({ data }) => {
        const t = data ? ((data as { text: string }).text ?? '') : '';
        if (data) {
          setText(t);
          setExists(true);
        }
        initial.current = t.trim();
        setLoaded(true);
      });
  }, [month, day]);

  async function save() {
    const t = text.trim();
    if (!t) {
      Alert.alert('Phrase vide', 'Écris l’affirmation de ce jour avant d’enregistrer.');
      return;
    }
    setSaving(true);
    try {
      const res = exists
        ? await supabase.from('daily_affirmations').update({ text: t, updated_at: new Date().toISOString() }).eq('month', month).eq('day', day)
        : await supabase.from('daily_affirmations').insert({ month, day, text: t });
      if (res.error) throw res.error;
      triggerTranslate('daily_affirmations', `${month}-${day}`);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
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
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={save}
          disabled={saving}
          note="Traduite automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader title={`${day} ${MONTHS[month - 1] ?? ''}`} intro="L’affirmation que toutes les clientes liront ce jour-là." />
        <AdminField label="Affirmation" hint="Une phrase courte, à la première personne." counter={`${text.trim().length} caractères`}>
          <AdminInput big value={text} onChangeText={setText} placeholder="Ex : Je protège mon énergie quand les jours raccourcissent." style={{ minHeight: 120 }} />
        </AdminField>
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: BFont.sansBold, fontSize: 15, color: Bby.text }}>Aperçu</Text>
          <TiltCard>
            <Text style={{ fontFamily: BFont.display, fontSize: 17, color: Bby.ink }}>Affirmation du jour</Text>
            <Text style={{ fontFamily: BFont.serif, fontSize: 22, lineHeight: 30, color: Bby.ink, marginTop: 10 }}>
              {text.trim() || '…'}
            </Text>
          </TiltCard>
        </View>
      </View>
    </FooterScreen>
  );
}
