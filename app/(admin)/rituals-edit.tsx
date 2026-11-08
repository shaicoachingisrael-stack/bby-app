import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { AdminField, AdminHeader, AdminInput, AdminLink, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { RITUAL_ICON_KEYS, ritualIcon } from '@/lib/ritual-icons';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';
import type { RitualCatalogItem } from '@/lib/types';

/** Grille d'icônes : 5 cases par ligne, taille calculée en points (pas de % + aspectRatio). */
function IconGrid({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const [w, setW] = useState(0);
  const cols = 5;
  const gap = 10;
  const cell = w ? (w - gap * (cols - 1)) / cols : 0;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {RITUAL_ICON_KEYS.map((key) => {
        const Icon = ritualIcon(key);
        const on = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{
              width: cell || 56,
              height: cell ? Math.round(cell * 0.82) : 48,
              borderRadius: 16,
              backgroundColor: on ? Bby.yellow : Bby.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color={on ? Bby.ink : Bby.text} strokeWidth={2} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function RitualsEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  const itemId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('leaf');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // « Quitter sans enregistrer ? » : on compare aux valeurs chargées.
  const snapshot = () => JSON.stringify([label, icon, sortOrder]);
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
      const { data, error } = await supabase.from('mindset_ritual_catalog').select('*').eq('id', id!).maybeSingle();
      if (error) console.warn('ritual_catalog fetch', error);
      if (data) {
        const c = data as RitualCatalogItem;
        setLabel(c.label);
        setIcon(c.icon);
        setSortOrder(c.sort_order?.toString() ?? '0');
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function handleSave() {
    if (!label.trim()) {
      Alert.alert('Il manque le nom', 'Ex : « Boire un verre d’eau au réveil ».');
      return;
    }
    setSaving(true);
    try {
      const order = Number.parseInt(sortOrder.replace(/\D/g, ''), 10) || 0;
      const payload = { label: label.trim(), icon, sort_order: order };
      if (isNew) {
        const { error } = await supabase.from('mindset_ritual_catalog').insert({ id: itemId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mindset_ritual_catalog').update(payload).eq('id', id!);
        if (error) throw error;
      }
      triggerTranslate('mindset_ritual_catalog', itemId);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer ce rituel ?', 'Il ne sera plus proposé aux clientes. Celles qui l’ont déjà ajouté le gardent.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            leaving.current = true;
            const { error } = await supabase.from('mindset_ritual_catalog').delete().eq('id', id!);
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
          title={isNew ? 'Nouveau rituel' : 'Le rituel'}
          intro="Proposé aux clientes dans Mindset › Rituels › « Ajouter un rituel »."
        />

        <AdminField label="Nom du rituel" hint="Ce que la cliente lit dans le catalogue et dans sa liste du jour.">
          <AdminInput value={label} onChangeText={setLabel} placeholder="Ex : Boire un verre d’eau au réveil" />
        </AdminField>

        <AdminField label="Icône" hint="Le petit dessin à gauche du rituel.">
          <IconGrid value={icon} onChange={setIcon} />
        </AdminField>

        <AdminField label="Position dans la liste" hint="0 = en haut. Plus le nombre est grand, plus le rituel est bas.">
          <AdminInput value={sortOrder} onChangeText={setSortOrder} placeholder="0" keyboardType="number-pad" style={{ width: 120 }} />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer ce rituel" onPress={handleDelete} danger /> : null}
      </View>
    </FooterScreen>
  );
}
