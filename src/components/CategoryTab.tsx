import React, { useMemo, useState, useEffect } from 'react';
import type { CategoryId } from '../lib/types';
import {
  type AnyItem,
  displayName,
  itemMonths,
  filterByQuery,
} from '../lib/utils';
import { CollectibleRow } from './CollectibleRow';
import { ItemExpandPanel } from './ItemExpandPanel';
import { SearchBar } from './shared/SearchBar';
import { EmptyState } from './shared/EmptyState';

interface SectionGroup {
  id: 'leaving' | 'avail' | 'locked' | 'done';
  label: string;
  tone: 'warn' | 'accent' | 'muted' | 'done';
  items: AnyItem[];
}

interface CategoryTabProps {
  category: CategoryId;
  items: AnyItem[];
  donated: Record<string, boolean>;
  donatedAt: Record<string, string>;
  hemisphere: 'NH' | 'SH';
  currentMonth: number;
  query: string;
  setQuery: (q: string) => void;
  highlightId: string | null;
  onToggle: (id: string) => void;
  catLabel: string;
}

export function CategoryTab({
  category,
  items,
  donated,
  donatedAt,
  hemisphere,
  currentMonth,
  query,
  setQuery,
  highlightId,
  onToggle,
  catLabel,
}: CategoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset expand when category changes
  useEffect(() => {
    setExpandedId(null);
  }, [category]);

  // Open the expand panel when a highlight arrives (Decision 10).
  useEffect(() => {
    if (!highlightId) return;
    setExpandedId(highlightId);
  }, [highlightId, category]);

  const filtered = useMemo(
    () => filterByQuery(items, category, query),
    [items, category, query]
  );

  const groups = useMemo<SectionGroup[]>(() => {
    const leaving: AnyItem[] = [];
    const avail: AnyItem[] = [];
    const locked: AnyItem[] = [];
    const done: AnyItem[] = [];

    const next = currentMonth === 12 ? 1 : currentMonth + 1;

    for (const it of filtered) {
      if (donated[it.id]) {
        done.push(it);
        continue;
      }
      const months = itemMonths(it, category, hemisphere);
      // Items without month data (fossils, art) are treated as always available.
      const inSeason =
        !months || months.length === 0 || months.includes(currentMonth);
      const isLeaving =
        !!months &&
        months.length > 0 &&
        months.includes(currentMonth) &&
        !months.includes(next);

      if (isLeaving) leaving.push(it);
      else if (inSeason) avail.push(it);
      else locked.push(it);
    }

    const byName = (a: AnyItem, b: AnyItem) =>
      displayName(a, category).localeCompare(displayName(b, category));

    return [
      {
        id: 'leaving',
        label: 'Leaving this month',
        tone: 'warn',
        items: leaving.sort(byName),
      },
      {
        id: 'avail',
        label: 'Available now',
        tone: 'accent',
        items: avail.sort(byName),
      },
      {
        id: 'locked',
        label: 'Out of season',
        tone: 'muted',
        items: locked.sort(byName),
      },
      {
        id: 'done',
        label: 'Already donated',
        tone: 'done',
        items: done.sort(byName),
      },
    ].filter(g => g.items.length > 0) as SectionGroup[];
  }, [filtered, donated, category, hemisphere, currentMonth]);

  const totalDonated = items.filter(i => donated[i.id]).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((totalDonated / total) * 100);
  const showMonthNote = category !== 'art' && category !== 'fossils';
  const monthName = new Date(2000, currentMonth - 1, 1).toLocaleString(
    'en-US',
    {
      month: 'long',
    }
  );

  return (
    <div className="ac-category">
      <header className="ac-category-head">
        <h1 className="ac-category-title">
          <em>{totalDonated}</em> of {total} {catLabel.toLowerCase()}
        </h1>
        <div className="ac-category-meta">
          <strong>{pct}% complete</strong>
          {showMonthNote && <span>Showing availability for {monthName}</span>}
        </div>
      </header>

      <SearchBar
        query={query}
        setQuery={setQuery}
        placeholder={`Search ${catLabel.toLowerCase()}…`}
      />

      {groups.length === 0 ? (
        <EmptyState
          message={
            query
              ? `No ${catLabel.toLowerCase()} match "${query}".`
              : `No ${catLabel.toLowerCase()} found.`
          }
        />
      ) : (
        groups.map(g => (
          <section key={g.id} className={`ac-group ac-group-${g.tone}`}>
            <header className="ac-group-head">
              <h3 className="ac-group-title">{g.label}</h3>
              <span className="ac-group-count">{g.items.length}</span>
            </header>
            <div className="ac-list">
              {g.items.map(item => (
                <React.Fragment key={item.id}>
                  <CollectibleRow
                    item={item}
                    category={category}
                    checked={!!donated[item.id]}
                    onClick={() => {
                      setExpandedId(prev =>
                        prev === item.id ? null : item.id
                      );
                    }}
                    expanded={expandedId === item.id}
                    highlighted={highlightId === item.id}
                    hemisphere={hemisphere}
                    currentMonth={currentMonth}
                  />
                  {expandedId === item.id && (
                    <ItemExpandPanel
                      item={item}
                      category={category}
                      checked={!!donated[item.id]}
                      donatedAt={donatedAt[item.id]}
                      onToggle={() => onToggle(item.id)}
                      hemisphere={hemisphere}
                      currentMonth={currentMonth}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
