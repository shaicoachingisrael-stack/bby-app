import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check, Pencil, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Card, Chip, PillButton, RoundButton, RowCard } from '@/components/bby/kit';
import { Body, CardTitle, MInput, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { isActive } from '@/lib/mindset/core';
import { useParcours, useParcoursList } from '@/lib/mindset/use-parcours';

// Écran 4 · Clôture du parcours : le parcours se termine, le geste reste.
export default function ParcoursClosing() {
  const { program: programId } = useLocalSearchParams<{ program: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { program, progress, loading, saveKept, keep, closeWithoutKeeping } = useParcours(programId);
  const list = useParcoursList();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ anchor: '', backup: '', satisfaction_mark: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (progress) setF({ anchor: progress.anchor ?? '', backup: progress.backup ?? '', satisfaction_mark: progress.satisfaction_mark ?? '' });
  }, [progress]);

  if (loading || !program || !progress) return <MScreen />;

  // Une seule suggestion pour la suite, jamais une injonction.
  const next = list.programs.find((p) => p.id !== program.id && !list.progress[p.id]) ??
    list.programs.find((p) => p.id !== program.id && !isActive(list.progress[p.id])) ??
    null;

  const close = async () => {
    await closeWithoutKeeping();
    router.navigate({ pathname: '/(tabs)/mindset', params: { filter: 'parcours' } } as any);
  };

  const onKeep = async () => {
    if (busy) return;
    setBusy(true);
    if (editing) {
      await saveKept(f);
      setEditing(false);
    }
    await keep(f.anchor);
    setBusy(false);
    router.navigate('/(tabs)/today' as any);
  };

  const rows = [
    { key: 'anchor' as const, label: t('v2mindset.closing.anchor') },
    { key: 'backup' as const, label: t('v2mindset.closing.backup') },
    { key: 'satisfaction_mark' as const, label: t('v2mindset.closing.mark') },
  ];

  return (
    <MScreen>
      <View style={mstyles.rowBetween}>
        <View style={mstyles.chips}>
          <Chip label={t('v2mindset.closing.parcours')} />
          <Chip label={t('v2mindset.parcours.dayChip', { n: program.day_count, total: program.day_count })} yellow />
        </View>
        <RoundButton icon={X} variant="outline" size={48} label={t('v2mindset.closing.close')} onPress={close} />
      </View>

      <Text style={[mstyles.bigTitle, { marginTop: 10 }]}>{t('v2mindset.closing.title')}</Text>
      <Body style={{ color: Bby.muted, marginTop: 4 }}>{t('v2mindset.closing.body')}</Body>

      <Card tone="yellow" style={{ marginTop: 10 }}>
        <View style={mstyles.rowBetween}>
          <CardTitle dark style={{ flex: 1, fontSize: 19, lineHeight: 23 }}>
            {t('v2mindset.closing.keptTitle')}
          </CardTitle>
          <RoundButton
            icon={editing ? Check : Pencil}
            variant="outlineDark"
            size={44}
            label={t('v2mindset.common.edit')}
            onPress={async () => {
              if (editing) await saveKept(f);
              setEditing(!editing);
            }}
          />
        </View>
        {rows.map((r) => (
          <View key={r.key}>
            <View style={[mstyles.sepLight, { marginVertical: 12 }]} />
            <Small dark>{r.label}</Small>
            {editing ? (
              <MInput
                onLight
                value={f[r.key]}
                onChangeText={(v) => setF((x) => ({ ...x, [r.key]: v }))}
                multiline
                style={{ marginTop: 6, minHeight: 56 }}
              />
            ) : (
              <Body dark style={{ marginTop: 4, fontFamily: BFont.sansMedium, fontSize: 16 }}>
                {f[r.key].trim() || t('v2mindset.closing.empty')}
              </Body>
            )}
          </View>
        ))}
      </Card>

      <Card tone="dark" onPress={() => router.push(`/mindset/entries?program=${program.id}` as any)} style={{ paddingVertical: 18 }}>
        <View style={mstyles.rowBetween}>
          <Text style={s.rowText}>{t('v2mindset.closing.rereadJournal')}</Text>
          <ArrowRight size={20} color={Bby.text} />
        </View>
      </Card>

      {next ? (
        <RowCard
          tone="alt"
          label={t('v2mindset.closing.next')}
          title={next.title}
          sub={t('v2mindset.parcours.meta', { count: next.day_count, range: next.minutes_range ?? '' })}
          onPress={() => router.push(`/mindset/program/${next.id}` as any)}
          right={<RoundButton icon={ArrowRight} variant="outline" size={48} />}
        />
      ) : null}

      <View style={{ marginTop: 10 }}>
        {progress.kept ? (
          <>
            <Small style={{ textAlign: 'center', marginBottom: 10 }}>{t('v2mindset.closing.keptDone')}</Small>
            <PillButton label={t('v2mindset.closing.backToday')} variant="white" onPress={() => router.navigate('/(tabs)/today' as any)} />
          </>
        ) : (
          <ActionBar label={t('v2mindset.closing.keep')} icon={Check} onPress={onKeep} disabled={busy} trailing={<ArrowRight size={20} color={Bby.ink} />} />
        )}
      </View>
    </MScreen>
  );
}

const s = StyleSheet.create({
  rowText: { fontFamily: BFont.sansSemibold, fontSize: 16, color: Bby.text, flex: 1 },
});
