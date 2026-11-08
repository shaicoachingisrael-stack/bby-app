import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { AdminChoice, AdminField, AdminHeader, AdminInput, AdminLink, a, useLeaveGuard } from '@/components/bby/admin/ui';
import { ActionBar, BFont, Bby } from '@/components/bby/kit';
import { FooterScreen } from '@/components/bby/nutrition/ui';
import { FOOD_CATEGORIES } from '@/lib/nutrition/food-categories';
import { fold } from '@/lib/nutrition/foods';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';

// Comment l'aliment se mesure. « weight » : la portion est un poids/volume (100 g, 250 ml) ;
// sinon c'est un nombre d'unités (1 pièce, 2 tranches, 1 c. à soupe) dont on donne le poids total.
const UNITS: { key: string; label: string; one: string; many: string; weight?: boolean; perUnit?: boolean }[] = [
  { key: 'g', label: 'Grammes', one: 'g', many: 'g', weight: true },
  { key: 'ml', label: 'Millilitres', one: 'ml', many: 'ml', weight: true },
  { key: 'piece', label: 'Pièce', one: 'pièce', many: 'pièces', perUnit: true },
  { key: 'slice', label: 'Tranche', one: 'tranche', many: 'tranches', perUnit: true },
  { key: 'egg', label: 'Œuf', one: 'œuf', many: 'œufs', perUnit: true },
  { key: 'cas', label: 'C. à soupe', one: 'c. à soupe', many: 'c. à soupe' },
  { key: 'cac', label: 'C. à café', one: 'c. à café', many: 'c. à café' },
  { key: 'handful', label: 'Poignée', one: 'poignée', many: 'poignées' },
  { key: 'bowl', label: 'Bol', one: 'bol', many: 'bols' },
  { key: 'serving', label: 'Portion', one: 'portion', many: 'portions' },
];

const dec = (v: string) => {
  const n = Number.parseFloat(v.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const show = (n: unknown) => (n === null || n === undefined ? '' : String(n).replace('.', ','));

export default function FoodEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isNew = !params.id;
  const itemId = useMemo(() => params.id ?? Crypto.randomUUID(), [params.id]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [unit, setUnit] = useState('g');
  const [count, setCount] = useState('100');
  const [grams, setGrams] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carb, setCarb] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);

  const initial = useRef<string | null>(isNew ? JSON.stringify(['', null, 'g', '100', '', '', '', '', '']) : null);
  const leaving = useRef(false);
  const snapshot = () => JSON.stringify([name, category, unit, count, grams, protein, fat, carb, barcode]);
  useLeaveGuard(() => !leaving.current && initial.current !== null && snapshot() !== initial.current);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from('food_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle()
      .then(({ data }) => {
        const r = data as any;
        if (r) {
          const vals = [
            r.name ?? '',
            r.category ?? null,
            r.portion_type ?? 'g',
            show(r.portion_count ?? 1),
            UNITS.find((u) => u.key === r.portion_type)?.weight ? '' : show(r.portion_g),
            show(r.protein_g),
            show(r.fat_g),
            show(r.carb_g),
            r.barcode ?? '',
          ];
          [setName, setCategory, setUnit, setCount, setGrams, setProtein, setFat, setCarb, setBarcode].forEach((set: any, i) => set(vals[i]));
          initial.current = JSON.stringify(vals);
        }
        setLoaded(true);
      });
  }, [isNew, itemId]);

  const u = UNITS.find((x) => x.key === unit) ?? UNITS[0];
  const n = dec(count);
  const P = dec(protein);
  const L = dec(fat);
  const G = dec(carb);
  const kcal = P !== null && L !== null && G !== null ? Math.round(4 * P + 9 * L + 4 * G) : null;
  const portionLabel = n ? `${show(n)} ${u.weight ? u.one : n > 1 ? u.many : u.one}` : '';

  async function save() {
    const cleanName = name.trim();
    if (!cleanName) return Alert.alert('Il manque le nom', 'Ex : « Skyr nature ».');
    if (!category) return Alert.alert('Choisis une catégorie', 'Elle sert à ranger l’aliment.');
    if (!n || n <= 0) return Alert.alert('Portion à compléter', u.weight ? 'Indique la quantité de référence (ex : 100).' : 'Indique combien (ex : 1).');
    const weight = u.weight ? n : dec(grams);
    if (!weight || weight <= 0) return Alert.alert('Poids à compléter', `Combien pèse ${portionLabel}, en grammes ?`);
    if (P === null || L === null || G === null) return Alert.alert('Valeurs à compléter', 'Remplis protéines, lipides et glucides pour cette portion.');
    setSaving(true);
    try {
      const payload = {
        name: cleanName,
        name_key: fold(cleanName),
        category,
        portion_type: unit,
        portion_count: n,
        portion_label: portionLabel,
        portion_g: weight,
        piece_g: u.perUnit ? Math.round((weight / n) * 10) / 10 : null,
        protein_g: P,
        fat_g: L,
        carb_g: G,
        kcal: kcal ?? 0,
        barcode: barcode.trim() || null,
      };
      const res = isNew
        ? await supabase.from('food_items').insert({ id: itemId, ...payload })
        : await supabase.from('food_items').update(payload).eq('id', itemId);
      if (res.error) {
        const msg = res.error.message ?? '';
        if (msg.includes('name_key')) throw new Error(`« ${cleanName} » existe déjà dans la liste. Cherche-le pour le modifier.`);
        if (msg.includes('barcode')) throw new Error('Ce code-barres est déjà utilisé par un autre aliment.');
        throw res.error;
      }
      triggerTranslate('food_items', itemId);
      leaving.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Enregistrement impossible', e?.message ?? 'Réessaie dans un instant.');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    Alert.alert('Supprimer cet aliment ?', 'Tes clientes ne le trouveront plus dans « Noter mon repas ». Les repas déjà notés ne changent pas.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          leaving.current = true;
          const { error } = await supabase.from('food_items').delete().eq('id', itemId);
          if (error) {
            leaving.current = false;
            Alert.alert('Suppression impossible', error.message);
          } else router.back();
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
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={save}
          disabled={saving}
          note="Nom et portion traduits automatiquement dans les 4 autres langues."
        />
      }
    >
      <View style={{ gap: 22 }}>
        <AdminHeader title={isNew ? 'Nouvel aliment' : 'L’aliment'} intro="Les valeurs se lisent sur l’emballage, ou sur la table Ciqual de l’Anses." />

        <AdminField label="Nom" hint="Comme tes clientes le chercheraient.">
          <AdminInput value={name} onChangeText={setName} placeholder="Ex : Skyr nature" />
        </AdminField>

        <AdminField label="Catégorie">
          <AdminChoice options={FOOD_CATEGORIES} value={category} onChange={setCategory} />
        </AdminField>

        <AdminField label="Il se mesure en…" hint="La portion proposée quand une cliente le note.">
          <AdminChoice
            options={UNITS.map((x) => ({ key: x.key, label: x.label }))}
            value={unit}
            onChange={(k) => {
              setUnit(k);
              const nu = UNITS.find((x) => x.key === k);
              if (nu?.weight && (!dec(count) || dec(count)! < 10)) setCount('100');
              if (!nu?.weight && (dec(count) ?? 0) >= 10) setCount('1');
            }}
          />
        </AdminField>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AdminField label={u.weight ? `Quantité (${u.one})` : 'Combien'} hint={u.weight ? 'Ex : 100' : 'Ex : 1'}>
              <AdminInput value={count} onChangeText={setCount} keyboardType="decimal-pad" placeholder={u.weight ? '100' : '1'} />
            </AdminField>
          </View>
          {!u.weight ? (
            <View style={{ flex: 1 }}>
              <AdminField label="Poids total (g)" hint={portionLabel ? `Le poids de ${portionLabel}` : 'En grammes'}>
                <AdminInput value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="Ex : 60" />
              </AdminField>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={a.label}>{portionLabel ? `Pour ${portionLabel}` : 'Pour cette portion'}</Text>
          <Text style={a.hint}>Les grammes de protéines, lipides et glucides dans cette portion (virgule acceptée).</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              ['Protéines', protein, setProtein],
              ['Lipides', fat, setFat],
              ['Glucides', carb, setCarb],
            ].map(([label, value, set]: any) => (
              <View key={label} style={{ flex: 1, gap: 6 }}>
                <Text style={st.small}>{label}</Text>
                <AdminInput value={value} onChangeText={set} keyboardType="decimal-pad" placeholder="0" />
              </View>
            ))}
          </View>
        </View>

        <View style={st.kcal}>
          <Text style={st.kcalLabel}>{`Calories ${portionLabel ? `pour ${portionLabel}` : ''} (calculées)`}</Text>
          <Text style={st.kcalValue}>{kcal !== null ? `${kcal} kcal` : '—'}</Text>
        </View>

        <AdminField label="Code-barres (facultatif)" hint="Les chiffres sous le code-barres de l’emballage.">
          <AdminInput value={barcode} onChangeText={setBarcode} keyboardType="number-pad" placeholder="Ex : 3017620422003" />
        </AdminField>

        {!isNew ? <AdminLink label="Supprimer cet aliment" onPress={remove} danger /> : null}
      </View>
    </FooterScreen>
  );
}

const st = StyleSheet.create({
  small: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.muted },
  kcal: { backgroundColor: Bby.yellow, borderRadius: 20, padding: 16, gap: 4 },
  kcalLabel: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.ink },
  kcalValue: { fontFamily: BFont.display, fontSize: 30, color: Bby.ink },
});
