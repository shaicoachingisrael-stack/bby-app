import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionBar, BFont, Bby, Card, Chip } from '@/components/bby/kit';
import { BackRow, CardTitle, MInput, MScreen, mstyles, Small } from '@/components/bby/mindset/ui';
import { useAuth } from '@/lib/auth-provider';
import { dayKey, MOODS, shortDate } from '@/lib/mindset/core';
import { type BilanFields, clearDraft, readDraft, saveBilan, useJournal, useJournalEntry, writeDraft } from '@/lib/mindset/use-journal';

const EMPTY: BilanFields = { victories: ['', '', ''], gratitude: '', tomorrow_intention: '', other_text: '', mood: null };
const STARTERS = ['person', 'calm', 'body', 'meal'] as const;

// Écran 7 · Écrire le bilan du soir : une seule page, des zones guidées.
// Brouillon gardé à la frappe ; aucune zone n'est obligatoire.
export default function WriteBilanScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const journal = useJournal();
  const existing = useJournalEntry(params.id);
  const [f, setF] = useState<BilanFields>(EMPTY);
  const [pageId, setPageId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Page à reprendre : celle demandée, sinon celle de ce soir si elle existe déjà.
  const target = params.id ? existing.entry : journal.todayPage;
  const draftRef = params.id ?? journal.todayPage?.id ?? `new-${dayKey()}`;

  useEffect(() => {
    if (ready || !user) return;
    if (params.id ? existing.loading : journal.loading) return;
    (async () => {
      const draft = await readDraft(user.id, draftRef);
      const base: BilanFields = target
        ? {
            victories: [0, 1, 2].map((i) => target.victories?.[i] ?? ''),
            gratitude: target.gratitude ?? '',
            tomorrow_intention: target.tomorrow_intention ?? '',
            other_text: target.other_text ?? '',
            mood: target.mood,
          }
        : EMPTY;
      setF(draft ?? base);
      setPageId(target?.id ?? null);
      setReady(true);
    })();
  }, [ready, user, params.id, existing.loading, journal.loading, target, draftRef]);

  const update = (patch: Partial<BilanFields>) => {
    setF((prev) => {
      const next = { ...prev, ...patch };
      if (user) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          await writeDraft(user.id, draftRef, next);
          setDraftSaved(true);
        }, 500);
      }
      return next;
    });
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const filled =
    f.victories.some((v) => v.trim()) || !!f.gratitude.trim() || !!f.tomorrow_intention.trim() || !!f.other_text.trim();
  const victoriesCount = f.victories.filter((v) => v.trim()).length;
  const date = target ? new Date(target.created_at) : new Date();

  const save = async () => {
    if (!user || !filled || busy) return;
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    const id = await saveBilan(user.id, pageId, f);
    setBusy(false);
    if (!id) {
      Alert.alert(t('v2mindset.common.saveError'));
      return;
    }
    await clearDraft(user.id, draftRef);
    router.replace(`/mindset/page?id=${id}` as any);
  };

  const addStarter = (k: (typeof STARTERS)[number]) => {
    const s = t(`v2mindset.write.starterText.${k}`);
    const cur = f.gratitude;
    update({ gratitude: cur.trim() ? `${cur.replace(/\s+$/, '')}\n${s}` : s });
  };

  if (!ready) return <MScreen><BackRow /></MScreen>;

  return (
    <MScreen>
      <BackRow right={draftSaved ? <Small>{t('v2mindset.common.draftSaved')}</Small> : null} />
      <View style={mstyles.chips}>
        <Chip label={t('v2mindset.journal.bilan')} yellow />
        <Small>{shortDate(date)}</Small>
      </View>
      <Text style={[mstyles.serif, s.title]}>{t('v2mindset.write.title')}</Text>
      <Small>{t('v2mindset.write.sub')}</Small>

      <Card tone="dark" style={{ marginTop: 8 }}>
        <View style={mstyles.rowBetween}>
          <CardTitle>{t('v2mindset.write.victories')}</CardTitle>
          <Small>{`${victoriesCount} / 3`}</Small>
        </View>
        <Small style={{ marginTop: 4, marginBottom: 6 }}>{t('v2mindset.write.victoriesSub')}</Small>
        {[0, 1, 2].map((i) => (
          <View key={i} style={s.victoryRow}>
            <View style={[s.num, f.victories[i].trim() ? { backgroundColor: Bby.yellow } : null]}>
              <Text style={[s.numText, f.victories[i].trim() ? { color: Bby.ink } : null]}>{i + 1}</Text>
            </View>
            <MInput
              value={f.victories[i]}
              onChangeText={(v) => update({ victories: f.victories.map((x, j) => (j === i ? v : x)) })}
              placeholder={t(`v2mindset.write.victory${i + 1}`)}
              style={s.lineInput}
              returnKeyType="next"
            />
          </View>
        ))}
      </Card>

      <Card tone="dark">
        <CardTitle>{t('v2mindset.write.gratitude')}</CardTitle>
        <Small style={{ marginTop: 4, marginBottom: 8 }}>{t('v2mindset.write.gratitudeSub')}</Small>
        <MInput value={f.gratitude} onChangeText={(v) => update({ gratitude: v })} placeholder={t('v2mindset.write.gratitudePh')} multiline />
        <View style={[mstyles.chips, { marginTop: 12 }]}>
          {STARTERS.map((k) => (
            <Pressable key={k} onPress={() => addStarter(k)} style={s.starter} accessibilityRole="button">
              <Text style={s.starterText}>{t(`v2mindset.write.starters.${k}`)}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card tone="dark">
        <CardTitle>{t('v2mindset.write.tomorrow')}</CardTitle>
        <Small style={{ marginTop: 4, marginBottom: 8 }}>{t('v2mindset.write.tomorrowSub')}</Small>
        <MInput
          value={f.tomorrow_intention}
          onChangeText={(v) => update({ tomorrow_intention: v })}
          placeholder={t('v2mindset.write.tomorrowPh')}
          multiline
          style={{ minHeight: 64 }}
        />
        <Small style={{ marginTop: 8 }}>{t('v2mindset.write.tomorrowNote')}</Small>
      </Card>

      <Card tone="dark">
        <CardTitle>{t('v2mindset.write.other')}</CardTitle>
        <Small style={{ marginTop: 4, marginBottom: 8 }}>{t('v2mindset.write.otherSub')}</Small>
        <MInput value={f.other_text} onChangeText={(v) => update({ other_text: v })} placeholder={t('v2mindset.write.otherPh')} multiline style={{ minHeight: 110 }} />
      </Card>

      <Text style={s.moodTitle}>{t('v2mindset.write.moodTitle')}</Text>
      <View style={mstyles.chips}>
        {MOODS.map((k) => {
          const on = f.mood === k;
          return (
            <Pressable
              key={k}
              onPress={() => update({ mood: on ? null : k })}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[s.mood, on && { backgroundColor: Bby.yellow, borderColor: 'transparent' }]}
            >
              <Text style={[s.moodText, on && { color: Bby.ink }]}>{t(`v2mindset.moods.${k}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 18 }}>
        <ActionBar label={t('v2mindset.write.save')} icon={Check} onPress={save} disabled={!filled || busy} note={t('v2mindset.write.private')} />
      </View>
    </MScreen>
  );
}

const s = StyleSheet.create({
  title: { color: Bby.text, fontSize: 30, lineHeight: 38, marginTop: 6 },
  victoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  num: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: Bby.line, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: BFont.display, fontSize: 12, color: Bby.muted },
  lineInput: { flex: 1, paddingVertical: 10 },
  starter: { borderWidth: 1.5, borderColor: Bby.line, borderRadius: 999, paddingHorizontal: 14, height: 36, justifyContent: 'center' },
  starterText: { fontFamily: BFont.sansMedium, fontSize: 13, color: Bby.text },
  moodTitle: { fontFamily: BFont.sansSemibold, fontSize: 15, color: Bby.text, marginTop: 14 },
  mood: { borderWidth: 1.5, borderColor: Bby.line, borderRadius: 999, paddingHorizontal: 16, height: 42, justifyContent: 'center' },
  moodText: { fontFamily: BFont.sansSemibold, fontSize: 14, color: Bby.text },
});
