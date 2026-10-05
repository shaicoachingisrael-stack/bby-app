import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MessageCircle, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useClientDetail } from '@/lib/use-coaching-admin';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { client, assignments, loading, refresh, setPremium, setNote, removeAssignment } = useClientDetail(id);

  const [note, setNoteLocal] = useState('');

  useEffect(() => { if (client) setNoteLocal(client.coaching_note ?? ''); }, [client?.id]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading && !client) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {client?.display_name || 'Cliente'}
        </Text>

        {/* Toggle coaching perso */}
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                Coaching perso
              </Text>
              <Text style={[styles.cardSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                Débloque l'espace « Mon coach » pour cette cliente.
              </Text>
            </View>
            <Switch value={!!client?.is_personal_coaching} onValueChange={setPremium} />
          </View>
        </View>

        {/* Note privée */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={[styles.label, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            NOTE PRIVÉE (visible par toi seule)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNoteLocal}
            onBlur={() => setNote(note)}
            placeholder="Objectifs, blessures, préférences…"
            placeholderTextColor={palette.textSecondary}
            multiline
            style={[styles.noteInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans }]}
          />
        </View>

        {/* Messagerie */}
        <Pressable
          onPress={() => router.push(`/(admin)/client-chat/${id}` as any)}
          style={[styles.msgRow, { backgroundColor: palette.surface }]}
        >
          <MessageCircle size={20} color={palette.text} strokeWidth={1.8} />
          <Text style={[styles.msgText, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>Messagerie</Text>
        </Pressable>

        {/* Plan */}
        <View style={styles.rowBetween}>
          <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>Plan perso</Text>
          <Pressable
            onPress={() => router.push(`/(admin)/client-assign/${id}` as any)}
            style={[styles.addBtn, { backgroundColor: palette.text }]}
          >
            <Plus size={16} color={palette.background} />
            <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 13 }}>Ajouter</Text>
          </Pressable>
        </View>

        {assignments.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
            Aucune étape assignée. Compose son plan depuis le catalogue.
          </Text>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {assignments.map((a) => (
              <View key={a.id} style={[styles.assignRow, { backgroundColor: palette.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assignTitle, { color: palette.text, fontFamily: Fonts.sans }]}>
                    {a.title || a.item_type}
                    {a.done ? '  ✓' : ''}
                  </Text>
                  {a.coach_note ? (
                    <Text style={[styles.assignNote, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                      {a.coach_note}
                    </Text>
                  ) : null}
                </View>
                <Pressable hitSlop={8} onPress={() => removeAssignment(a.id)}>
                  <Trash2 size={18} color={palette.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg },
  card: { borderRadius: Radius.md, padding: Spacing.lg },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  cardTitle: { fontSize: 15 },
  cardSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  label: { fontSize: 11, letterSpacing: 1.4 },
  noteInput: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.lg, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg },
  msgText: { fontSize: 15 },
  section: { fontSize: 22, letterSpacing: -0.4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  empty: { fontSize: 14, lineHeight: 20 },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg },
  assignTitle: { fontSize: 14.5 },
  assignNote: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
