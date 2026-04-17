import React from 'react';
import { Clock } from 'lucide-react';

export function SearchHistoryPopover({
  searches,
  onSelect,
  onClear,
}: {
  searches: string[];
  onSelect: (s: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-[14px] overflow-hidden shadow-lg"
      style={{ backgroundColor: '#FDF9F1', border: '1px solid #E7DAC4' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid #E7DAC4' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#5a4a35' }}
        >
          Recent Searches
        </span>
        <button
          onClick={onClear}
          className="text-xs font-medium"
          style={{ color: '#3CA370' }}
        >
          Clear
        </button>
      </div>
      {searches.length === 0 ? (
        <div
          className="px-4 py-3 text-sm"
          style={{ color: '#5a4a35', opacity: 0.6 }}
        >
          No recent searches.
        </div>
      ) : (
        searches.map(s => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition"
            style={{ color: '#2A2A2A', borderTop: '1px solid #E7DAC4' }}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 opacity-50" />
            {s}
          </button>
        ))
      )}
    </div>
  );
}
