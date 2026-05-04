import React from 'react';
import { MONTH_NAMES } from '../../lib/constants';

export function MonthGrid({
  months,
  current,
}: {
  months?: number[];
  current?: number;
}) {
  return (
    <div className="ac-monthgrid">
      {MONTH_NAMES.map((m, i) => {
        const idx = i + 1;
        const on = !months || months.includes(idx);
        const here = current === idx;
        return (
          <div
            key={m}
            className={['ac-monthcell', on ? 'on' : '', here ? 'here' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <span className="ac-monthcell-label">{m}</span>
          </div>
        );
      })}
    </div>
  );
}
