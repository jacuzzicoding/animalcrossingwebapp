import React from 'react';
import { Search, X, Clock } from 'lucide-react';
import { SearchHistoryPopover } from './SearchHistoryPopover';

export function GlobalSearchBar({
  query,
  setQuery,
  onSubmit,
  historyOpen,
  setHistoryOpen,
  recentSearches,
  onSelectHistory,
  onClearHistory,
  wrapperRef,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (q: string) => void;
  historyOpen: boolean;
  setHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  recentSearches: string[];
  onSelectHistory: (s: string) => void;
  onClearHistory: () => void;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FDF9F1' }}
      >
        <Search className="w-4 h-4 opacity-50 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) onSubmit(query.trim());
          }}
          placeholder="Search all categories…"
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: '#2A2A2A' }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="opacity-40 hover:opacity-70 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="shrink-0 opacity-50 hover:opacity-80"
          aria-label="Recent searches"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {historyOpen && (
        <SearchHistoryPopover
          searches={recentSearches}
          onSelect={s => {
            onSelectHistory(s);
            setHistoryOpen(false);
          }}
          onClear={onClearHistory}
        />
      )}
    </div>
  );
}
