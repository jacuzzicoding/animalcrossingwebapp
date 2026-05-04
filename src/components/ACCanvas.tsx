import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { CATEGORY_META } from '../lib/categoryMeta';
import { downloadCSV } from '../lib/csvExport';
import { type AnyItem } from '../lib/utils';
import type { CategoryId } from '../lib/types';
import type { AppErrorKind } from '../lib/types';
import type { ViewId } from '../lib/viewTypes';

import HomeTab from './HomeTab';
import ErrorBanner from './ErrorBanner';
import ErrorState from './ErrorState';

import { Sidebar } from './Sidebar';
import { CategoryTab } from './CategoryTab';
import { EmptyState } from './shared/EmptyState';

import { DetailModal } from './modals/DetailModal';

import { GlobalSearchDropdown } from './search/GlobalSearchDropdown';

import { AnalyticsView } from './views/AnalyticsView';
import { ActivityFeed } from './views/ActivityFeed';

import { useMuseumData } from '../hooks/useMuseumData';
import { useCategoryStats } from '../hooks/useCategoryStats';

const VALID_TABS: ViewId[] = [
  'home',
  'fish',
  'bugs',
  'fossils',
  'art',
  'sea_creatures',
  'activity',
  'analytics',
];

function isValidTab(s: string | undefined): s is ViewId {
  return !!s && (VALID_TABS as string[]).includes(s);
}

// Stable empty fallbacks so Zustand selectors don't return new {} references
const EMPTY_DONATED: Record<string, boolean> = {};
const EMPTY_DONATED_AT: Record<string, string> = {};

export default function ACCanvas() {
  const { townId: urlTownId, tab: urlTab } = useParams<{
    townId?: string;
    tab?: string;
  }>();
  const navigate = useNavigate();

  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const setActiveTown = useAppStore(s => s.setActiveTown);
  const activeTownDonated = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED;
    return s.donated[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED;
  });
  const activeTownDonatedAt = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED_AT;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED_AT;
    return s.donatedAt[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED_AT;
  });
  const toggle = useAppStore(s => s.toggle);

  // Sync URL townId → Zustand activeTownId
  useEffect(() => {
    if (urlTownId && urlTownId !== activeTownId) {
      const exists = towns.find(t => t.id === urlTownId);
      if (exists) setActiveTown(urlTownId);
    }
  }, [urlTownId, activeTownId, towns, setActiveTown]);

  const noTowns = towns.length === 0;
  const activeTown = towns.find(t => t.id === activeTownId);

  // Derive activeTab from URL param; default to 'home'
  const activeTab: ViewId = isValidTab(urlTab) ? urlTab : 'home';

  const [query, setQuery] = useState('');
  const [banner, setBanner] = useState<AppErrorKind | null>(null);
  const [selected, setSelected] = useState<{
    item: AnyItem;
    category: CategoryId;
  } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const { data, loading, loadError, reload } = useMuseumData(
    activeTown?.gameId ?? 'ACGCN'
  );

  const catCounts = useCategoryStats(data, activeTownDonated);

  // If the user was on the art tab and switches to a game without art, go home.
  useEffect(() => {
    if (activeTab === 'art' && data.art.length === 0 && !loading) {
      handleTabChange('home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.art.length, loading, activeTab]);

  // If the user was on the sea_creatures tab and switches to a game without sea creatures, go home.
  useEffect(() => {
    if (
      activeTab === 'sea_creatures' &&
      data.sea_creatures.length === 0 &&
      !loading
    ) {
      handleTabChange('home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sea_creatures.length, loading, activeTab]);

  // Reset per-tab search query and selected detail on tab changes
  useEffect(() => {
    setQuery('');
    setSelected(null);
  }, [activeTab]);

  // Scroll-to + highlight on jump (Decision 10).
  // CategoryTab handles expanding the matching row when highlightId changes;
  // here we scroll the row into view and clear after the animation duration so
  // re-jumping to the same id retriggers the pulse.
  useEffect(() => {
    if (!highlightId) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-row-id="${CSS.escape(highlightId)}"]`
      );
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const t = window.setTimeout(() => setHighlightId(null), 1400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [highlightId]);

  const activeCat: CategoryId | null =
    activeTab !== 'home' &&
    activeTab !== 'activity' &&
    activeTab !== 'analytics'
      ? activeTab
      : null;

  const activeItems = useMemo<AnyItem[]>(
    () => (activeCat ? (data[activeCat] as AnyItem[]) : []),
    [activeCat, data]
  );

  function handleSearchJump(category: CategoryId, id: string) {
    setHighlightId(id);
    handleTabChange(category);
  }

  function handleExport() {
    if (!activeTown) return;
    downloadCSV(data, activeTownDonated, activeTownDonatedAt, activeTown.name);
  }

  function handleTabChange(tab: ViewId) {
    const id = activeTownId ?? urlTownId;
    if (!id) return;
    navigate(`/town/${id}/${tab}`);
  }

  if (loadError) {
    return <ErrorState error={loadError} onRetry={reload} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: '#2A2A2A' }}>
            Loading museum data…
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: '#5a4a35', opacity: 0.7 }}
          >
            Preparing your collection
          </div>
        </div>
      </div>
    );
  }

  const catLabel = activeCat ? CATEGORY_META[activeCat].label : '';

  return (
    <div className="ac-app">
      {!noTowns && activeTownId && (
        <Sidebar
          townId={activeTownId}
          data={data}
          catCounts={catCounts}
          onExport={handleExport}
        />
      )}
      <main className="ac-main">
        <div className="space-y-4">
          {banner && (
            <ErrorBanner
              error={banner}
              onDismiss={() => setBanner(null)}
              onRetry={
                banner.type === 'networkError'
                  ? () => {
                      setBanner(null);
                      reload();
                    }
                  : undefined
              }
            />
          )}

          {noTowns ? (
            <EmptyState message="Create a town to start tracking your museum donations." />
          ) : (
            <>
              {activeTab === 'home' ? (
                <>
                  <div className="ac-topbar">
                    <GlobalSearchDropdown
                      data={data}
                      donated={activeTownDonated}
                      gameId={activeTown?.gameId ?? 'ACGCN'}
                      onJump={handleSearchJump}
                    />
                  </div>
                  <HomeTab
                    data={data}
                    donated={activeTownDonated}
                    donatedAt={activeTownDonatedAt}
                    catCounts={catCounts}
                    gameId={activeTown?.gameId ?? 'ACGCN'}
                    hemisphere={activeTown?.hemisphere ?? 'NH'}
                    setHighlightId={setHighlightId}
                  />
                </>
              ) : activeTab === 'analytics' ? (
                <AnalyticsView
                  data={data}
                  catCounts={catCounts}
                  donatedAt={activeTownDonatedAt}
                />
              ) : activeTab === 'activity' ? (
                <ActivityFeed donatedAt={activeTownDonatedAt} data={data} />
              ) : (
                <CategoryTab
                  category={activeCat!}
                  items={activeItems}
                  donated={activeTownDonated}
                  donatedAt={activeTownDonatedAt}
                  hemisphere={activeTown?.hemisphere ?? 'NH'}
                  currentMonth={new Date().getMonth() + 1}
                  query={query}
                  setQuery={setQuery}
                  highlightId={highlightId}
                  onItemSelect={item =>
                    setSelected({ item, category: activeCat! })
                  }
                  onToggle={id => toggle(id)}
                  catLabel={catLabel}
                />
              )}
            </>
          )}

          <div className="text-center pb-2">
            <span
              style={{
                color: '#9c8a6e',
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
              }}
            >
              {import.meta.env.VITE_APP_VERSION}
            </span>
          </div>
        </div>
      </main>

      {selected && !noTowns && (
        <DetailModal
          item={selected.item}
          category={selected.category}
          checked={!!activeTownDonated[selected.item.id]}
          donatedAt={activeTownDonatedAt[selected.item.id]}
          onToggle={() => toggle(selected.item.id)}
          onClose={() => setSelected(null)}
          hemisphere={activeTown?.hemisphere ?? 'NH'}
        />
      )}
    </div>
  );
}
