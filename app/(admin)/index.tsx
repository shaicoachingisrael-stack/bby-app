import { useFocusEffect, useRouter } from 'expo-router';
import { Apple, Bell, CheckCircle2, Dumbbell, FileText, GitBranch, Leaf, Sun, Users, UtensilsCrossed } from 'lucide-react-native';
import { ChevronRight } from '@/lib/rtl-icons';
import { useCallback, useState } from 'react';
import { endState } from '@/lib/coaching-end';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { CoachNotificationsCard } from '@/components/bby/admin/coach-notifications';
import { AdminHeader } from '@/components/bby/admin/ui';
import { BFont, Bby, BbyScreen } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [ending, setEnding] = useState<{ soon: number; ended: number; missing: number }>({ soon: 0, ended: 0, missing: 0 });
  const [counts, setCounts] = useState({ programs: 0, sessions: 0, recipes: 0, mindset: 0, rituals: 0, journeys: 0 });

  const refresh = useCallback(async () => {
    const [
      { count: programs },
      { count: sessions },
      { count: recipes },
      { count: mindset },
      { count: rituals },
      { count: journeys },
      { data: coached },
    ] = await Promise.all([
      supabase.from('programs').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('recipes').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_content').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_ritual_catalog').select('*', { count: 'exact', head: true }),
      supabase.from('mindset_programs').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('coaching_ends_on').eq('is_personal_coaching', true),
    ]);
    const states = ((coached as { coaching_ends_on: string | null }[] | null) ?? []).map((c) => endState(c.coaching_ends_on));
    setEnding({
      soon: states.filter((x) => x === 'soon').length,
      ended: states.filter((x) => x === 'ended').length,
      missing: states.filter((x) => x === 'none').length,
    });
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
        <CoachNotificationsCard />
        <EndingCard {...ending} onPress={go('/(admin)/clients')} />

        <Text style={st.group}>Training</Text>
        <View style={{ gap: 10 }}>
          <Tile icon={Dumbbell} title="Programmes" count={counts.programs} onPress={go('/(admin)/programs')} />
          <Tile icon={FileText} title="Séances" count={counts.sessions} onPress={go('/(admin)/sessions')} />
        </View>

        <Text style={st.group}>Nutrition</Text>
        <View style={{ gap: 10 }}>
          <Tile icon={UtensilsCrossed} title="Recettes" count={counts.recipes} onPress={go('/(admin)/recipes')} />
          <Tile icon={Apple} title="Aliments" count="Pour « Noter mon repas »" onPress={go('/(admin)/foods')} />
        </View>

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

/** Coachings qui se terminent (≤ 3 jours), déjà terminés, ou sans date de fin. */
function EndingCard({ soon, ended, missing, onPress }: { soon: number; ended: number; missing: number; onPress: () => void }) {
  const lines: string[] = [];
  if (ended) lines.push(ended === 1 ? '1 coaching est terminé' : `${ended} coachings sont terminés`);
  if (soon) lines.push(soon === 1 ? '1 coaching se termine dans 3 jours ou moins' : `${soon} coachings se terminent dans 3 jours ou moins`);
  if (missing) lines.push(missing === 1 ? '1 cliente sans date de fin' : `${missing} clientes sans date de fin`);
  if (!lines.length) return null;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.ending, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={st.endingTitle}>Fins de coaching</Text>
        {lines.map((l) => (
          <Text key={l} style={st.endingText}>{l}</Text>
        ))}
      </View>
      <ChevronRight size={20} color={Bby.ink} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  ending: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16, backgroundColor: Bby.yellow },
  endingTitle: { fontFamily: BFont.display, fontSize: 17, color: Bby.ink },
  endingText: { fontFamily: BFont.sans, fontSize: 14, lineHeight: 19, color: Bby.ink },
  group: { fontFamily: BFont.display, fontSize: 18, color: Bby.text, marginTop: 6 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: Bby.card },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  tileCount: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 2 },
});
