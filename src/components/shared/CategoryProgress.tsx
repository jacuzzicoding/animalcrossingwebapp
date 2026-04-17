import React from 'react';

export function CategoryProgress({
  donated,
  total,
  label,
}: {
  donated: number;
  total: number;
  label: string;
}) {
  const pct = total ? Math.round((donated / total) * 100) : 0;
  return (
    <div
      className="rounded-[12px] border px-4 py-3"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
    >
      <div
        className="flex items-center justify-between text-sm mb-1.5"
        style={{ color: '#2A2A2A' }}
      >
        <span className="font-medium">{label} Collection</span>
        <span>
          {donated} / {total} donated · {pct}%
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: '#e9dcc3' }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#3CA370' }}
        />
      </div>
    </div>
  );
}
