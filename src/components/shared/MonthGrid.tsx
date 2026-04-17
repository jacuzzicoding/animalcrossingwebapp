import React from 'react';
import { MONTH_NAMES } from '../../lib/constants';

export function MonthGrid({ months }: { months?: number[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTH_NAMES.map((m, i) => {
        const active = !months || months.includes(i + 1);
        return (
          <div
            key={m}
            className="flex items-center justify-center rounded-[6px] py-1.5"
            style={{
              backgroundColor: active ? '#3CA370' : '#EDE3D0',
              opacity: active ? 1 : 0.45,
            }}
          >
            <span
              className="text-[10px] font-semibold"
              style={{ color: active ? '#fff' : '#5a4a35' }}
            >
              {m}
            </span>
          </div>
        );
      })}
    </div>
  );
}
