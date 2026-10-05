import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/ui/segmented';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMindsetContent, useRecipes, useSessions } from '@/lib/use-content';
import { useClientDetail } from '@/lib/use-coaching-admin';

type Kind = 'session' | 'recipe' | 'mindset' | 'custom';

export default function ClientAssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { addAssignment } = useClientDetail(id);

  const { sessions } = useSessions();
  const { recipes } = useRecipes();
  const { items: mindset } = useMindsetContent();

  const [kind, setKind] = useState<Kind>('session');
  const [note, setNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const KIND_OPTIONS = [
    { value: 'session' as const, label: 'Séance' },
    { value: 'recipe' as const, label: 'Recette' },
    { value: 'mindset' as const, label: 'Mindset' },
    { value: 'custom' as const, label: 'Custom' },
  ];

  async function assignCatalog(refId: string, title: string) {
    await addAssignment({ item_type: kind, ref_id: refId, title, coach_note: note.trim() || null });
    router.back();
  }

  async function assignCustom() {
    if (!customTitle.trim()) return;
    await addAssignment({
      item_type: 'custom',
      title: customTitle.trim(),
      description: customDesc.trim() || null,
      coach_note: note.trim() || null,
    });
    router.back();
  }

  const catalog = kind === 'session' ? sessions : kind === 'recipe' ? recipes : mindset;

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: palette.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>Ajouter au plan</Text>

        <Segmented value={kind} options={KIND_OPTIONS as any} onChange={(v: Kind) => setKind(v)} />

        <View style={{ gap: Spacing.sm }}>
          <Text style={[styles.label, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
            NOTE POUR LA CLIENTE (optionnel)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ex : 3 séries, à ton rythme…"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans }]}
          />
        </View>

        {kind === 'custom' ? (
          <View style={{ gap: Spacing.md }}>
            <TextInput
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Titre de l'étape sur-mesure"
              placeholderTextColor={palette.textSecondary}
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans }]}
            />
            <TextInput
              value={customDesc}
              onChangeText={setCustomDesc}
              placeholder="Description (optionnel)"
              placeholderTextColor={palette.textSecondary}
              multiline
              style={[styles.textarea, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans }]}
            />
            <Pressable
              onPress={assignCustom}
              style={({ pressed }) => [styles.addBtn, { backgroundColor: palette.text, opacity: pressed || !customTitle.trim() ? 0.6 : 1 }]}
            >
              <Plus size={16} color={palette.background} />
              <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>Ajouter au plan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            <Text style={[styles.label, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              CHOISIR DANS LE CATALOGUE
            </Text>
            {catalog.length === 0 ? (
              <Text style={[styles.empty, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
                Rien dans ce catalogue pour l'instant.
              </Text>
            ) : (
              catalog.map((it: any) => (
                <Pressable
                  key={it.id}
                  onPress={() => assignCatalog(it.id, it.title)}
                  style={({ pressed }) => [styles.catalogRow, { backgroundColor: palette.surface, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Text style={[styles.catalogTitle, { color: palette.text, fontFamily: Fonts.sans }]} numberOfLines={1}>
                    {it.title}
                  </Text>
                  <Plus size={18} color={palette.text} />
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  label: { fontSize: 11, letterSpacing: 1.4 },
  input: { height: 50, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.lg, fontSize: 15 },
  textarea: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.lg, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 50, borderRadius: Radius.pill },
  empty: { fontSize: 14 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg },
  catalogTitle: { flex: 1, fontSize: 14.5 },
});
