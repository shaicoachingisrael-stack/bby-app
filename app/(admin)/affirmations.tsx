import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AdminHeader, AdminRow, a } from '@/components/bby/admin/ui';
import { BFont, BbyScreen, Bby, RoundButton } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type Row = { month: number; day: number; text: string };

// Les 366 affirmations du jour : une par date, la même pour toutes les clientes.
export default function AffirmationsScreen() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      supabase
        .from('daily_affirmations')
        .select('month, day, text')
        .eq('month', month)
        .then(({ data }) => {
          if (!alive) return;
          const map: Record<number, string> = {};
          ((data as Row[] | null) ?? []).forEach((r) => (map[r.day] = r.text));
          setRows(map);
          setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [month]),
  );

  const isToday = (d: number) => month === now.getMonth() + 1 && d === now.getDate();

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Affirmations du jour"
          intro="Une phrase par jour de l’année, affichée en jaune en haut de Mindset. Touche une date pour la modifier."
        />
        {/* Mois affiché, toujours visible ; les flèches passent au mois d'avant / d'après. */}
        <View style={a.rowBetween}>
          <RoundButton icon={ArrowLeft} variant="outline" size={44} label="Mois précédent" onPress={() => setMonth((m) => (m === 1 ? 12 : m - 1))} />
          <Text style={{ fontFamily: BFont.display, fontSize: 24, color: Bby.text }}>{MONTHS[month - 1]}</Text>
          <RoundButton icon={ArrowRight} variant="outline" size={44} label="Mois suivant" onPress={() => setMonth((m) => (m === 12 ? 1 : m + 1))} />
        </View>
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : (
          <View style={{ gap: 10 }}>
            {Array.from({ length: DAYS_IN_MONTH[month - 1] }, (_, i) => i + 1).map((d) => (
              <AdminRow
                key={d}
                top={`${d} ${MONTHS[month - 1].toLowerCase()}${isToday(d) ? ' · aujourd’hui' : ''}`}
                title={rows[d]?.trim() || 'Pas encore écrite'}
                empty={!rows[d]?.trim()}
                highlight={isToday(d) && !!rows[d]?.trim()}
                onPress={() => router.push(`/(admin)/affirmation-edit?month=${month}&day=${d}` as any)}
              />
            ))}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}
