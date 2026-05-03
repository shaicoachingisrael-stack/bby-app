import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';

const MEAL_OPTIONS = [
  { value: 'petit_dejeuner', label: 'Petit-déj' },
  { value: 'dejeuner', label: 'Déjeuner' },
  { value: 'diner', label: 'Dîner' },
  { value: 'collation', label: 'Collation' },
] as const;

type MealType = (typeof MEAL_OPTIONS)[number]['value'];

export default function MealLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const { user } = useAuth();
  const params = useLocalSearchParams<{ type?: string }>();

  const [mealType, setMealType] = useState<MealType>(
    (MEAL_OPTIONS.some((m) => m.value === params.type)
      ? (params.type as MealType)
      : 'petit_dejeuner'),
  );
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!kcal) {
      Alert.alert('Calories manquantes', 'Indique au moins les kcal.');
      return;
    }
    setSaving(true);
    try {
      const num = (s: string) => {
        const n = Number.parseInt(s.replace(/\D/g, ''), 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
      };
      const { error } = await supabase.from('meal_entries').insert({
        user_id: user.id,
        meal_type: mealType,
        title: title.trim() || null,
        kcal: num(kcal),
        protein_g: num(protein),
        carbs_g: num(carbs),
        fat_g: num(fat),
      });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>Retour</Text>
        </Pressable>
        <Pressable onPress={save} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={[styles.action, { color: palette.text, fontFamily: Fonts.sansSemibold }]}>
              Enregistrer
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxl,
          gap: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          Ajouter un repas
        </Text>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>Type de repas</Label>
          <View style={{ gap: Spacing.sm }}>
            <Segmented
              value={mealType}
              options={MEAL_OPTIONS.slice(0, 2) as any}
              onChange={(v: MealType) => setMealType(v)}
            />
            <Segmented
              value={mealType}
              options={MEAL_OPTIONS.slice(2) as any}
              onChange={(v: MealType) => setMealType(v)}
            />
          </View>
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Label palette={palette}>Titre (optionnel)</Label>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex : Bowl protéiné saumon"
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, fontFamily: Fonts.sans },
            ]}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <NumberField label="Calories" suffix="kcal" value={kcal} onChange={setKcal} palette={palette} />
          <NumberField label="Protéines" suffix="g" value={protein} onChange={setProtein} palette={palette} />
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <NumberField label="Glucides" suffix="g" value={carbs} onChange={setCarbs} palette={palette} />
          <NumberField label="Lipides" suffix="g" value={fat} onChange={setFat} palette={palette} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ children, palette }: any) {
  return (
    <Text
      style={[
        { color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 1.4 },
      ]}
    >
      {children.toString().toUpperCase()}
    </Text>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
  palette,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (s: string) => void;
  palette: any;
}) {
  return (
    <View style={{ flex: 1, gap: Spacing.sm }}>
      <Label palette={palette}>{label}</Label>
      <View
        style={[
          styles.numberWrap,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={palette.textSecondary}
          style={[styles.numberInput, { color: palette.text, fontFamily: Fonts.sans }]}
        />
        <Text style={[styles.suffix, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
          {suffix}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  numberWrap: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  numberInput: { flex: 1, fontSize: 16 },
  suffix: { fontSize: 13 },
});
