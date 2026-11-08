import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AdminHeader, AdminRow, a } from '@/components/bby/admin/ui';
import { BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';

type Row = { id: string; title: string; day_count: number | null; minutes_range: string | null };

// Liste des parcours (Mindset). Toujours en français : c'est la langue dans laquelle Shaï écrit.
export default function MindsetProgramsAdmin() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Row[]>([]);
  const [written, setWritten] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [p, s] = await Promise.all([
          supabase.from('mindset_programs').select('id, title, day_count, minutes_range').order('sort_order', { ascending: true }),
          supabase.from('mindset_program_steps').select('program_id').not('idea', 'is', null),
        ]);
        if (!alive) return;
        const count: Record<string, number> = {};
        ((s.data as { program_id: string }[] | null) ?? []).forEach((r) => (count[r.program_id] = (count[r.program_id] ?? 0) + 1));
        setPrograms((p.data as Row[] | null) ?? []);
        setWritten(count);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const current = programs.filter((p) => written[p.id]);
  const drafts = programs.filter((p) => !written[p.id]);

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Parcours"
          intro="Les parcours de 7 jours de Mindset. Touche un parcours pour modifier sa fiche et ses jours."
        />
        <PillButton label="Créer un parcours" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/mindset-program-edit' as any)} />
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={a.label}>Visibles par les clientes</Text>
            <View style={{ gap: 10 }}>
              {current.map((p) => (
                <AdminRow
                  key={p.id}
                  title={p.title}
                  sub={`${written[p.id]} / ${p.day_count ?? 7} jours écrits${p.minutes_range ? ` · ${p.minutes_range}` : ''}`}
                  onPress={() => router.push(`/(admin)/mindset-program-edit?id=${p.id}` as any)}
                />
              ))}
              {!current.length ? <Text style={a.hint}>Aucun pour l’instant.</Text> : null}
            </View>
            {drafts.length ? (
              <>
                <Text style={a.label}>Pas encore visibles</Text>
                <Text style={a.hint}>
                  Un parcours apparaît chez les clientes dès qu’un de ses jours a son « idée du jour ». Les anciens parcours de respirations restent ici sans être montrés.
                </Text>
                <View style={{ gap: 10 }}>
                  {drafts.map((p) => (
                    <AdminRow
                      key={p.id}
                      title={p.title}
                      sub="Aucun jour écrit"
                      empty
                      onPress={() => router.push(`/(admin)/mindset-program-edit?id=${p.id}` as any)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </View>
    </BbyScreen>
  );
}
