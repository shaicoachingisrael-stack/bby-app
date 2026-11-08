import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, MessageCircle, Plus, Target, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminField, AdminHeader, AdminInput, a } from '@/components/bby/admin/ui';
import { BFont, Bby, BbyScreen, PillButton } from '@/components/bby/kit';
import { useClientDetail } from '@/lib/use-coaching-admin';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, assignments, loading, refresh, setPremium, setNote, removeAssignment } = useClientDetail(id);

  const [note, setNoteLocal] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (client) setNoteLocal(client.coaching_note ?? ''); }, [client?.id]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading && !client) {
    return (
      <View style={{ flex: 1, backgroundColor: Bby.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Bby.text} />
      </View>
    );
  }

  return (
    <BbyScreen bottomSpace={40}>
      <View style={{ gap: 22 }}>
        <AdminHeader title={client?.display_name || 'Cliente'} intro="Son coaching perso, ta note privée, vos messages et son plan." />

        {/* Coaching perso */}
        <View style={[st.card, client?.is_personal_coaching && st.cardOn]}>
          <View style={a.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[st.cardTitle, client?.is_personal_coaching && { color: Bby.ink }]}>Coaching perso</Text>
              <Text style={[st.cardSub, client?.is_personal_coaching && { color: Bby.mutedOnLight }]}>
                Débloque l’espace « Mon coach » pour cette cliente.
              </Text>
            </View>
            <Switch
              value={!!client?.is_personal_coaching}
              onValueChange={setPremium}
              trackColor={{ true: Bby.ink, false: Bby.cardAlt }}
              thumbColor={client?.is_personal_coaching ? Bby.yellow : Bby.light}
            />
          </View>
        </View>

        {/* Note privée */}
        <AdminField label="Note privée" hint="Visible par toi seule. Enregistrée dès que tu sors du champ.">
          <AdminInput
            value={note}
            onChangeText={setNoteLocal}
            onBlur={() => setNote(note)}
            placeholder="Objectifs, blessures, préférences…"
            multiline
          />
        </AdminField>

        {/* Messagerie */}
        <Pressable
          onPress={() => router.push(`/(admin)/client-chat/${id}` as any)}
          accessibilityRole="button"
          style={({ pressed }) => [st.msgRow, pressed && { opacity: 0.85 }]}
        >
          <View style={st.msgIcon}>
            <MessageCircle size={20} color={Bby.ink} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>Messagerie</Text>
            <Text style={st.cardSub}>Écris-lui directement.</Text>
          </View>
        </Pressable>

        {/* Repères nutrition */}
        <Pressable
          onPress={() => router.push(`/(admin)/client-targets/${id}` as any)}
          accessibilityRole="button"
          style={({ pressed }) => [st.msgRow, pressed && { opacity: 0.85 }]}
        >
          <View style={st.msgIcon}>
            <Target size={20} color={Bby.ink} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>Ses repères</Text>
            <Text style={st.cardSub}>Protéines, lipides, glucides, eau, calories.</Text>
          </View>
        </Pressable>

        {/* Notification à elle seule */}
        <Pressable
          onPress={() => router.push(`/(admin)/push?client=${id}` as any)}
          accessibilityRole="button"
          style={({ pressed }) => [st.msgRow, pressed && { opacity: 0.85 }]}
        >
          <View style={st.msgIcon}>
            <Bell size={20} color={Bby.ink} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>Lui envoyer une notification</Text>
            <Text style={st.cardSub}>Elle seule la reçoit.</Text>
          </View>
        </Pressable>

        {/* Plan */}
        <View style={{ gap: 10 }}>
          <Text style={st.section}>Plan perso</Text>
          <Text style={a.hint}>Les séances, recettes ou étapes sur-mesure que tu lui confies.</Text>
          {assignments.length === 0 ? (
            <Text style={a.hint}>Aucune étape pour l’instant. Compose son plan depuis le catalogue.</Text>
          ) : (
            assignments.map((x) => (
              <View key={x.id} style={st.assignRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.assignTitle}>
                    {x.title || x.item_type}
                    {x.done ? '  ✓' : ''}
                  </Text>
                  {x.coach_note ? <Text style={st.cardSub}>{x.coach_note}</Text> : null}
                </View>
                <Pressable hitSlop={10} onPress={() => removeAssignment(x.id)} accessibilityLabel="Retirer du plan">
                  <Trash2 size={18} color={Bby.muted} />
                </Pressable>
              </View>
            ))
          )}
          <PillButton label="Ajouter au plan" icon={Plus} variant="yellow" onPress={() => router.push(`/(admin)/client-assign/${id}` as any)} />
        </View>
      </View>
    </BbyScreen>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, backgroundColor: Bby.card },
  cardOn: { backgroundColor: Bby.yellow },
  cardTitle: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text },
  cardSub: { fontFamily: BFont.sans, fontSize: 13, lineHeight: 18, color: Bby.muted, marginTop: 2 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 16, backgroundColor: Bby.card },
  msgIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Bby.yellow, alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: BFont.display, fontSize: 20, color: Bby.text },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, backgroundColor: Bby.card },
  assignTitle: { fontFamily: BFont.sansMedium, fontSize: 15, color: Bby.text },
});
