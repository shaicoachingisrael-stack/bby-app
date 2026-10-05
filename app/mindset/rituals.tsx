import { useRouter } from 'expo-router';
import { Check, ChevronLeft, MinusCircle, Plus, PlusCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RITUAL_ICON_KEYS, ritualIcon } from '@/lib/ritual-icons';
import { useRitualCatalog, useRituals } from '@/lib/use-rituals';

export default function RitualsManageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const palette = Colors[useColorScheme() ?? 'light'];

  const { rituals, addRitual, removeRitual } = useRituals();
  const { items: catalog } = useRitualCatalog();

  const [showCustom, setShowCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customIcon, setCustomIcon] = useState('leaf');

  const usedCatalog = new Set(rituals.map((r) => r.catalog_id).filter(Boolean) as string[]);
  const available = catalog.filter((c) => !usedCatalog.has(c.id));

  async function addCustom() {
    if (!customLabel.trim()) return;
    await addRitual(customLabel, customIcon, null);
    setCustomLabel('');
    setShowCustom(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: palette.background }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <ChevronLeft size={24} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
            {t('common.back')}
          </Text>
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
          {t('rituals.manageTitle')}
        </Text>
        <Text style={[styles.reset, { color: palette.textSecondary, fontFamily: Fonts.sans }]}>
          {t('rituals.resetHint')}
        </Text>

        {/* Liste actuelle */}
        {rituals.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            {rituals.map((r) => {
              const Icon = ritualIcon(r.icon);
              return (
                <View key={r.id} style={[styles.row, { backgroundColor: palette.surface }]}>
                  <Icon size={18} color={palette.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.rowLabel, { color: palette.text, fontFamily: Fonts.sans }]}>
                    {r.label}
                  </Text>
                  <Pressable hitSlop={8} onPress={() => removeRitual(r.id)}>
                    <MinusCircle size={22} color={palette.textSecondary} strokeWidth={1.8} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Ajout personnalisé */}
        {!showCustom ? (
          <Pressable
            onPress={() => setShowCustom(true)}
            style={[styles.addCustom, { borderColor: palette.border }]}
          >
            <Plus size={18} color={palette.text} />
            <Text style={[styles.addCustomText, { color: palette.text, fontFamily: Fonts.sansMedium }]}>
              {t('rituals.custom')}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.customCard, { backgroundColor: palette.surface }]}>
            <TextInput
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder={t('rituals.customLabel')}
              placeholderTextColor={palette.textSecondary}
              autoFocus
              style={[styles.input, { color: palette.text, fontFamily: Fonts.sans }]}
            />
            <Text style={[styles.iconLabel, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              {t('rituals.chooseIcon').toUpperCase()}
            </Text>
            <View style={styles.iconGrid}>
              {RITUAL_ICON_KEYS.map((key) => {
                const Icon = ritualIcon(key);
                const active = customIcon === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setCustomIcon(key)}
                    style={[
                      styles.iconChip,
                      { backgroundColor: active ? palette.text : palette.background },
                    ]}
                  >
                    <Icon size={18} color={active ? palette.background : palette.textSecondary} strokeWidth={1.8} />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={addCustom}
              style={({ pressed }) => [
                styles.confirm,
                { backgroundColor: palette.text, opacity: pressed || !customLabel.trim() ? 0.6 : 1 },
              ]}
            >
              <Check size={16} color={palette.background} />
              <Text style={[styles.confirmText, { color: palette.background, fontFamily: Fonts.sansSemibold }]}>
                {t('rituals.add')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Catalogue suggéré */}
        {available.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={[styles.catalogTitle, { color: palette.textSecondary, fontFamily: Fonts.sansMedium }]}>
              {t('rituals.fromCatalog').toUpperCase()}
            </Text>
            {available.map((c) => {
              const Icon = ritualIcon(c.icon);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => addRitual(c.label, c.icon, c.id)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: palette.surface, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Icon size={18} color={palette.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.rowLabel, { color: palette.text, fontFamily: Fonts.sans }]}>
                    {c.label}
                  </Text>
                  <PlusCircle size={22} color={palette.text} strokeWidth={1.8} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 15, marginLeft: 2 },
  title: { fontSize: 30, letterSpacing: -0.5, marginTop: Spacing.lg },
  reset: { fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: Radius.md,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  addCustom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 52, borderRadius: Radius.pill, borderWidth: 1,
  },
  addCustomText: { fontSize: 14 },
  customCard: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.md },
  input: { fontSize: 16, paddingVertical: Spacing.sm },
  iconLabel: { fontSize: 11, letterSpacing: 1.4 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconChip: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  confirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 48, borderRadius: Radius.pill,
  },
  confirmText: { fontSize: 14 },
  catalogTitle: { fontSize: 11, letterSpacing: 1.4, marginTop: Spacing.md },
});
