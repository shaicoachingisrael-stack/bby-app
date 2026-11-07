import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Card } from '@/components/bby/kit';
import { BackRow, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { useCatalog, useMyRituals } from '@/lib/mindset/use-my-rituals';
import { ritualIcon } from '@/lib/ritual-icons';

// Écran 12 · Ajouter un rituel : catalogue BBY (éditorial), sans filtres.
// « + » ajoute sans quitter l'écran ; la coche jaune retire.
export default function AddRitualScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { items } = useCatalog();
  const { rituals, add, archive, refresh } = useMyRituals();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const done = () => (router.canGoBack() ? router.back() : router.navigate({ pathname: '/(tabs)/mindset', params: { filter: 'rituals' } } as any));

  return (
    <MScreen>
      <BackRow
        onBack={done}
        right={
          <Pressable onPress={done} hitSlop={12} accessibilityRole="button">
            <Small style={{ fontSize: 15 }}>{t('v2mindset.add.done')}</Small>
          </Pressable>
        }
      />
      <Text style={mstyles.bigTitle}>{t('v2mindset.add.title')}</Text>
      <Small style={{ marginBottom: 8 }}>{t('v2mindset.add.sub')}</Small>

      {items.map((it) => {
        const mine = rituals.find((r) => r.catalog_id === it.id);
        const Icon = ritualIcon(it.icon);
        return (
          <Card key={it.id} tone="dark" style={s.card}>
            <View style={s.row}>
              <View style={s.icon}>
                <Icon size={18} color={Bby.text} strokeWidth={2} />
              </View>
              <Text style={s.label} numberOfLines={2}>
                {it.label}
              </Text>
              <Pressable
                onPress={() => (mine ? archive(mine.id) : add({ label: it.label, icon: it.icon, catalogId: it.id }))}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={mine ? t('v2mindset.add.added') : t('v2mindset.add.add')}
                style={[s.toggle, mine ? { backgroundColor: Bby.yellow, borderWidth: 0 } : null]}
              >
                {mine ? <Check size={18} color={Bby.ink} strokeWidth={2.6} /> : <Plus size={18} color={Bby.text} strokeWidth={2.2} />}
              </Pressable>
            </View>
          </Card>
        );
      })}

      <View style={{ marginTop: 14 }}>
        <ActionBar label={t('v2mindset.add.create')} icon={Plus} onPress={() => router.push('/mindset/ritual-new' as any)} />
      </View>
    </MScreen>
  );
}

const s = StyleSheet.create({
  card: { paddingVertical: 12, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Bby.cardAlt, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text },
  toggle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
});
