import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AdminField, AdminHeader, AdminInput, AdminLink, a, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { supabase } from '@/lib/supabase';

// Repères nutrition d'une cliente, réglés par la coach.
// L'app de la cliente calcule ses calories à partir des macros (4 / 9 / 4 kcal par gramme) :
// on fait donc saisir protéines, lipides, glucides et eau, et les calories suivent.
type Row = { protein_g: number | null; fats_g: number | null; carbs_g: number | null; water_ml: number | null; set_by_coach: boolean };

const num = (v: string) => {
  const n = Number.parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

export default function ClientTargetsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carb, setCarb] = useState('');
  const [water, setWater] = useState('');
  const [byCoach, setByCoach] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const initial = useRef<string | null>(null);
  const leaving = useRef(false);
  const snapshot = () => JSON.stringify([protein, fat, carb, water]);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);

  async function load() {
    const [p, t] = await Promise.all([
      supabase.from('profiles').select('display_name, protein_target_g, hydration_target_ml').eq('id', id).maybeSingle(),
      supabase.from('nutrition_targets').select('protein_g, fats_g, carbs_g, water_ml, set_by_coach').eq('user_id', id).maybeSingle(),
    ]);
    const prof = p.data as { display_name: string | null; protein_target_g: number | null; hydration_target_ml: number | null } | null;
    const row = t.data as Row | null;
    setName(prof?.display_name?.trim() || 'cette cliente');
    const vals = [
      String(row?.protein_g ?? prof?.protein_target_g ?? ''),
      String(row?.fats_g ?? ''),
      String(row?.carbs_g ?? ''),
      String(row?.water_ml ?? prof?.hydration_target_ml ?? ''),
    ];
    setProtein(vals[0]);
    setFat(vals[1]);
    setCarb(vals[2]);
    setWater(vals[3]);
    setByCoach(!!row?.set_by_coach);
    initial.current = JSON.stringify(vals);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const P = num(protein);
  const L = num(fat);
  const G = num(carb);
  const kcal = P !== null && L !== null && G !== null ? 4 * P + 9 * L + 4 * G : null;

  async function save() {
    const W = num(water);
    if (P === null || L === null || G === null || W === null) {
      Alert.alert('Il manque un chiffre', 'Remplis protéines, lipides, glucides et eau.');
      return;
    }
    if (kcal !== null && (kcal < 900 || kcal > 5000)) {
      Alert.alert('Chiffres à vérifier', `Cela fait ${kcal} kcal par jour. Vérifie les grammes saisis.`);
      return;
    }
    setSaving(true);
    try {
      const t = await supabase.from('nutrition_targets').upsert(
        {
          user_id: id,
          protein_g: P,
          fats_g: L,
          carbs_g: G,
          calories: kcal,
          water_ml: W,
          set_by_coach: true,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (t.error) throw t.error;
      // Mêmes valeurs dans son profil (« Mon compte » les affiche).
      const p = await supabase
        .from('profiles')
        .update({ daily_kcal_target: kcal, protein_target_g: P, hydration_target_ml: W })
        .eq('id', id);
      if (p.error) throw p.error;
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function backToAuto() {
    Alert.alert(
      'Revenir au calcul automatique ?',
      'Ses repères seront recalculés d’après son âge, sa taille, son poids et son activité.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Recalculer',
          onPress: async () => {
            const r = await supabase.from('nutrition_targets').update({ set_by_coach: false }).eq('user_id', id);
            if (r.error) return Alert.alert('Impossible', r.error.message);
            await supabase.rpc('compute_nutrition_targets_for_user', { p_user_id: id });
            setLoaded(false);
            await load();
          },
        },
      ],
    );
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
          label={saving ? 'Enregistrement…' : 'Enregistrer ses repères'}
          onPress={save}
          disabled={saving}
          note="Elle les voit tout de suite dans Nutrition."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader
          title="Ses repères"
          intro={`Les repères du jour de ${name}, dans Nutrition › Aujourd’hui. Ce sont ses repères « Maintien » : si elle choisit un rythme Perte de gras ou Prise de masse, l’app les ajuste un peu.`}
        />

        <View style={st.status}>
          <Text style={st.statusText}>
            {byCoach
              ? 'Réglés par toi. Ils ne changent plus quand elle modifie son poids ou son activité.'
              : 'Calculés automatiquement d’après son profil. Si tu les modifies, ils restent fixés jusqu’à ce que tu reviennes au calcul automatique.'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AdminField label="Protéines" hint="g / jour">
              <AdminInput value={protein} onChangeText={setProtein} keyboardType="number-pad" placeholder="110" />
            </AdminField>
          </View>
          <View style={{ flex: 1 }}>
            <AdminField label="Lipides" hint="g / jour">
              <AdminInput value={fat} onChangeText={setFat} keyboardType="number-pad" placeholder="60" />
            </AdminField>
          </View>
          <View style={{ flex: 1 }}>
            <AdminField label="Glucides" hint="g / jour">
              <AdminInput value={carb} onChangeText={setCarb} keyboardType="number-pad" placeholder="200" />
            </AdminField>
          </View>
        </View>

        <View style={st.kcal}>
          <Text style={st.kcalLabel}>Calories (calculées)</Text>
          <Text style={st.kcalValue}>{kcal !== null ? `${kcal} kcal` : '—'}</Text>
          <Text style={[a.hint, { color: Bby.ink }]}>Protéines × 4 + lipides × 9 + glucides × 4.</Text>
        </View>

        <AdminField label="Eau" hint="ml / jour (ex : 2000 = 2 litres).">
          <AdminInput value={water} onChangeText={setWater} keyboardType="number-pad" placeholder="2000" style={{ width: 160 }} />
        </AdminField>

        {byCoach ? <AdminLink label="Revenir au calcul automatique" onPress={backToAuto} /> : null}
      </View>
    </FooterScreen>
  );
}

const st = StyleSheet.create({
  status: { backgroundColor: Bby.card, borderRadius: 16, padding: 14 },
  statusText: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 20, color: Bby.text },
  kcal: { backgroundColor: Bby.yellow, borderRadius: 20, padding: 16, gap: 4 },
  kcalLabel: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.ink },
  kcalValue: { fontFamily: BFont.display, fontSize: 30, color: Bby.ink },
});
