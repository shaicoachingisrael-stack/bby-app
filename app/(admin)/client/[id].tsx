import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, MessageCircle, Plus, Target, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminField, AdminHeader, AdminInput, a } from '@/components/bby/admin/ui';
import { BFont, Bby, BbyScreen, PillButton } from '@/components/bby/kit';
import { addDays, addMonths, endPhrase, endState, formatEndDate, todayIso } from '@/lib/coaching-end';
import { useClientDetail } from '@/lib/use-coaching-admin';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, assignments, loading, refresh, setPremium, setEndDate, setNote, removeAssignment } = useClientDetail(id);

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
          {client?.is_personal_coaching ? (
            <CoachingEnd value={client.coaching_ends_on ?? null} name={client.display_name || 'cette cliente'} onChange={setEndDate} />
          ) : null}
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

/** Jusqu'à quand le coaching est payé : alerte à la coach 3 jours avant, puis le jour J. */
function CoachingEnd({ value, name, onChange }: { value: string | null; name: string; onChange: (iso: string | null) => void }) {
  const state = endState(value);
  const prolong = (months: number) => {
    if (!value) return onChange(addMonths(todayIso(), months));
    // Déjà terminé : la nouvelle période part d'aujourd'hui ; sinon de la fin prévue.
    const next = addMonths(state === 'ended' ? todayIso() : value, months);
    Alert.alert(`Prolonger de ${months} mois ?`, `Le coaching de ${name} se terminera le ${formatEndDate(next)}.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Prolonger', onPress: () => onChange(next) },
    ]);
  };
  const Chip = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.chip, pressed && { opacity: 0.6 }]}>
      <Text style={st.chipText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={st.endBox}>
      {value ? (
        <>
          <Text style={st.endLabel}>Payé jusqu’au</Text>
          <View style={st.endRow}>
            <Text style={st.endDate}>{formatEndDate(value)}</Text>
            <View style={[st.endPill, state === 'ended' && { backgroundColor: '#C2410C' }, state === 'soon' && { backgroundColor: Bby.ink }]}>
              <Text style={[st.endPillText, state !== 'ok' && { color: '#fff' }]}>{endPhrase(value)}</Text>
            </View>
          </View>
          {state === 'ended' ? (
            <Text style={st.endHint}>Son accès reste ouvert : prolonge-le si elle a renouvelé, sinon désactive son coaching.</Text>
          ) : state === 'soon' ? (
            <Text style={st.endHint}>Bientôt fini : prolonge-le si elle a renouvelé. Tu seras aussi prévenue le jour même.</Text>
          ) : (
            <Text style={st.endHint}>Tu recevras une notification 3 jours avant la fin, puis le jour même.</Text>
          )}
          <Text style={[st.endLabel, { marginTop: 12 }]}>Prolonger</Text>
          <View style={st.chips}>
            <Chip label="+1 mois" onPress={() => prolong(1)} />
            <Chip label="+3 mois" onPress={() => prolong(3)} />
            <Chip label="+6 mois" onPress={() => prolong(6)} />
          </View>
          <Text style={[st.endLabel, { marginTop: 12 }]}>Ajuster la date</Text>
          <View style={st.chips}>
            <Chip label="−1 jour" onPress={() => onChange(addDays(value, -1))} />
            <Chip label="+1 jour" onPress={() => onChange(addDays(value, 1))} />
            <Chip label="−1 semaine" onPress={() => onChange(addDays(value, -7))} />
            <Chip label="+1 semaine" onPress={() => onChange(addDays(value, 7))} />
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={10} style={{ alignSelf: 'flex-start', marginTop: 12 }}>
            <Text style={st.endLink}>Retirer la date de fin</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={st.endLabel}>Durée payée</Text>
          <Text style={st.endHint}>À partir d’aujourd’hui. Tu seras prévenue 3 jours avant la fin, puis le jour même.</Text>
          <View style={[st.chips, { marginTop: 8 }]}>
            <Chip label="1 mois" onPress={() => prolong(1)} />
            <Chip label="3 mois" onPress={() => prolong(3)} />
            <Chip label="6 mois" onPress={() => prolong(6)} />
          </View>
        </>
      )}
    </View>
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
  endBox: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.15)' },
  endLabel: { fontFamily: BFont.sansSemibold, fontSize: 13, color: Bby.mutedOnLight },
  endRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  endDate: { fontFamily: BFont.display, fontSize: 22, color: Bby.ink },
  endPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.08)' },
  endPillText: { fontFamily: BFont.sansSemibold, fontSize: 12, color: Bby.ink },
  endHint: { fontFamily: BFont.sans, fontSize: 13, lineHeight: 18, color: Bby.mutedOnLight, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { borderWidth: 1.5, borderColor: Bby.ink, borderRadius: 999, paddingHorizontal: 14, height: 38, justifyContent: 'center' },
  chipText: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.ink },
  endLink: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.ink, textDecorationLine: 'underline' },
});
