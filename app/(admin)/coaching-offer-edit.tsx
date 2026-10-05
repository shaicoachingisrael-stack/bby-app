import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Plus, Star, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { useCoachingOfferAdmin } from '@/lib/use-coaching-admin';

export default function CoachingOfferEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { config, plans, loading, saveConfig, addPlan, removePlan } = useCoachingOfferAdmin();

  const [pitch, setPitch] = useState('');
  const [perks, setPerks] = useState('');
  const [months, setMonths] = useState('');
  const [price, setPrice] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (config) { setPitch(config.pitch ?? ''); setPerks(config.perks ?? ''); }
  }, [config?.id]);

  async function onAddPlan() {
    const m = Number.parseInt(months.replace(/\D/g, ''), 10);
    if (!m || !price.trim()) return;
    await addPlan(m, price.trim(), subtitle.trim(), highlighted);
    setMonths(''); setPrice(''); setSubtitle(''); setHighlighted(false);
  }

  if (loading && !config) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: palette.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
        <Pressable onPress={() => saveConfig(pitch, perks)} hitSlop={12}>
          <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>Enregistrer</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>Offre coaching</Text>

        <Field label="PITCH" palette={palette}>
          <TextInput value={pitch} onChangeText={setPitch} multiline placeholder="Présentation de l'offre…"
            placeholderTextColor={palette.textSecondary} style={[styles.textarea, inputStyle(palette)]} />
        </Field>
        <Field label="BÉNÉFICES (un par ligne)" palette={palette}>
          <TextInput value={perks} onChangeText={setPerks} multiline placeholder={"Programme sur-mesure\nMessagerie directe\n…"}
            placeholderTextColor={palette.textSecondary} style={[styles.textarea, inputStyle(palette)]} />
        </Field>
        <Text style={[styles.hint, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          « Enregistrer » (en haut) sauvegarde le pitch et les bénéfices.
        </Text>

        {/* Formules */}
        <Text style={[styles.section, { color: palette.text, fontFamily: Fonts.displayBold }]}>Formules (par durée)</Text>
        {plans.map((p) => (
          <View key={p.id} style={[styles.planRow, { backgroundColor: palette.surface }]}>
            {p.highlighted ? <Star size={14} color={palette.text} fill={palette.text} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
                {p.months} mois — {p.price_text}
              </Text>
              {p.subtitle ? (
                <Text style={[styles.planSub, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>{p.subtitle}</Text>
              ) : null}
            </View>
            <Pressable hitSlop={8} onPress={() => removePlan(p.id)}>
              <Trash2 size={18} color={palette.textSecondary} />
            </Pressable>
          </View>
        ))}

        {/* Ajouter une formule */}
        <View style={[styles.addCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.addLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>NOUVELLE FORMULE</Text>
          <View style={styles.rowInputs}>
            <TextInput value={months} onChangeText={setMonths} keyboardType="number-pad" placeholder="Mois"
              placeholderTextColor={palette.textSecondary} style={[styles.smallInput, inputStyle(palette), { width: 80 }]} />
            <TextInput value={price} onChangeText={setPrice} placeholder="149 €/mois"
              placeholderTextColor={palette.textSecondary} style={[styles.smallInput, inputStyle(palette), { flex: 1 }]} />
          </View>
          <TextInput value={subtitle} onChangeText={setSubtitle} placeholder="Sous-titre (ex : soit 387 € · -13%)"
            placeholderTextColor={palette.textSecondary} style={[styles.smallInput, inputStyle(palette)]} />
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.text, fontFamily: Fonts.sans, fontSize: 14 }}>Mettre en avant</Text>
            <Switch value={highlighted} onValueChange={setHighlighted} />
          </View>
          <Pressable onPress={onAddPlan} style={({ pressed }) => [styles.addBtn, { backgroundColor: palette.text, opacity: pressed || !price.trim() || !months.trim() ? 0.6 : 1 }]}>
            <Plus size={16} color={palette.background} />
            <Text style={{ color: palette.background, fontFamily: Fonts.sansSemibold, fontSize: 14 }}>Ajouter la formule</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, palette }: { label: string; children: React.ReactNode; palette: any }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 1.4 }}>{label}</Text>
      {children}
    </View>
  );
}
function inputStyle(palette: any) {
  return { backgroundColor: palette.background, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  textarea: { minHeight: 90, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.lg, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
  hint: { fontSize: 12.5, lineHeight: 18 },
  section: { fontSize: 22, letterSpacing: -0.4, marginTop: Spacing.md },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg },
  planTitle: { fontSize: 15 },
  planSub: { fontSize: 13, marginTop: 2 },
  addCard: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.md },
  addLabel: { fontSize: 11, letterSpacing: 1.4 },
  rowInputs: { flexDirection: 'row', gap: Spacing.sm },
  smallInput: { height: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 15 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, borderRadius: Radius.pill },
});
