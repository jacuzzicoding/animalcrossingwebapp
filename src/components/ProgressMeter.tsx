import type { CategoryId, GameId } from '../lib/types';
import { segmentsForGame } from './progressMeterUtils';

const SEGMENT_LABEL: Record<CategoryId, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  fossils: 'Fossils',
  art: 'Art',
  sea_creatures: 'Sea',
};

const SEGMENT_VAR: Record<CategoryId, string> = {
  fish: 'var(--chip-fish)',
  bugs: 'var(--chip-bugs)',
  fossils: 'var(--chip-fossils)',
  art: 'var(--chip-art)',
  sea_creatures: 'var(--chip-sea)',
};

export interface ProgressMeterProps {
  gameId: GameId;
  donated: Partial<Record<CategoryId, number>>;
  totals: Partial<Record<CategoryId, number>>;
}

export function ProgressMeter({ gameId, donated, totals }: ProgressMeterProps) {
  const segments = segmentsForGame(gameId, totals);
  const isFive = segments.length === 5;

  return (
    <div
      className={`ac-meter${isFive ? ' ac-meter-5' : ''}`}
      role="group"
      aria-label="Donation progress by category"
    >
      {segments.map(cat => {
        const total = totals[cat] ?? 0;
        const done = donated[cat] ?? 0;
        const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
        const color = SEGMENT_VAR[cat];
        const label = SEGMENT_LABEL[cat];
        return (
          <div
            key={cat}
            className="ac-meter-seg"
            aria-label={`${label}: ${done} of ${total} donated`}
          >
            <div className="ac-meter-seg-head">
              <span
                className="ac-meter-dot"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="ac-meter-name">{label}</span>
              <span className="ac-meter-frac">
                {done}
                <span className="ac-meter-slash">/</span>
                {total}
              </span>
            </div>
            <div className="ac-meter-track">
              <div
                className="ac-meter-fill"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
