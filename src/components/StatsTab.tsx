import { useMemo } from 'react';
import { CATEGORY_LABELS, MONTH_NAMES } from '../lib/constants';
import type { CategoryId, GameId } from '../lib/types';
import type { AllData } from '../lib/viewTypes';
import { itemMonths } from '../lib/utils';
import type { AnyItem } from '../lib/utils';

const GAMES_WITH_ART = new Set<GameId>(['ACGCN', 'ACNL', 'ACNH']);
const GAMES_WITH_SEA = new Set<GameId>(['ACNL', 'ACNH']);

function chipVar(cat: CategoryId): string {
  if (cat === 'sea_creatures') return 'var(--chip-sea)';
  return `var(--chip-${cat})`;
}

interface StatsTabProps {
  data: AllData;
  donated: Record<string, boolean>;
  catCounts: Record<CategoryId, number>;
  gameId: GameId;
  hemisphere: 'NH' | 'SH';
}

export function StatsTab({
  data,
  donated,
  catCounts,
  gameId,
  hemisphere,
}: StatsTabProps) {
  const cards = useMemo(() => {
    const list: { cat: CategoryId; donated: number; total: number }[] = [
      { cat: 'fish', donated: catCounts.fish, total: data.fish.length },
      { cat: 'bugs', donated: catCounts.bugs, total: data.bugs.length },
      {
        cat: 'fossils',
        donated: catCounts.fossils,
        total: data.fossils.length,
      },
    ];
    if (GAMES_WITH_ART.has(gameId)) {
      list.push({ cat: 'art', donated: catCounts.art, total: data.art.length });
    }
    if (GAMES_WITH_SEA.has(gameId)) {
      list.push({
        cat: 'sea_creatures',
        donated: catCounts.sea_creatures,
        total: data.sea_creatures.length,
      });
    }
    return list;
  }, [data, catCounts, gameId]);

  const currentMonth = new Date().getMonth() + 1;

  const monthly = useMemo(() => {
    const cats: CategoryId[] = ['fish', 'bugs'];
    if (GAMES_WITH_SEA.has(gameId)) cats.push('sea_creatures');

    const rows = MONTH_NAMES.map((_, i) => {
      const m = i + 1;
      let avail = 0;
      let donatedCount = 0;
      for (const cat of cats) {
        for (const item of data[cat] as AnyItem[]) {
          const months = itemMonths(item, cat, hemisphere);
          if (months && months.includes(m)) {
            avail++;
            if (donated[item.id]) donatedCount++;
          }
        }
      }
      return { m, avail, donatedCount };
    });
    const maxAvail = Math.max(1, ...rows.map(r => r.avail));
    return { rows, maxAvail };
  }, [data, donated, gameId, hemisphere]);

  return (
    <div className="ac-stats">
      <div className="ac-stats-grid" data-card-count={cards.length}>
        {cards.map(({ cat, donated: d, total }) => {
          const pct = total ? Math.round((d / total) * 100) : 0;
          const fillPct = total ? (d / total) * 100 : 0;
          const color = chipVar(cat);
          return (
            <div key={cat} className="ac-statcard">
              <div className="ac-statcard-cat" style={{ color }}>
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="ac-statcard-num">
                <span>{d}</span>
                <span className="ac-statcard-of">/ {total}</span>
              </div>
              <div className="ac-statcard-bar">
                <div
                  className="ac-statcard-fill"
                  style={{ width: `${fillPct}%`, background: color }}
                />
              </div>
              <div className="ac-statcard-pct">{pct}% complete</div>
            </div>
          );
        })}
      </div>

      <section className="ac-chartcard">
        <header className="ac-shelf-head">
          <div>
            <div className="ac-eyebrow">Yearly rhythm</div>
            <h2 className="ac-shelf-title">
              {GAMES_WITH_SEA.has(gameId)
                ? 'Fish, bug & sea availability by month'
                : 'Fish & bug availability by month'}
            </h2>
          </div>
        </header>
        <div className="ac-chart">
          {monthly.rows.map(({ m, avail, donatedCount }, i) => {
            const bgHeight = (avail / monthly.maxAvail) * 100;
            const fillHeight = avail > 0 ? (donatedCount / avail) * 100 : 0;
            return (
              <div
                key={m}
                className={`ac-chart-col${m === currentMonth ? ' is-now' : ''}`}
              >
                <div className="ac-chart-bar">
                  <div
                    className="ac-chart-bar-bg"
                    style={{ height: `${bgHeight}%` }}
                  >
                    <div
                      className="ac-chart-bar-fill"
                      style={{ height: `${fillHeight}%` }}
                    />
                  </div>
                </div>
                <div className="ac-chart-num">{avail}</div>
                <div className="ac-chart-month">
                  {MONTH_NAMES[i].slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="ac-chart-legend">
          <span>
            <span className="ac-chart-legend-dot ac-chart-legend-dot-bg" />
            Available
          </span>
          <span>
            <span className="ac-chart-legend-dot ac-chart-legend-dot-fill" />
            Already donated
          </span>
        </div>
      </section>
    </div>
  );
}
