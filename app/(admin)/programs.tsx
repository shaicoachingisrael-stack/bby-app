import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Dumbbell, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminHeader, a } from '@/components/bby/admin/ui';
import { BFont, BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/types';

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutante',
  intermediaire: 'Intermédiaire',
  avance: 'Avancée',
};

// Liste des programmes d'entraînement (onglet Training).
export default function ProgramsListScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.warn('programs fetch', error);
    setPrograms((data as Program[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Programmes"
          intro="Les programmes de l’onglet Training. Touche un programme pour modifier son titre, son niveau et sa photo."
        />
        <PillButton label="Créer un programme" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/program-edit' as any)} />
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : programs.length === 0 ? (
          <Text style={a.hint}>Aucun programme pour l’instant. Crée le premier.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {programs.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/(admin)/program-edit?id=${p.id}` as any)}
                accessibilityRole="button"
                style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
              >
                {p.cover_url ? (
                  <Image source={{ uri: p.cover_url }} style={s.thumb} contentFit="cover" />
                ) : (
                  <View style={[s.thumb, s.thumbEmpty]}>
                    <Dumbbell size={20} color={Bby.muted} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.title} numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text style={s.meta}>
                    {[
                      p.level ? LEVEL_LABELS[p.level] ?? p.level : null,
                      p.duration_weeks ? `${p.duration_weeks} sem.` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sans niveau'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Bby.card, borderRadius: 20, padding: 12 },
  thumb: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: Bby.cardAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: BFont.sansSemibold, fontSize: 16, lineHeight: 21, color: Bby.text },
  meta: { fontFamily: BFont.sans, fontSize: 13, color: Bby.muted },
});
