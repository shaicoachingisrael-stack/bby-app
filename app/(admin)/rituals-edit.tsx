import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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

import { Colors, Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RITUAL_ICON_KEYS, ritualIcon } from '@/lib/ritual-icons';
import { supabase } from '@/lib/supabase';
import { triggerTranslate } from '@/lib/translate-content';
import type { RitualCatalogItem } from '@/lib/types';

export default function RitualsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;
  const itemId = useMemo(() => id ?? Crypto.randomUUID(), [id]);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('leaf');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mindset_ritual_catalog')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) console.warn('ritual_catalog fetch', error);
      if (data) {
        const c = data as RitualCatalogItem;
        setLabel(c.label);
        setIcon(c.icon);
        setSortOrder(c.sort_order?.toString() ?? '0');
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function handleSave() {
    if (!label.trim()) {
      Alert.alert('Label manquant');
      return;
    }
    setSaving(true);
    try {
      const order = Number.parseInt(sortOrder.replace(/\D/g, ''), 10) || 0;
      const payload = { label: label.trim(), icon, sort_order: order };
      if (isNew) {
        const { error } = await supabase.from('mindset_ritual_catalog').insert({ id: itemId, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mindset_ritual_catalog').update(payload).eq('id', id!);
        if (error) throw error;
      }
      triggerTranslate('mindset_ritual_catalog', itemId);
      router.back();
    } catch (e: any) {
      Alert.alert('Sauvegarde impossible', e?.message ?? 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Supprimer ce rituel ?', 'Action définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('mindset_ritual_catalog').delete().eq('id', id!);
            if (error) throw error;
            router.back();
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
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
        <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
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
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: palette.text, fontFamily: Fonts.displayBold }]}>
          {isNew ? 'Nouveau rituel' : 'Modifier le rituel'}
        </Text>

        <Field label="Label (FR)" palette={palette}>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Ex : Boire un verre d'eau au réveil"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        <Field label="Icône" palette={palette}>
          <View style={styles.iconGrid}>
            {RITUAL_ICON_KEYS.map((key) => {
              const Icon = ritualIcon(key);
              const active = icon === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setIcon(key)}
                  style={[styles.iconChip, { backgroundColor: active ? palette.text : palette.surface }]}
                >
                  <Icon size={18} color={active ? palette.background : palette.textSecondary} strokeWidth={1.8} />
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Ordre" palette={palette}>
          <TextInput
            value={sortOrder}
            onChangeText={setSortOrder}
            placeholder="0"
            placeholderTextColor={palette.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, inputStyle(palette)]}
          />
        </Field>

        {!isNew && (
          <Pressable onPress={handleDelete} style={({ pressed }) => [styles.danger, { opacity: pressed ? 0.85 : 1 }]}>
            <Trash2 size={18} color={Palette.albatre} />
            <Text style={[styles.dangerText, { fontFamily: Fonts.sansSemibold }]}>Supprimer le rituel</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, palette }: { label: string; children: React.ReactNode; palette: any }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ color: palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 11, letterSpacing: 1.4 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function inputStyle(palette: any) {
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: Fonts.sans,
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  action: { fontSize: 15 },
  title: { fontSize: 28, letterSpacing: -0.5, marginTop: Spacing.lg },
  input: {
    height: 52, borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, fontSize: 16,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  danger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 52, borderRadius: Radius.md, backgroundColor: '#A8362A', marginTop: Spacing.lg,
  },
  dangerText: { color: Palette.albatre, fontSize: 15 },
});
