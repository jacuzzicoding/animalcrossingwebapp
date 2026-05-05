import { useMemo } from 'react';
import type {
  Fish as FishType,
  BugItem,
  FossilItem,
  ArtPiece,
  SeaCreature,
  CategoryId,
  GameId,
} from '../lib/types';
import {
  displayName,
  formatRelativeDate,
  itemMonths,
  type AnyItem,
} from '../lib/utils';
import { ProgressMeter } from './ProgressMeter';
import { useJumpToRow } from '../hooks/useJumpToRow';
import { ItemIcon } from './ItemIcon';
import { useIconChecker } from './itemIconUtils';

const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const CAT_LABEL: Record<CategoryId, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  fossils: 'Fossils',
  art: 'Art',
  sea_creatures: 'Sea',
};

const CAT_VAR: Record<CategoryId, string> = {
  fish: 'var(--chip-fish)',
  bugs: 'var(--chip-bugs)',
  fossils: 'var(--chip-fossils)',
  art: 'var(--chip-art)',
  sea_creatures: 'var(--chip-sea)',
};

export interface HomeTabProps {
  data: {
    fish: FishType[];
    bugs: BugItem[];
    fossils: FossilItem[];
    art: ArtPiece[];
    sea_creatures: SeaCreature[];
  };
  donated: Record<string, boolean>;
  donatedAt: Record<string, string>;
  catCounts: Record<CategoryId, number>;
  gameId: GameId;
  hemisphere: 'NH' | 'SH';
  setHighlightId: (id: string | null) => void;
}

interface ShelfItem {
  id: string;
  name: string;
  category: CategoryId;
  months: number[];
  bells: number | null;
}

function monogram(name: string): string {
  const parts = name.replace(/[—–-]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function HomeTab({
  data,
  donated,
  donatedAt,
  catCounts,
  gameId,
  hemisphere,
  setHighlightId,
}: HomeTabProps) {
  const jumpTo = useJumpToRow(setHighlightId);
  const hasIcon = useIconChecker();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const monthName = MONTH_FULL[currentMonth - 1];

  const seasonalCats: CategoryId[] = useMemo(() => {
    const cats: CategoryId[] = ['fish', 'bugs'];
    if (
      (gameId === 'ACNL' || gameId === 'ACNH') &&
      data.sea_creatures.length > 0
    ) {
      cats.push('sea_creatures');
    }
    return cats;
  }, [gameId, data.sea_creatures.length]);

  const { leavingSoon, justArrived, stillNeeded } = useMemo(() => {
    const avail: ShelfItem[] = [];
    const leaving: ShelfItem[] = [];
    const arrived: ShelfItem[] = [];

    for (const cat of seasonalCats) {
      const items = (data[cat] as AnyItem[]) ?? [];
      for (const item of items) {
        const months = itemMonths(item, cat, hemisphere);
        if (!months || !months.includes(currentMonth)) continue;
        const isDonated = !!donated[item.id];
        const entry: ShelfItem = {
          id: item.id,
          name: displayName(item, cat),
          category: cat,
          months,
          bells:
            'value' in item
              ? ((item as FishType | BugItem | SeaCreature).value ?? null)
              : null,
        };
        avail.push(entry);
        if (isDonated) continue;
        if (!months.includes(nextMonth)) leaving.push(entry);
        else if (!months.includes(lastMonth)) arrived.push(entry);
      }
    }

    const stillNeededCount = avail.filter(a => !donated[a.id]).length;

    const sortByName = (a: ShelfItem, b: ShelfItem) =>
      a.name.localeCompare(b.name);
    leaving.sort(sortByName);
    arrived.sort(sortByName);

    void avail;
    return {
      leavingSoon: leaving,
      justArrived: arrived,
      stillNeeded: stillNeededCount,
    };
  }, [
    data,
    seasonalCats,
    currentMonth,
    nextMonth,
    lastMonth,
    donated,
    hemisphere,
  ]);

  const totals: Record<CategoryId, number> = {
    fish: data.fish.length,
    bugs: data.bugs.length,
    fossils: data.fossils.length,
    art: data.art.length,
    sea_creatures: data.sea_creatures.length,
  };

  const heroCats: CategoryId[] = useMemo(() => {
    const cats: CategoryId[] = ['fish', 'bugs', 'fossils'];
    if (totals.art > 0) cats.push('art');
    if ((gameId === 'ACNL' || gameId === 'ACNH') && totals.sea_creatures > 0) {
      cats.push('sea_creatures');
    }
    return cats;
  }, [gameId, totals.art, totals.sea_creatures]);

  const heroDonated = heroCats.reduce((sum, c) => sum + catCounts[c], 0);
  const heroTotal = heroCats.reduce((sum, c) => sum + totals[c], 0);

  const recent = useMemo(() => {
    const nameMap: Record<string, { name: string; category: CategoryId }> = {};
    (
      ['fish', 'bugs', 'fossils', 'art', 'sea_creatures'] as CategoryId[]
    ).forEach(cat => {
      for (const item of data[cat]) {
        nameMap[item.id] = {
          name: displayName(item as AnyItem, cat),
          category: cat,
        };
      }
    });
    return Object.entries(donatedAt)
      .map(([id, ts]) => ({ id, ts, ...nameMap[id] }))
      .filter(e => e.name)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 6);
  }, [donatedAt, data]);

  const showSeasonalUI = seasonalCats.length > 0;

  return (
    <div className="ac-home">
      {/* Hero */}
      <section className="ac-hero">
        <div className="ac-eyebrow ac-eyebrow-accent">
          {showSeasonalUI ? `Available in ${monthName}` : `Your museum`}
        </div>
        {showSeasonalUI ? (
          <h1 className="ac-hero-headline">
            <em>{stillNeeded}</em>{' '}
            {stillNeeded === 1 ? 'creature' : 'creatures'} still to donate this
            month.
            {leavingSoon.length > 0 && (
              <span className="ac-hero-aside">
                {leavingSoon.length} leaving soon.
              </span>
            )}
          </h1>
        ) : (
          <h1 className="ac-hero-headline">
            <em>{heroDonated}</em> of {heroTotal} donated.
          </h1>
        )}
        <ProgressMeter gameId={gameId} donated={catCounts} totals={totals} />
      </section>

      {/* Month strip */}
      {showSeasonalUI && (
        <div
          className="ac-month-strip"
          aria-label="Months of the year, current month highlighted"
        >
          {MONTH_SHORT.map((m, i) => (
            <div
              key={m}
              className={`ac-month-cell${i + 1 === currentMonth ? ' ac-month-cell-current' : ''}`}
            >
              {m}
            </div>
          ))}
        </div>
      )}

      {/* Leaving soon shelf */}
      {leavingSoon.length > 0 && (
        <section>
          <div className="ac-shelf-head">
            <div>
              <div className="ac-eyebrow ac-eyebrow-warn">
                Leaving end of {monthName}
              </div>
              <h2 className="ac-shelf-title">Catch them while you can</h2>
            </div>
            <span className="ac-shelf-count">{leavingSoon.length}</span>
          </div>
          <ShelfGrid
            items={leavingSoon}
            currentMonth={currentMonth}
            warn
            onPick={(cat, id) => jumpTo(cat, id)}
            gameId={gameId}
          />
        </section>
      )}

      {/* Just arrived shelf */}
      {justArrived.length > 0 && (
        <section>
          <div className="ac-shelf-head">
            <div>
              <div className="ac-eyebrow ac-eyebrow-accent">New this month</div>
              <h2 className="ac-shelf-title">Just arrived</h2>
            </div>
            <span className="ac-shelf-count">{justArrived.length}</span>
          </div>
          <ShelfGrid
            items={justArrived}
            currentMonth={currentMonth}
            onPick={(cat, id) => jumpTo(cat, id)}
            gameId={gameId}
          />
        </section>
      )}

      {/* Latest donations */}
      <section>
        <div className="ac-shelf-head">
          <div>
            <div className="ac-eyebrow">Latest donations</div>
            <h2 className="ac-shelf-title">Recent activity</h2>
          </div>
        </div>
        <div className="ac-recent-card">
          {recent.length === 0 ? (
            <div className="ac-recent-empty">No donations yet.</div>
          ) : (
            recent.map(r => (
              <button
                key={r.id}
                className="ac-recent-row"
                onClick={() => jumpTo(r.category, r.id)}
              >
                {hasIcon(r.category, r.id) ? (
                  <ItemIcon
                    gameId={gameId}
                    category={r.category}
                    id={r.id}
                    size={24}
                    className="ac-recent-icon"
                    alt=""
                  />
                ) : (
                  <span
                    className="ac-recent-cat-dot"
                    style={{ backgroundColor: CAT_VAR[r.category] }}
                    aria-hidden="true"
                  />
                )}
                <span className="ac-recent-name">{r.name}</span>
                <span className="ac-recent-cat">{CAT_LABEL[r.category]}</span>
                <span className="ac-recent-time">
                  {formatRelativeDate(r.ts)}
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ShelfGrid({
  items,
  currentMonth,
  warn,
  onPick,
  gameId,
}: {
  items: ShelfItem[];
  currentMonth: number;
  warn?: boolean;
  onPick: (category: CategoryId, id: string) => void;
  gameId: GameId;
}) {
  const hasIcon = useIconChecker();
  return (
    <div className="ac-shelf-grid">
      {items.slice(0, 6).map(item => {
        const tint = CAT_VAR[item.category];
        return (
          <button
            key={`${item.category}-${item.id}`}
            className="ac-shelf-card"
            onClick={() => onPick(item.category, item.id)}
          >
            {hasIcon(item.category, item.id) ? (
              <ItemIcon
                gameId={gameId}
                category={item.category}
                id={item.id}
                size={24}
                className="ac-shelf-icon"
                alt=""
              />
            ) : (
              <span
                className="ac-shelf-glyph"
                style={{ borderColor: tint, color: tint }}
                aria-hidden="true"
              >
                {monogram(item.name)}
              </span>
            )}
            <span className="ac-shelf-card-body">
              <span className="ac-shelf-card-name">{item.name}</span>
              <span className="ac-shelf-card-meta">
                {item.bells != null
                  ? `${item.bells.toLocaleString()} ✦`
                  : CAT_LABEL[item.category]}
              </span>
              <span className="ac-month-dots" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <span
                    key={m}
                    className={`ac-month-dot${item.months.includes(m) ? ' ac-month-dot-on' : ''}`}
                  />
                ))}
              </span>
              {warn && (
                <span className="ac-shelf-card-warn">
                  ⚠ Last month: {MONTH_SHORT[currentMonth - 1]}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
