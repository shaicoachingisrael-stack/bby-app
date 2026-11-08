import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, CheckCircle2, ChevronRight, Dumbbell, FileText, GitBranch, Leaf, Sun, Users, UtensilsCrossed } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminHeader } from '@/components/bby/admin/ui';
import { BFont, Bby, BbyScreen } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState({ programs: 0, sessions: 0, recipes: 0, mindset: 0, rituals: 0, journeys: 0 });

  const refresh = useCallback(async () => {
    const [
      { count: programs },
      { count: sessions },
      { count: recipes },
      { count: mindset },
      { count: rituals },
      { count: journeys },
    ] = await Promise.all([
      supabase.from('programs').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('recipes').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_content').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_ritual_catalog').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_programs').select('*', { count: 'exact', head: true }),
    ]);
    setCounts({
      programs: programs ?? 0,
      sessions: sessions ?? 0,
      recipes: recipes ?? 0,
      mindset: mindset ?? 0,
      rituals: rituals ?? 0,
      journeys: journeys ?? 0,
    });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const go = (path: string) => () => router.push(path as any);

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader title="Tableau de bord" intro="Gère le contenu que tes clientes voient dans l’app. Touche une rubrique pour l’ouvrir." />

        <Text style={st.group}>Training</Text>
        <View style={{ gap: 10 }}>
          <Tile icon={Dumbbell} title="Programmes" count={counts.programs} onPress={go('/(admin)/programs')} />
          <Tile icon={FileText} title="Séances" count={counts.sessions} onPress={go('/(admin)/sessions')} />
        </View>

        <Text style={st.group}>Nutrition</Text>
        <Tile icon={UtensilsCrossed} title="Recettes" count={counts.recipes} onPress={go('/(admin)/recipes')} />

        <Text style={st.group}>Mindset</Text>
        <View style={{ gap: 10 }}>
          <Tile icon={GitBranch} title="Parcours" count={counts.journeys} onPress={go('/(admin)/mindset-programs')} />
          <Tile icon={Sun} title="Affirmations du jour" count="366 phrases, une par jour" onPress={go('/(admin)/affirmations')} />
          <Tile icon={CheckCircle2} title="Rituels" count={counts.rituals} onPress={go('/(admin)/rituals')} />
          <Tile icon={Leaf} title="Contenus Mindset" count={counts.mindset} onPress={go('/(admin)/mindset')} />
        </View>

        <Text style={st.group}>Tes clientes</Text>
        <View style={{ gap: 10 }}>
          <Tile icon={Users} title="Clientes (coaching perso)" count="Suivi personnalisé" onPress={go('/(admin)/clients')} />
          <Tile icon={Bell} title="Envoyer une notification" count="À toutes tes clientes" onPress={go('/(admin)/push')} />
        </View>
      </View>
    </BbyScreen>
  );
}

function Tile({ icon: Icon, title, count, onPress }: { icon: any; title: string; count: number | string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.tile, pressed && { opacity: 0.85 }]}>
      <View style={st.tileIcon}>
        <Icon size={20} color={Bby.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.tileTitle}>{title}</Text>
        <Text style={st.tileCount}>{typeof count === 'number' ? `${count} ${count > 1 ? 'éléments' : 'élément'}` : count}</Text>
      </View>
      <ChevronRight size={18} color={Bby.muted} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  group: { fontFamily: BFont.display, fontSize: 18, color: Bby.text, marginTop: 6 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: Bby.card },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  tileCount: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 2 },
});
