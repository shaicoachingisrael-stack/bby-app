import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AdminChoice, AdminHeader, AdminInput, AdminRow, a } from '@/components/bby/admin/ui';
import { BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { FOOD_CATEGORIES } from '@/lib/nutrition/food-categories';
import { fold } from '@/lib/nutrition/foods';
import { supabase } from '@/lib/supabase';

type Row = { id: string; name: string; category: string; portion_label: string; protein_g: number; fat_g: number; carb_g: number; kcal: number };

const r1 = (n: number) => String(Math.round(Number(n) * 10) / 10).replace('.', ',');

// Base d'aliments de « Noter mon repas » (et du calcul des macros des recettes).
export default function FoodsAdmin() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      supabase
        .from('food_items')
        .select('id, name, category, portion_label, protein_g, fat_g, carb_g, kcal')
        .order('name')
        .then(({ data }) => {
          if (!alive) return;
          setRows((data as Row[] | null) ?? []);
          setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, []),
  );

  const shown = useMemo(() => {
    const q = fold(search);
    return rows.filter((r) => (cat === 'all' || r.category === cat) && (!q || fold(r.name).includes(q)));
  }, [rows, search, cat]);

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 16 }}>
        <AdminHeader
          title="Aliments"
          intro="Ce que tes clientes trouvent quand elles cherchent un aliment dans « Noter mon repas ». Sert aussi à estimer les macros des recettes."
        />
        <PillButton label="Ajouter un aliment" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/food-edit' as any)} />
        <AdminInput value={search} onChangeText={setSearch} placeholder="Chercher un aliment…" autoCorrect={false} />
        <AdminChoice options={[{ key: 'all', label: 'Tous' }, ...FOOD_CATEGORIES]} value={cat} onChange={setCat} />
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={a.hint}>{`${shown.length} aliment(s)`}</Text>
            <View style={{ gap: 10 }}>
              {shown.map((r) => (
                <AdminRow
                  key={r.id}
                  top={`${FOOD_CATEGORIES.find((c) => c.key === r.category)?.label ?? r.category} · ${r.portion_label}`}
                  title={r.name}
                  sub={`P ${r1(r.protein_g)} · L ${r1(r.fat_g)} · G ${r1(r.carb_g)} · ${r.kcal} kcal`}
                  onPress={() => router.push(`/(admin)/food-edit?id=${r.id}` as any)}
                />
              ))}
              {!shown.length ? <Text style={[a.hint, { textAlign: 'center' }]}>Aucun aliment trouvé. Tu peux l’ajouter.</Text> : null}
            </View>
          </>
        )}
      </View>
    </BbyScreen>
  );
}
