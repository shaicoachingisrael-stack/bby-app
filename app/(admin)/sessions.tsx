import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AdminHeader, AdminRow, a } from '@/components/bby/admin/ui';
import { BbyScreen, Bby, PillButton } from '@/components/bby/kit';
import { supabase } from '@/lib/supabase';
import type { Program, Session } from '@/lib/types';

type SessionWithProgram = Session & { program: Pick<Program, 'title'> | null };

// Liste des séances (vidéos d'entraînement), rangées par programme.
export default function SessionsListScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*, program:programs(title)')
      .order('created_at', { ascending: false });
    if (error) console.warn('sessions fetch', error);
    setSessions((data as SessionWithProgram[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Séances"
          intro="Les séances vidéo de l’onglet Training. Touche une séance pour changer sa vidéo, son titre ou son programme."
        />
        <PillButton label="Créer une séance" icon={Plus} variant="yellow" onPress={() => router.push('/(admin)/session-edit' as any)} />
        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : sessions.length === 0 ? (
          <Text style={a.hint}>Aucune séance pour l’instant. Crée la première.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {sessions.map((s) => (
              <AdminRow
                key={s.id}
                top={s.program?.title ?? 'Sans programme'}
                title={s.title}
                sub={s.duration_min ? `${s.duration_min} min` : undefined}
                onPress={() => router.push(`/(admin)/session-edit?id=${s.id}` as any)}
              />
            ))}
          </View>
        )}
      </View>
    </BbyScreen>
  );
}
