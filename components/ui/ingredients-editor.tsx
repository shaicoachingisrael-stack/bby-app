import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IngredientDraft, newDraft, UNITS } from '@/lib/ingredients';

type Props = {
  value: IngredientDraft[];
  onChange: (next: IngredientDraft[]) => void;
};

// Une ligne = quantité, unité, nom. L'unité se change en touchant la pastille
// (elle passe à la suivante) : pas de menu à ouvrir, la saisie reste rapide.
export function IngredientsEditor({ value, onChange }: Props) {
  const palette = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();

  const patch = (key: string, p: Partial<IngredientDraft>) =>
    onChange(value.map((d) => (d.key === key ? { ...d, ...p } : d)));

  const cycleUnit = (d: IngredientDraft) => {
    const i = UNITS.indexOf(d.unit);
    patch(d.key, { unit: UNITS[(i + 1) % UNITS.length] });
  };

  const field = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: Fonts.sans,
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      {value.map((d) => (
        <View key={d.key} style={styles.row}>
          <TextInput
            value={d.quantity}
            onChangeText={(v) => patch(d.key, { quantity: v })}
            placeholder={t('ingredients.qtyPlaceholder')}
            placeholderTextColor={palette.textSecondary}
            keyboardType="numbers-and-punctuation"
            style={[styles.input, styles.qty, field]}
          />
          <Pressable
            onPress={() => cycleUnit(d)}
            accessibilityLabel={t('ingredients.unitLabel')}
            style={({ pressed }) => [
              styles.unit,
              { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{ color: d.unit ? palette.text : palette.textSecondary, fontFamily: Fonts.sansMedium, fontSize: 13 }}
            >
              {d.unit ? t(`ingredients.unit.${d.unit}`) : t('ingredients.unit.none')}
            </Text>
          </Pressable>
          <TextInput
            value={d.name}
            onChangeText={(v) => patch(d.key, { name: v })}
            placeholder={t('ingredients.namePlaceholder')}
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, styles.name, field]}
          />
          <Pressable
            onPress={() => onChange(value.filter((x) => x.key !== d.key))}
            hitSlop={8}
            accessibilityLabel={t('common.delete')}
            style={styles.remove}
          >
            <X size={18} color={palette.textSecondary} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...value, newDraft()])}
        style={({ pressed }) => [styles.add, { borderColor: palette.border, opacity: pressed ? 0.7 : 1 }]}
      >
        <Plus size={16} color={palette.text} />
        <Text style={{ color: palette.text, fontFamily: Fonts.sansMedium, fontSize: 14 }}>
          {t('ingredients.add')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: { height: 48, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 15 },
  qty: { width: 62, textAlign: 'center', paddingHorizontal: 4 },
  unit: {
    width: 62,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1 },
  remove: { width: 28, height: 48, alignItems: 'center', justifyContent: 'center' },
  add: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
