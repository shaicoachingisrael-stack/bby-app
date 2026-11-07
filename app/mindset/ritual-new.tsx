import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Chip } from '@/components/bby/kit';
import { BackRow, MInput, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { useMyRituals, useRitualDetail } from '@/lib/mindset/use-my-rituals';
import { ritualIcon } from '@/lib/ritual-icons';

// Les huit icônes proposées : goutte, lune, cœur, soleil, feuille, souffle, tasse, livre.
const ICONS = ['droplet', 'moon', 'heart', 'sun', 'leaf', 'wind', 'coffee', 'book'] as const;
const DEFAULT_ICON = 'leaf';

// Écran 13 · Créer son rituel (formulaire court). Avec ?id=…, modifie un rituel existant.
export default function NewRitualScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { add, update } = useMyRituals();
  const { ritual } = useRitualDetail(id);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [anchor, setAnchor] = useState('');
  const [busy, setBusy] = useState(false);
  // Largeur réelle de la grille : 4 cases par ligne, calculées en points (les % + aspectRatio écrasaient les cases).
  const [gridW, setGridW] = useState(0);
  const cell = gridW ? (gridW - 3 * 10) / 4 : 0;

  useEffect(() => {
    if (!ritual) return;
    setName(ritual.label);
    setIcon(ritual.icon || DEFAULT_ICON);
    setAnchor(ritual.anchor ?? '');
  }, [ritual]);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    if (id) await update(id, { label: name.trim(), icon, anchor: anchor.trim() || null });
    else await add({ label: name, icon, anchor });
    setBusy(false);
    if (id) router.back();
    else router.navigate({ pathname: '/(tabs)/mindset', params: { filter: 'rituals' } } as any);
  };

  return (
    <MScreen>
      <BackRow />
      <Text style={mstyles.bigTitle}>{t('v2mindset.create.title')}</Text>
      <Small>{t('v2mindset.create.sub')}</Small>

      <Text style={s.label}>{t('v2mindset.create.nameLabel')}</Text>
      <MInput value={name} onChangeText={setName} placeholder={t('v2mindset.create.namePh')} maxLength={80} />

      <Text style={s.label}>{t('v2mindset.create.icon')}</Text>
      <View style={s.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
        {ICONS.map((k) => {
          const Icon = ritualIcon(k);
          const on = icon === k;
          return (
            <Pressable
              key={k}
              onPress={() => setIcon(k)}
              accessibilityRole="radio"
              accessibilityLabel={t(`v2mindset.create.icons.${k}`)}
              accessibilityState={{ selected: on }}
              style={[s.iconCell, cell ? { width: cell, height: Math.round(cell * 0.82) } : null, on && { backgroundColor: Bby.yellow }]}
            >
              <Icon size={22} color={on ? Bby.ink : Bby.text} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>

      <View style={[mstyles.rowBetween, { marginTop: 14 }]}>
        <Text style={[s.label, { marginTop: 0 }]}>{t('v2mindset.create.anchor')}</Text>
        <Small>{t('v2mindset.create.optional')}</Small>
      </View>
      <MInput value={anchor} onChangeText={setAnchor} placeholder={t('v2mindset.create.anchorPh')} maxLength={160} />
      <Text style={[mstyles.serif, s.note]}>{t('v2mindset.create.anchorNote')}</Text>

      <View style={[mstyles.chips, { marginTop: 8 }]}>
        <Chip label={t('v2mindset.ritual.everyDay')} />
        <Small>{t('v2mindset.create.rhythmNote')}</Small>
      </View>

      <View style={{ marginTop: 24 }}>
        <ActionBar
          label={id ? t('v2mindset.common.save') : t('v2mindset.create.submit')}
          icon={Check}
          onPress={submit}
          disabled={!name.trim() || busy}
        />
      </View>
    </MScreen>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.text, marginTop: 14, marginBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCell: {
    width: '22%',
    height: 64,
    borderRadius: 18,
    backgroundColor: Bby.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { color: Bby.muted, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
