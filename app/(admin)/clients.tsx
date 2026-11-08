import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Settings2, Star } from 'lucide-react-native';
import { ChevronRight } from '@/lib/rtl-icons';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminHeader, a } from '@/components/bby/admin/ui';
import { BFont, Bby, BbyScreen, PillButton } from '@/components/bby/kit';
import { endPhrase, endState, formatEndDate } from '@/lib/coaching-end';
import { useCoachingClients } from '@/lib/use-coaching-admin';

export default function ClientsAdminScreen() {
  const router = useRouter();
  const { clients, loading, refresh } = useCoachingClients();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Sans date de fin ou fin la plus proche en premier : ce qui demande une action est en haut.
  const premium = clients
    .filter((c) => c.is_personal_coaching)
    .sort((x, y) => (x.coaching_ends_on ?? '0000').localeCompare(y.coaching_ends_on ?? '0000'));
  const others = clients.filter((c) => !c.is_personal_coaching);

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 18 }}>
        <AdminHeader
          title="Clientes"
          intro="Le coaching perso en premier. Touche une cliente pour activer son coaching, écrire une note ou composer son plan."
        />
        <PillButton
          label="Mon offre de coaching"
          icon={Settings2}
          variant="outline"
          onPress={() => router.push('/(admin)/coaching-offer-edit' as any)}
        />

        {loading ? (
          <ActivityIndicator color={Bby.text} style={{ marginTop: 30 }} />
        ) : (
          <>
            {premium.length > 0 && (
              <>
                <Text style={a.label}>Coaching perso</Text>
                <View style={{ gap: 10 }}>
                  {premium.map((c) => (
                    <ClientRow key={c.id} c={c} premium onPress={() => router.push(`/(admin)/client/${c.id}` as any)} />
                  ))}
                </View>
              </>
            )}

            <Text style={a.label}>Toutes les clientes</Text>
            {others.length === 0 && premium.length === 0 ? (
              <Text style={a.hint}>Aucune cliente inscrite pour l’instant.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {others.map((c) => (
                  <ClientRow key={c.id} c={c} onPress={() => router.push(`/(admin)/client/${c.id}` as any)} />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </BbyScreen>
  );
}

function ClientRow({ c, premium, onPress }: { c: any; premium?: boolean; onPress: () => void }) {
  const initial = (c.display_name || '?')[0]?.toUpperCase();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.row, premium && st.rowOn, pressed && { opacity: 0.85 }]}>
      <View style={[st.avatar, premium && { backgroundColor: Bby.ink }]}>
        {c.avatar_url ? (
          <Image source={{ uri: c.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[st.initial, premium && { color: Bby.yellow }]}>{initial}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.name, premium && { color: Bby.ink }]} numberOfLines={1}>
          {c.display_name || 'Sans nom'}
        </Text>
        {premium ? <EndLine iso={c.coaching_ends_on} /> : null}
      </View>
      {!premium && c.coaching_interest ? (
        <View style={st.badge}>
          <Text style={st.badgeText}>Intéressée</Text>
        </View>
      ) : null}
      {premium ? <Star size={16} color={Bby.ink} fill={Bby.ink} /> : null}
      <ChevronRight size={18} color={premium ? Bby.ink : Bby.muted} />
    </Pressable>
  );
}

function EndLine({ iso }: { iso: string | null | undefined }) {
  const state = endState(iso);
  if (!iso) return <Text style={[st.end, { color: '#C2410C' }]}>Date de fin à indiquer</Text>;
  const color = state === 'ended' ? '#C2410C' : Bby.mutedOnLight;
  return (
    <Text style={[st.end, { color }, state !== 'ok' && { fontFamily: BFont.sansSemibold }]} numberOfLines={1}>
      {state === 'ended' ? `Terminé le ${formatEndDate(iso, false)}` : `Jusqu’au ${formatEndDate(iso, false)} · ${endPhrase(iso)}`}
    </Text>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: Bby.card },
  rowOn: { backgroundColor: Bby.light },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: Bby.yellow },
  initial: { fontFamily: BFont.display, fontSize: 17, color: Bby.ink },
  end: { fontFamily: BFont.sans, fontSize: 13, marginTop: 2 },
  name: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Bby.yellow },
  badgeText: { fontFamily: BFont.sansSemibold, fontSize: 11, color: Bby.ink },
});
