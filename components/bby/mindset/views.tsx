// Les quatre vues de la page Mindset (une seule page, filtre en puces).
import { useRouter } from 'expo-router';
import { ArrowRight, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BFont,
  Bby,
  Card,
  CheckCircle,
  Chip,
  Editorial,
  PillButton,
  RoundButton,
  RowCard,
  SectionHeader,
  TiltCard,
} from '@/components/bby/kit';
import { entryPreview, type JournalEntry, monthName, type MyRitual, type Parcours, shortDate } from '@/lib/mindset/core';
import { type DayInfo, dayInfoKey } from '@/lib/mindset/use-journal';
import type { ActiveParcours } from '@/lib/mindset/use-parcours';

import { DayBadge, type MindsetFilter, mstyles, PhraseButtons, PrivateNote, Small } from './ui';

const go = (router: ReturnType<typeof useRouter>, path: string) => router.push(path as any);

function parcoursMeta(t: (k: string, o?: any) => string, p: Parcours) {
  return t('v2mindset.parcours.meta', { count: p.day_count, range: p.minutes_range ?? '' });
}

// ---------------------------------------------------------------------------
// Carte du parcours en cours (blanche, pastille noire « 4/7 »)

export function ActiveParcoursCard({ a }: { a: ActiveParcours }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Card tone="light" onPress={() => go(router, `/mindset/day?program=${a.program.id}`)}>
      <View style={mstyles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={s.lightTitle}>{a.program.title}</Text>
          <Small dark style={{ marginTop: 6 }}>
            {t('v2mindset.tab.inProgress', { day: a.dayTitle })}
          </Small>
        </View>
        <DayBadge label={`${a.day}/${a.program.day_count}`} />
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 1A · Tous

export function AllView({
  affirmation,
  active,
  todayPage,
  ritualsDone,
  ritualsTotal,
  nextRitual,
  onFilter,
}: {
  affirmation: string | null;
  active: ActiveParcours | null;
  todayPage: JournalEntry | null;
  ritualsDone: number;
  ritualsTotal: number;
  nextRitual: string | null;
  onFilter: (f: MindsetFilter) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const page = todayPage ? entryPreview(todayPage) : null;
  return (
    <>
      <TiltCard>
        <View style={mstyles.rowBetween}>
          <Text style={s.tiltTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t('v2mindset.tab.affirmationTitle')}</Text>
          <Small dark>{shortDate(new Date())}</Small>
        </View>
        <Editorial dark style={{ marginTop: 12 }}>
          {affirmation ?? t('v2mindset.tab.affirmationEmpty')}
        </Editorial>
        {affirmation ? (
          <View style={{ alignItems: 'flex-end', marginTop: 14 }}>
            <PhraseButtons text={affirmation} source="affirmation" />
          </View>
        ) : null}
      </TiltCard>

      <SectionHeader title={t('v2mindset.tab.yourParcours')} right={t('v2mindset.tab.seeAll')} onRight={() => onFilter('parcours')} />
      {active ? (
        <ActiveParcoursCard a={active} />
      ) : (
        <RowCard
          tone="dark"
          title={t('v2mindset.tab.noParcoursTitle')}
          sub={t('v2mindset.tab.noParcoursSub')}
          onPress={() => onFilter('parcours')}
          right={<RoundButton icon={ArrowRight} variant="outline" size={48} />}
        />
      )}

      <SectionHeader title={t('v2mindset.tab.pageOfDay')} right={t('v2mindset.tab.journalLink')} onRight={() => onFilter('journal')} />
      {todayPage && page ? (
        <Card tone="alt" onPress={() => go(router, `/mindset/page?id=${todayPage.id}`)}>
          <Small>{t('v2mindset.tab.pageWritten')}</Small>
          {page.title ? (
            <Text style={[mstyles.serif, { color: Bby.text, marginTop: 8 }]} numberOfLines={2}>
              {page.title}
            </Text>
          ) : null}
          <View style={[mstyles.rowBetween, { marginTop: 14 }]}>
            <Small>{t('v2mindset.tab.pageMeta')}</Small>
            <PillButton label={t('v2mindset.tab.reread')} variant="white" onPress={() => go(router, `/mindset/page?id=${todayPage.id}`)} style={s.smallPill} />
          </View>
        </Card>
      ) : (
        <Card tone="alt">
          <Text style={[mstyles.serif, { color: Bby.text }]}>{t('v2mindset.tab.pagePrompt')}</Text>
          <View style={[mstyles.rowBetween, { marginTop: 14 }]}>
            <Small>{t('v2mindset.tab.pageMeta')}</Small>
            <PillButton label={t('v2mindset.tab.write')} icon={Plus} variant="white" onPress={() => go(router, '/mindset/write')} style={s.smallPill} />
          </View>
        </Card>
      )}

      <SectionHeader title={t('v2mindset.tab.yourRituals')} right={t('v2mindset.tab.seeAll')} onRight={() => onFilter('rituals')} />
      <Card tone="dark" onPress={() => onFilter('rituals')}>
        <View style={mstyles.rowBetween}>
          <View style={{ flex: 1 }}>
            {ritualsTotal > 0 ? (
              <>
                <Text style={s.count}>{`${ritualsDone} / ${ritualsTotal}`}</Text>
                <Small style={{ marginTop: 4 }}>
                  {nextRitual ? t('v2mindset.tab.next', { label: nextRitual }) : t('v2mindset.tab.allDone')}
                </Small>
              </>
            ) : (
              <>
                <Text style={s.darkTitle}>{t('v2mindset.tab.noRituals')}</Text>
                <Small style={{ marginTop: 4 }}>{t('v2mindset.tab.noRitualsSub')}</Small>
              </>
            )}
          </View>
          <RoundButton icon={ArrowRight} variant="outline" size={48} />
        </View>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1B · Parcours

export function ParcoursView({
  active,
  toDiscover,
  finished = {},
}: {
  active: ActiveParcours[];
  toDiscover: Parcours[];
  finished?: Record<string, boolean>;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  // Les parcours déjà terminés passent après les nouveaux : la carte jaune reste une découverte.
  const ordered = [...toDiscover.filter((p) => !finished[p.id]), ...toDiscover.filter((p) => finished[p.id])];
  return (
    <>
      {active.length ? (
        <>
          <SectionHeader title={t('v2mindset.parcours.inProgressSection')} />
          {active.map((a) => (
            <ActiveParcoursCard key={a.program.id} a={a} />
          ))}
        </>
      ) : null}
      {toDiscover.length ? (
        <>
          <SectionHeader title={t('v2mindset.parcours.discover')} />
          {ordered.map((p, i) => {
            const done = !!finished[p.id];
            const highlight = i === 0 && !done;
            return (
              <RowCard
                key={p.id}
                tone={highlight ? 'yellow' : 'alt'}
                badge={done ? <Chip label={t('v2mindset.parcours.finished')} /> : undefined}
                title={p.title}
                sub={parcoursMeta(t, p)}
                onPress={() => go(router, `/mindset/program/${p.id}`)}
                right={<RoundButton icon={ArrowRight} variant={highlight ? 'outlineDark' : 'outline'} size={48} />}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 / 9 · Journal

export function JournalView({
  entries,
  dayInfo,
  todayPage,
}: {
  entries: JournalEntry[];
  dayInfo: Record<string, DayInfo>;
  todayPage: JournalEntry | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  // 9 · Premier lancement
  if (!entries.length) {
    return (
      <>
        <TiltCard>
          <Text style={s.tiltTitle}>{t('v2mindset.journal.firstTitle')}</Text>
          <Editorial dark style={{ marginTop: 12 }}>
            {t('v2mindset.journal.firstText')}
          </Editorial>
          <PillButton
            label={t('v2mindset.journal.firstButton')}
            icon={Plus}
            onPress={() => go(router, '/mindset/write')}
            style={{ marginTop: 18 }}
          />
        </TiltCard>
        <Card tone="alt">
          <Small>{t('v2mindset.journal.guidedLabel')}</Small>
          <Text style={[mstyles.serif, { color: Bby.text, marginTop: 6 }]}>{t('v2mindset.journal.guidedText')}</Text>
          <Small style={{ marginTop: 6 }}>{t('v2mindset.journal.guidedNote')}</Small>
        </Card>
        <PrivateNote text={t('v2mindset.common.pagesPrivate')} />
      </>
    );
  }

  // Pages groupées par mois, de la plus récente à la plus ancienne.
  const groups: { month: string; items: JournalEntry[] }[] = [];
  for (const e of entries) {
    const k = monthName(e.created_at) + new Date(e.created_at).getFullYear();
    const last = groups[groups.length - 1];
    if (last && last.month === k) last.items.push(e);
    else groups.push({ month: k, items: [e] });
  }
  let index = 0;

  return (
    <>
      <TiltCard>
        <View style={mstyles.rowBetween}>
          <Text style={s.tiltTitle}>{t('v2mindset.journal.pageOfDay')}</Text>
          <Small dark>{shortDate(new Date())}</Small>
        </View>
        <Editorial dark style={{ marginTop: 12 }}>
          {todayPage ? t('v2mindset.journal.writtenToday') : t('v2mindset.tab.pagePrompt')}
        </Editorial>
        <View style={[mstyles.rowBetween, { marginTop: 16 }]}>
          <Small dark>{t('v2mindset.tab.pageMeta')}</Small>
          {todayPage ? (
            <PillButton label={t('v2mindset.tab.reread')} onPress={() => go(router, `/mindset/page?id=${todayPage.id}`)} style={s.smallPill} />
          ) : (
            <PillButton label={t('v2mindset.tab.write')} icon={Plus} onPress={() => go(router, '/mindset/write')} style={s.smallPill} />
          )}
        </View>
      </TiltCard>

      {groups.map((g, gi) => (
        <View key={g.month} style={{ gap: 10 }}>
          <SectionHeader
            title={gi === 0 ? t('v2mindset.journal.yourPages') : monthName(g.items[0].created_at)}
            right={gi === 0 ? monthName(g.items[0].created_at) : undefined}
          />
          {g.items.map((e) => {
            const info = e.kind === 'parcours' ? dayInfo[dayInfoKey(e)] : undefined;
            const { title, excerpt } = entryPreview(e, info?.title);
            const tone = e.kind === 'parcours' ? 'yellow' : index === 0 ? 'light' : 'dark';
            index++;
            const onLight = tone !== 'dark';
            const meta = [
              shortDate(e.created_at),
              e.kind === 'parcours'
                ? t('v2mindset.journal.parcoursSource', { title: info?.programTitle ?? '' })
                : e.kind === 'journal'
                  ? t('v2mindset.journal.note')
                  : t('v2mindset.journal.bilan'),
              e.kind === 'bilan_du_soir' && e.mood && isMood(e.mood) ? t(`v2mindset.moods.${e.mood}`) : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Card key={e.id} tone={tone} onPress={() => go(router, `/mindset/page?id=${e.id}`)}>
                <View style={[mstyles.rowBetween, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <Small dark={onLight}>{meta}</Small>
                    {title ? (
                      <Text style={[s.pageTitle, { color: onLight ? Bby.ink : Bby.text }]} numberOfLines={3}>
                        {title}
                      </Text>
                    ) : null}
                    {excerpt ? (
                      <Small dark={onLight} style={{ marginTop: 6, fontSize: 14 }}>
                        {excerpt}
                      </Small>
                    ) : null}
                  </View>
                  <RoundButton icon={ArrowRight} variant={tone === 'light' ? 'black' : onLight ? 'outlineDark' : 'outline'} size={44} />
                </View>
              </Card>
            );
          })}
        </View>
      ))}
      <PrivateNote text={t('v2mindset.common.pagesPrivate')} />
    </>
  );
}

const MOOD_SET = new Set(['calm', 'light', 'tired', 'tense', 'energized', 'lost']);
export const isMood = (m: string) => MOOD_SET.has(m);

// ---------------------------------------------------------------------------
// 10 / 14 · Rituels

export function RitualsView({
  rituals,
  checked,
  onToggle,
  parcoursTags,
  suggestion,
}: {
  rituals: MyRitual[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  parcoursTags: Record<string, string>;
  suggestion: Parcours | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  // 14 · Premier lancement
  if (!rituals.length) {
    return (
      <>
        <TiltCard>
          <Text style={s.tiltTitle}>{t('v2mindset.rituals.emptyTitle')}</Text>
          <Editorial dark style={{ marginTop: 12 }}>
            {t('v2mindset.rituals.emptyText')}
          </Editorial>
          <PillButton label={t('v2mindset.rituals.emptyButton')} icon={Plus} onPress={() => go(router, '/mindset/rituals')} style={{ marginTop: 18 }} />
        </TiltCard>
        {suggestion ? (
          <RowCard
            tone="alt"
            label={t('v2mindset.rituals.noIdea')}
            title={suggestion.title}
            sub={t('v2mindset.rituals.noIdeaMeta', { count: suggestion.day_count, range: suggestion.minutes_range ?? '' })}
            onPress={() => go(router, `/mindset/program/${suggestion.id}`)}
            right={<RoundButton icon={ArrowRight} variant="outline" size={48} />}
          />
        ) : null}
      </>
    );
  }

  const done = rituals.filter((r) => checked.has(r.id)).length;
  const nextId = rituals.find((r) => !checked.has(r.id))?.id;

  return (
    <>
      <TiltCard>
        <View style={mstyles.rowBetween}>
          <Text style={s.tiltTitle}>{t('v2mindset.rituals.todayTitle')}</Text>
          <Small dark>{shortDate(new Date())}</Small>
        </View>
        <View style={s.bigCountRow}>
          <Text style={s.bigCount} numberOfLines={1} adjustsFontSizeToFit>{`${done} / ${rituals.length}`}</Text>
          <Text style={s.bigCountUnit}>{t('v2mindset.rituals.unit')}</Text>
        </View>
        <Editorial dark style={{ fontSize: 19, lineHeight: 26 }}>
          {done === rituals.length ? t('v2mindset.rituals.allDone') : t('v2mindset.rituals.countLine')}
        </Editorial>
      </TiltCard>

      <SectionHeader title={t('v2mindset.rituals.yourRituals')} right={t('v2mindset.rituals.manage')} onRight={() => go(router, '/mindset/rituals')} />
      {rituals.map((r) => {
        const isDone = checked.has(r.id);
        const isNext = r.id === nextId;
        const tag = r.program_id ? parcoursTags[r.program_id] : undefined;
        return (
          <Card key={r.id} tone={isNext ? 'light' : 'dark'} onPress={() => go(router, `/mindset/ritual?id=${r.id}`)} style={{ paddingVertical: 16 }}>
            <View style={s.ritualRow}>
              {isDone ? (
                <CheckCircle checked onPress={() => onToggle(r.id)} size={36} />
              ) : (
                <Pressable
                  onPress={() => onToggle(r.id)}
                  hitSlop={12}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: false }}
                  style={[s.emptyCircle, { borderColor: isNext ? Bby.ink : Bby.text }]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    s.ritualTitle,
                    { color: isNext ? Bby.ink : isDone ? Bby.muted : Bby.text },
                    isDone && { textDecorationLine: 'line-through' },
                  ]}
                  numberOfLines={3}
                >
                  {r.label}
                </Text>
                {tag ? <Small dark={isNext} style={{ marginTop: 4 }}>{tag}</Small> : null}
              </View>
              {isNext ? <RoundButton icon={ArrowRight} variant="black" size={40} /> : null}
            </View>
          </Card>
        );
      })}
      <PillButton label={t('v2mindset.rituals.add')} icon={Plus} variant="outline" onPress={() => go(router, '/mindset/rituals')} style={{ marginTop: 6 }} />
      <Text style={s.note}>{t('v2mindset.rituals.resetNote')}</Text>
    </>
  );
}

const s = StyleSheet.create({
  tiltTitle: { fontFamily: BFont.display, fontSize: 17, color: Bby.ink, letterSpacing: -0.2, flexShrink: 1 },
  lightTitle: { fontFamily: BFont.display, fontSize: 20, lineHeight: 24, color: Bby.ink, letterSpacing: -0.3 },
  darkTitle: { fontFamily: BFont.display, fontSize: 18, lineHeight: 22, color: Bby.text },
  pageTitle: { fontFamily: BFont.display, fontSize: 19, lineHeight: 23, letterSpacing: -0.3, marginTop: 6 },
  count: { fontFamily: BFont.display, fontSize: 36, color: Bby.text, letterSpacing: -0.5 },
  smallPill: { height: 44, paddingHorizontal: 18 },
  bigCountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 6, marginBottom: 8 },
  bigCount: { fontFamily: BFont.display, fontSize: 72, lineHeight: 80, color: Bby.ink, letterSpacing: -2, flexShrink: 1 },
  bigCountUnit: { fontFamily: BFont.sans, fontSize: 15, color: Bby.mutedOnLight, marginBottom: 16 },
  ritualRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emptyCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5 },
  ritualTitle: { fontFamily: BFont.display, fontSize: 16, lineHeight: 20, letterSpacing: -0.2 },
  note: { textAlign: 'center', fontFamily: BFont.sans, fontSize: 13, color: Bby.muted, marginTop: 4 },
});
