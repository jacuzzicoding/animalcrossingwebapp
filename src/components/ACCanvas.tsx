import React from 'react';
import { useState, useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { CATEGORY_ORDER } from '../lib/constants';
import { CATEGORY_META } from '../lib/categoryMeta';
import { downloadCSV } from '../lib/csvExport';
import { filterByQuery, globalFilter, type AnyItem } from '../lib/utils';
import type { CategoryId } from '../lib/types';
import type { AppErrorKind } from '../lib/types';
import type { ViewId } from '../lib/viewTypes';

import HomeTab from './HomeTab';
import ErrorBanner from './ErrorBanner';
import ErrorState from './ErrorState';

import { MuseumHeader } from './MuseumHeader';
import { TabBar } from './TabBar';
import { CollectibleRow } from './CollectibleRow';
import { CategoryProgress } from './shared/CategoryProgress';
import { SearchBar } from './shared/SearchBar';
import { EmptyState } from './shared/EmptyState';

import { CreateTownModal } from './modals/CreateTownModal';
import { DetailModal } from './modals/DetailModal';

import { GlobalSearchBar } from './search/GlobalSearchBar';
import { GlobalSearchResults } from './search/GlobalSearchResults';

import { AnalyticsView } from './views/AnalyticsView';
import { ActivityFeed } from './views/ActivityFeed';

import { useMuseumData } from '../hooks/useMuseumData';
import { useSearch } from '../hooks/useSearch';
import { useCategoryStats } from '../hooks/useCategoryStats';

// Stable empty fallbacks so Zustand selectors don't return new {} references
const EMPTY_DONATED: Record<string, boolean> = {};
const EMPTY_DONATED_AT: Record<string, string> = {};

export default function ACCanvas() {
  const [activeTab, setActiveTab] = useState<ViewId>('home');
  const [query, setQuery] = useState('');
  const [banner, setBanner] = useState<AppErrorKind | null>(null);
  const [selected, setSelected] = useState<{
    item: AnyItem;
    category: CategoryId;
  } | null>(null);
  const [showCreateTown, setShowCreateTown] = useState(false);

  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
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

  const noTowns = towns.length === 0;
  const activeTown = towns.find(t => t.id === activeTownId);

  const { data, loading, loadError, reload } = useMuseumData();
  const {
    globalQuery,
    setGlobalQuery,
    recentSearches,
    setRecentSearches,
    historyOpen,
    setHistoryOpen,
    historyRef,
    pushRecentSearch,
  } = useSearch();

  const catCounts = useCategoryStats(data, activeTownDonated);

  const totalItems = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + data[cat].length,
    0
  );
  const totalDonated = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + catCounts[cat],
    0
  );

  const activeCat: CategoryId | null =
    activeTab !== 'home' &&
    activeTab !== 'activity' &&
    activeTab !== 'search' &&
    activeTab !== 'analytics'
      ? activeTab
      : null;

  const activeItems = useMemo(
    () => (activeCat ? (data[activeCat] as AnyItem[]) : []),
    [activeCat, data]
  );

  const filtered = useMemo(() => {
    if (!activeCat) return [];
    return filterByQuery(activeItems, activeCat, query);
  }, [activeItems, activeCat, query]);

  const globalResults = useMemo(() => {
    if (!globalQuery.trim()) return null;
    return globalFilter(data as Record<CategoryId, AnyItem[]>, globalQuery);
  }, [globalQuery, data]);

  function handleExport() {
    if (!activeTown) return;
    downloadCSV(
      data,
      activeTownDonated,
      activeTownDonatedAt,
      activeTown.name,
      activeTown.playerName
    );
  }

  function handleTabChange(cat: ViewId) {
    setActiveTab(cat);
    setQuery('');
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
    <div className="min-h-screen w-full relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #f7f3ea 0%, #efe6d6 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,.15) 1px, transparent 1px), linear-gradient(rgba(0,0,0,.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 space-y-4">
        <MuseumHeader
          donatedCount={totalDonated}
          totalCount={totalItems}
          onCreateTown={() => setShowCreateTown(true)}
          onExport={handleExport}
        />

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
            <TabBar
              active={activeTab}
              onChange={handleTabChange}
              catCounts={catCounts}
              data={data}
            />

            {activeTab === 'home' ? (
              <HomeTab
                data={data}
                donated={activeTownDonated}
                donatedAt={activeTownDonatedAt}
                catCounts={catCounts}
                onNavigate={v => handleTabChange(v)}
              />
            ) : activeTab === 'analytics' ? (
              <AnalyticsView
                data={data}
                catCounts={catCounts}
                donatedAt={activeTownDonatedAt}
              />
            ) : activeTab === 'activity' ? (
              <ActivityFeed donatedAt={activeTownDonatedAt} data={data} />
            ) : activeTab === 'search' ? (
              <>
                <GlobalSearchBar
                  query={globalQuery}
                  setQuery={setGlobalQuery}
                  onSubmit={pushRecentSearch}
                  historyOpen={historyOpen}
                  setHistoryOpen={setHistoryOpen}
                  recentSearches={recentSearches}
                  onSelectHistory={s => {
                    setGlobalQuery(s);
                    pushRecentSearch(s);
                  }}
                  onClearHistory={() => {
                    setRecentSearches([]);
                    setHistoryOpen(false);
                  }}
                  wrapperRef={historyRef}
                />
                <GlobalSearchResults
                  results={globalResults}
                  query={globalQuery}
                  donated={activeTownDonated}
                  onToggle={id => toggle(id)}
                  onSelect={(item, category) => {
                    if (globalQuery.trim())
                      pushRecentSearch(globalQuery.trim());
                    setSelected({ item, category });
                  }}
                />
              </>
            ) : (
              <>
                <CategoryProgress
                  donated={catCounts[activeCat!]}
                  total={activeItems.length}
                  label={catLabel}
                />
                <SearchBar
                  query={query}
                  setQuery={setQuery}
                  placeholder={`Search ${catLabel.toLowerCase()}…`}
                />
                <div className="space-y-3">
                  {filtered.map(item => (
                    <CollectibleRow
                      key={item.id}
                      item={item}
                      category={activeCat!}
                      checked={!!activeTownDonated[item.id]}
                      onToggle={() => toggle(item.id)}
                      onClick={() =>
                        setSelected({ item, category: activeCat! })
                      }
                    />
                  ))}
                  {filtered.length === 0 && (
                    <EmptyState
                      message={
                        query
                          ? `No ${catLabel.toLowerCase()} match "${query}".`
                          : `No ${catLabel.toLowerCase()} found.`
                      }
                    />
                  )}
                </div>
              </>
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

      {(noTowns || showCreateTown) && (
        <CreateTownModal
          required={noTowns}
          onClose={() => setShowCreateTown(false)}
        />
      )}

      {selected && !noTowns && (
        <DetailModal
          item={selected.item}
          category={selected.category}
          checked={!!activeTownDonated[selected.item.id]}
          donatedAt={activeTownDonatedAt[selected.item.id]}
          onToggle={() => toggle(selected.item.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
