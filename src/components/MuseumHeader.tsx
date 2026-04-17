import React from 'react';
import { Download } from 'lucide-react';
import { TownSwitcher } from './TownSwitcher';

export function MuseumHeader({
  donatedCount,
  totalCount,
  onCreateTown,
  onExport,
}: {
  donatedCount: number;
  totalCount: number;
  onCreateTown: () => void;
  onExport: () => void;
}) {
  const pct = totalCount ? Math.round((donatedCount / totalCount) * 100) : 0;
  return (
    <div
      className="rounded-[14px] overflow-hidden border"
      style={{ borderColor: '#E7DAC4' }}
    >
      <div
        className="px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
          color: '#F5E9D4',
        }}
      >
        <div className="text-[13px] tracking-wide opacity-90">
          AC GCN Museum
        </div>
        <div className="flex items-end justify-between">
          <h1
            className="text-2xl font-semibold"
            style={{ letterSpacing: '0.2px' }}
          >
            Museum Tracker
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              title="Export CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(245,233,212,0.15)',
                color: '#F5E9D4',
                border: '1px solid rgba(245,233,212,0.3)',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor =
                  'rgba(245,233,212,0.25)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor =
                  'rgba(245,233,212,0.15)')
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <TownSwitcher onCreateNew={onCreateTown} />
          </div>
        </div>
      </div>
      <div className="px-5 py-3" style={{ backgroundColor: '#F5E9D4' }}>
        <div
          className="flex items-center justify-between text-sm mb-1.5"
          style={{ color: '#2A2A2A' }}
        >
          <span>Overall progress</span>
          <span>
            {donatedCount} / {totalCount} · {pct}% complete
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: '#e9dcc3' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: '#3CA370' }}
          />
        </div>
      </div>
    </div>
  );
}
