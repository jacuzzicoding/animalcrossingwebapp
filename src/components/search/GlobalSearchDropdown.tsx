import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CategoryId, GameId } from '../../lib/types';
import type { AllData } from '../../lib/viewTypes';
import {
  type AnyItem,
  isFish,
  isFossil,
  isArtPiece,
  isSeaCreature,
} from '../../lib/utils';

const SEARCH_HISTORY_KEY = 'ac-curator-search-history';
const MAX_HISTORY = 8;
const PER_GROUP_LIMIT = 5;
const SEA_GAMES = new Set<GameId>(['ACNL', 'ACNH']);

const GROUP_LABEL: Record<CategoryId, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  fossils: 'Fossils',
  art: 'Art',
  sea_creatures: 'Sea',
};

const CHIP_VAR: Record<CategoryId, string> = {
  fish: 'var(--chip-fish)',
  bugs: 'var(--chip-bugs)',
  fossils: 'var(--chip-fossils)',
  art: 'var(--chip-art)',
  sea_creatures: 'var(--chip-sea)',
};

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(s => typeof s === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveHistory(arr: string[]) {
  try {
    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(arr.slice(0, MAX_HISTORY))
    );
  } catch {
    /* ignore */
  }
}

function monogram(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();
}

function metaFor(item: AnyItem, category: CategoryId): string {
  if (category === 'fish' && isFish(item)) {
    const bells =
      item.value != null ? ` · ${item.value.toLocaleString()} ✦` : '';
    return `${item.habitat}${bells}`;
  }
  if (category === 'bugs') {
    const it = item as AnyItem & { location?: string; value?: number };
    const bells = it.value != null ? ` · ${it.value.toLocaleString()} ✦` : '';
    return `${it.location ?? '—'}${bells}`;
  }
  if (category === 'fossils' && isFossil(item)) {
    const bells =
      item.value != null ? ` · ${item.value.toLocaleString()} ✦` : '';
    return `${item.part ?? 'Fossil'}${bells}`;
  }
  if (category === 'art' && isArtPiece(item)) {
    return item.basedOn ?? '—';
  }
  if (category === 'sea_creatures' && isSeaCreature(item)) {
    const shadow = item.shadow ?? '';
    const bells =
      item.value != null ? ` · ${item.value.toLocaleString()} ✦` : '';
    return `${shadow}${bells}`.replace(/^ · /, '');
  }
  return '—';
}

interface GlobalSearchDropdownProps {
  data: AllData;
  donated: Record<string, boolean>;
  gameId: GameId;
  onJump: (category: CategoryId, id: string) => void;
}

export function GlobalSearchDropdown({
  data,
  donated,
  gameId,
  onJump,
}: GlobalSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleCategories = useMemo<CategoryId[]>(() => {
    const cats: CategoryId[] = ['fish', 'bugs', 'fossils'];
    if (data.art.length > 0) cats.push('art');
    if (SEA_GAMES.has(gameId) && data.sea_creatures.length > 0) {
      cats.push('sea_creatures');
    }
    return cats;
  }, [data.art.length, data.sea_creatures.length, gameId]);

  const grouped = useMemo<Record<CategoryId, AnyItem[]> | null>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out = {
      fish: [] as AnyItem[],
      bugs: [] as AnyItem[],
      fossils: [] as AnyItem[],
      art: [] as AnyItem[],
      sea_creatures: [] as AnyItem[],
    };
    for (const cat of visibleCategories) {
      const items = data[cat] as AnyItem[];
      out[cat] = items
        .filter(it => {
          if (it.name.toLowerCase().includes(q)) return true;
          if (cat === 'art' && isArtPiece(it)) {
            return (it.basedOn ?? '').toLowerCase().includes(q);
          }
          return false;
        })
        .slice(0, PER_GROUP_LIMIT);
    }
    return out;
  }, [query, data, visibleCategories]);

  const flatList = useMemo<{ category: CategoryId; item: AnyItem }[]>(() => {
    if (!grouped) return [];
    const out: { category: CategoryId; item: AnyItem }[] = [];
    for (const cat of visibleCategories) {
      for (const item of grouped[cat]) out.push({ category: cat, item });
    }
    return out;
  }, [grouped, visibleCategories]);

  useEffect(() => setActiveIdx(0), [query]);

  // Click outside to close
  useEffect(() => {
    if (!focused) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [focused]);

  function commitSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter(h => h !== t)].slice(0, MAX_HISTORY);
    setHistory(next);
    saveHistory(next);
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  function selectIndex(idx: number) {
    const entry = flatList[idx];
    if (!entry) return;
    commitSearch(entry.item.name);
    onJump(entry.category, entry.item.id);
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      if (flatList.length === 0) return;
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      if (flatList.length === 0) return;
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (flatList.length > 0) {
        e.preventDefault();
        selectIndex(activeIdx);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  const showPanel = focused;
  const trimmed = query.trim();
  let runningIdx = -1;

  return (
    <div className="ac-search-wrap" ref={wrapRef}>
      <div className="ac-search">
        <svg
          className="ac-search-icon"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search across categories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          aria-label="Search across categories"
        />
      </div>

      {showPanel && (
        <div className="ac-gs-panel" role="listbox">
          {!trimmed && history.length === 0 && (
            <div className="ac-gs-empty">
              <div className="ac-gs-empty-title">Search across categories</div>
              <div className="ac-gs-empty-sub">
                Type a name to find fish, bugs, fossils, art, or sea creatures
                at once.
              </div>
              <div className="ac-gs-hint">
                <kbd>↑↓</kbd> navigate <kbd>↵</kbd> open <kbd>esc</kbd> close
              </div>
            </div>
          )}

          {!trimmed && history.length > 0 && (
            <>
              <div className="ac-gs-section-head">
                <span className="ac-gs-eyebrow">Recent searches</span>
                <button
                  className="ac-gs-clear"
                  onClick={clearHistory}
                  type="button"
                >
                  Clear
                </button>
              </div>
              <div className="ac-gs-history">
                {history.map((h, i) => (
                  <button
                    key={`${h}-${i}`}
                    className="ac-gs-history-row"
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setQuery(h);
                      inputRef.current?.focus();
                    }}
                  >
                    <span className="ac-gs-history-icon">↻</span>
                    <span>{h}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {trimmed && grouped && flatList.length === 0 && (
            <div className="ac-gs-empty">
              <div className="ac-gs-empty-title">
                No matches for "<em>{query}</em>"
              </div>
              <div className="ac-gs-empty-sub">
                Try a shorter term or check the spelling.
              </div>
            </div>
          )}

          {trimmed && grouped && flatList.length > 0 && (
            <>
              {visibleCategories.map(cat => {
                const items = grouped[cat];
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="ac-gs-group">
                    <div className="ac-gs-group-head">
                      <span
                        className="ac-gs-group-dot"
                        style={{ background: CHIP_VAR[cat] }}
                      />
                      <span
                        className="ac-gs-eyebrow"
                        style={{ color: CHIP_VAR[cat] }}
                      >
                        {GROUP_LABEL[cat]}
                      </span>
                      <span className="ac-gs-group-count">{items.length}</span>
                    </div>
                    {items.map(it => {
                      runningIdx++;
                      const isActive = runningIdx === activeIdx;
                      const isDonated = !!donated[it.id];
                      const idx = runningIdx;
                      return (
                        <button
                          key={`${cat}-${it.id}`}
                          type="button"
                          className={`ac-gs-row ${
                            isActive ? 'ac-gs-row-active' : ''
                          }`}
                          onMouseDown={e => e.preventDefault()}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => selectIndex(idx)}
                        >
                          <div
                            className="ac-gs-row-glyph"
                            style={{
                              borderColor: CHIP_VAR[cat],
                              color: CHIP_VAR[cat],
                            }}
                          >
                            {monogram(it.name)}
                          </div>
                          <div className="ac-gs-row-text">
                            <div className="ac-gs-row-name">
                              <span>{it.name}</span>
                              {isDonated && (
                                <span className="ac-gs-row-donated">
                                  donated
                                </span>
                              )}
                            </div>
                            <div className="ac-gs-row-meta">
                              {metaFor(it, cat)}
                            </div>
                          </div>
                          <span className="ac-gs-row-arrow">↵</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <div className="ac-gs-foot">
                <span>
                  <kbd>↑↓</kbd> navigate
                </span>
                <span>
                  <kbd>↵</kbd> open
                </span>
                <span>
                  <kbd>esc</kbd> close
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
