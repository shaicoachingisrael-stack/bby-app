import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BFont, Bby } from '@/components/bby/kit';
import { IngredientDraft, newDraft, UNITS } from '@/lib/ingredients';

type Props = {
  value: IngredientDraft[];
  onChange: (next: IngredientDraft[]) => void;
};

// Une ligne = quantité, unité, nom. L'unité se change en touchant la pastille
// (elle passe à la suivante) : pas de menu à ouvrir, la saisie reste rapide.
// Charte de la refonte : fond noir, cases sombres, accent jaune.
export function IngredientsEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const patch = (key: string, p: Partial<IngredientDraft>) =>
    onChange(value.map((d) => (d.key === key ? { ...d, ...p } : d)));

  const cycleUnit = (d: IngredientDraft) => {
    const i = UNITS.indexOf(d.unit);
    patch(d.key, { unit: UNITS[(i + 1) % UNITS.length] });
  };

  return (
    <View style={{ gap: 8 }}>
      {value.map((d) => (
        <View key={d.key} style={styles.row}>
          <TextInput
            value={d.quantity}
            onChangeText={(v) => patch(d.key, { quantity: v })}
            placeholder={t('ingredients.qtyPlaceholder')}
            placeholderTextColor="#6E6E6A"
            selectionColor={Bby.yellow}
            keyboardType="numbers-and-punctuation"
            style={[styles.input, styles.qty]}
          />
          <Pressable
            onPress={() => cycleUnit(d)}
            accessibilityLabel={t('ingredients.unitLabel')}
            style={({ pressed }) => [styles.unit, d.unit ? styles.unitOn : null, pressed && { opacity: 0.7 }]}
          >
            <Text numberOfLines={1} style={[styles.unitText, d.unit ? { color: Bby.ink } : null]}>
              {d.unit ? t(`ingredients.unit.${d.unit}`) : t('ingredients.unit.none')}
            </Text>
          </Pressable>
          <TextInput
            value={d.name}
            onChangeText={(v) => patch(d.key, { name: v })}
            placeholder={t('ingredients.namePlaceholder')}
            placeholderTextColor="#6E6E6A"
            selectionColor={Bby.yellow}
            style={[styles.input, styles.name]}
          />
          <Pressable
            onPress={() => onChange(value.filter((x) => x.key !== d.key))}
            hitSlop={8}
            accessibilityLabel={t('common.delete')}
            style={styles.remove}
          >
            <X size={18} color={Bby.muted} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...value, newDraft()])} style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }]}>
        <Plus size={16} color={Bby.text} />
        <Text style={styles.addText}>{t('ingredients.add')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Bby.line,
    backgroundColor: Bby.card,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Bby.text,
    fontFamily: BFont.sans,
  },
  qty: { width: 58, textAlign: 'center', paddingHorizontal: 4 },
  unit: {
    width: 62,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Bby.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitOn: { backgroundColor: Bby.yellow, borderColor: 'transparent' },
  unitText: { color: Bby.muted, fontFamily: BFont.sansSemibold, fontSize: 13 },
  name: { flex: 1 },
  remove: { width: 26, height: 48, alignItems: 'center', justifyContent: 'center' },
  add: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Bby.line,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addText: { color: Bby.text, fontFamily: BFont.sansSemibold, fontSize: 14 },
});
