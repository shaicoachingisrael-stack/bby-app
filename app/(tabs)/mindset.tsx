import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BbyScreen, BigTitle, PillTabs, TopBar } from '@/components/bby/kit';
import { type MindsetFilter, useFilterItems } from '@/components/bby/mindset/ui';
import { AllView, JournalView, LibrarySection, ParcoursView, RitualsView } from '@/components/bby/mindset/views';
import { useAuth } from '@/lib/auth-provider';
import { useJournal } from '@/lib/mindset/use-journal';
import { useMyRituals } from '@/lib/mindset/use-my-rituals';
import { useParcoursList } from '@/lib/mindset/use-parcours';
import { useMindsetContent } from '@/lib/use-content';
import { useDailyAffirmation } from '@/lib/use-daily-affirmation';
import { useProfile } from '@/lib/use-profile';

const FILTERS: MindsetFilter[] = ['all', 'parcours', 'journal', 'rituals'];
const TAB_ALIASES: Record<string, MindsetFilter> = {
  tous: 'all', all: 'all', parcours: 'parcours', journal: 'journal', rituels: 'rituals', rituals: 'rituals',
};
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Mindset (spécifications de Shaï, nov. 2026) : une seule page, quatre vues en
// puces — Tous (1A), Parcours (1B), Journal (6/9), Rituels (10/14). Rien n'y est
// mesuré pour être jugé : la seule progression visible est un compteur « X / Y ».
export default function MindsetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const params = useLocalSearchParams<{ filter?: string; tab?: string }>();
  const [filter, setFilter] = useState<MindsetFilter>('all');
  const items = useFilterItems();

  // Les sous-écrans ramènent ici avec ?filter=… (puces du haut). Le paramètre suit
  // toujours la puce affichée, pour qu'un retour vers n'importe quelle puce la change.
  const choose = useCallback(
    (k: MindsetFilter) => {
      setFilter(k);
      router.setParams({ filter: k, tab: undefined } as any);
    },
    [router],
  );
  useEffect(() => {
    if (params.filter && FILTERS.includes(params.filter as MindsetFilter)) setFilter(params.filter as MindsetFilter);
  }, [params.filter]);

  // Depuis Aujourd'hui : /mindset?tab=tous|parcours|journal|rituels (noms anglais acceptés aussi).
  useEffect(() => {
    const f = params.tab ? TAB_ALIASES[params.tab] : undefined;
    if (f) choose(f);
  }, [params.tab, choose]);

  const { affirmation, refresh: refreshAffirmation } = useDailyAffirmation();
  const parcours = useParcoursList();
  const journal = useJournal();
  const rituals = useMyRituals();
  const library = useMindsetContent();

  const { refresh: rp } = parcours;
  const { refresh: rj } = journal;
  const { refresh: rr } = rituals;
  const { refresh: rl } = library;
  useFocusEffect(
    useCallback(() => {
      refreshAffirmation();
      rp();
      rj();
      rr();
      rl();
    }, [refreshAffirmation, rp, rj, rr, rl]),
  );

  const parcoursTags = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of parcours.active) {
      m[a.program.id] = t('v2mindset.rituals.parcoursTag', { n: a.day, total: a.program.day_count });
    }
    return m;
  }, [parcours.active, t]);

  const firstName = profile ? cap((profile.display_name || user?.email?.split('@')[0] || '').split(' ')[0]) : '';
  const suggestion = parcours.programs.find((p) => p.slug === 'installer-une-habitude') ?? parcours.toDiscover[0] ?? null;

  return (
    <BbyScreen>
      <TopBar name={firstName} onSettings={() => router.push('/account' as any)} />
      <BigTitle>{t('v2mindset.tab.title')}</BigTitle>
      <PillTabs items={items} value={filter} onChange={choose} />

      {filter === 'all' ? (
        <AllView
          affirmation={affirmation}
          active={parcours.active[0] ?? null}
          todayPage={journal.todayPage}
          ritualsDone={rituals.done}
          ritualsTotal={rituals.total}
          nextRitual={rituals.next?.label ?? null}
          onFilter={choose}
        />
      ) : null}
      {filter === 'all' ? (
        <LibrarySection items={library.items} />
      ) : null}
      {filter === 'parcours' && !parcours.loading ? <ParcoursView
          active={parcours.active}
          toDiscover={parcours.toDiscover}
          finished={Object.fromEntries(Object.entries(parcours.progress).map(([id, pr]) => [id, !!pr?.completed_at]))}
        /> : null}
      {filter === 'journal' && !journal.loading ? (
        <JournalView entries={journal.entries} dayInfo={journal.dayInfo} todayPage={journal.todayPage} />
      ) : null}
      {filter === 'rituals' && !rituals.loading && !parcours.loading ? (
        <RitualsView
          rituals={rituals.rituals}
          checked={rituals.checked}
          onToggle={rituals.toggle}
          parcoursTags={parcoursTags}
          suggestion={suggestion}
        />
      ) : null}
    </BbyScreen>
  );
}
