import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BFont, Bby, Card, RoundButton } from '@/components/bby/kit';
import { BackRow, MScreen, mstyles, PrivateNote, Small } from '@/components/bby/mindset/ui';
import { entryPreview, shortDate } from '@/lib/mindset/core';
import { dayInfoKey, useJournal } from '@/lib/mindset/use-journal';
import { useParcours } from '@/lib/mindset/use-parcours';

// Relire les pages d'un parcours (« Relire mon journal de la semaine »).
// Sans ?program=…, montre toutes les pages du journal.
export default function JournalEntriesScreen() {
  const { program: programId } = useLocalSearchParams<{ program?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { program } = useParcours(programId);
  const { entries, dayInfo, loading, refresh } = useJournal(programId);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Pages d'un parcours : dans l'ordre des jours.
  const list = programId ? [...entries].sort((a, b) => (a.program_day ?? 0) - (b.program_day ?? 0)) : entries;

  return (
    <MScreen>
      <BackRow />
      <Text style={mstyles.bigTitle}>{program?.title ?? t('v2mindset.journal.firstTitle')}</Text>
      <Small>{t('v2mindset.entries.sub')}</Small>

      {!loading && !list.length ? (
        <Card tone="alt" style={{ marginTop: 10 }}>
          <Small style={{ fontSize: 14 }}>{t('v2mindset.entries.empty')}</Small>
        </Card>
      ) : null}

      {list.map((e) => {
        const info = e.kind === 'parcours' ? dayInfo[dayInfoKey(e)] : undefined;
        const { title, excerpt } = entryPreview(e, info?.title);
        const meta = [
          shortDate(e.created_at),
          e.kind === 'parcours' && e.program_day && program
            ? t('v2mindset.parcours.dayChip', { n: e.program_day, total: program.day_count })
            : t('v2mindset.journal.bilan'),
        ].join(' · ');
        return (
          <Card key={e.id} tone="dark" onPress={() => router.push(`/mindset/page?id=${e.id}` as any)}>
            <View style={[mstyles.rowBetween, { alignItems: 'flex-start' }]}>
              <View style={{ flex: 1 }}>
                <Small>{meta}</Small>
                {title ? <Text style={s.title} numberOfLines={3}>{title}</Text> : null}
                {excerpt ? <Small style={{ marginTop: 6, fontSize: 14 }}>{excerpt}</Small> : null}
              </View>
              <RoundButton icon={ArrowRight} variant="outline" size={44} />
            </View>
          </Card>
        );
      })}
      <PrivateNote text={t('v2mindset.common.pagesPrivate')} />
    </MScreen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: BFont.display, fontSize: 20, lineHeight: 24, color: Bby.text, marginTop: 6 },
});
