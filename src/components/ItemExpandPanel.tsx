import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MonthGrid } from './shared/MonthGrid';
import { HabitatChip } from './shared/HabitatChip';
import {
  itemBells,
  itemMonths,
  itemNotes,
  isFish,
  formatTimestamp,
  type AnyItem,
} from '../lib/utils';
import type { CategoryId } from '../lib/types';

export function ItemExpandPanel({
  item,
  category,
  checked,
  donatedAt,
  onToggle,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  donatedAt?: string;
  onToggle: () => void;
}) {
  const bells = itemBells(item, category);
  const months = itemMonths(item, category);
  const notes = itemNotes(item);
  const habitat = isFish(item) ? item.habitat : undefined;

  return (
    <div
      className="mx-2 mb-2 rounded-b-[14px] overflow-hidden"
      style={{
        backgroundColor: checked ? '#f2faf6' : '#FFFDF6',
        border: '1px solid',
        borderTop: 'none',
        borderColor: checked ? '#b8dfc8' : '#E7DAC4',
      }}
    >
      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Bells + Habitat row */}
        <div className="flex items-center gap-3 flex-wrap">
          {bells != null && (
            <div
              className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5"
              style={{
                backgroundColor: '#F5E9D4',
                border: '1px solid #E7DAC4',
              }}
            >
              <span
                className="text-[11px] uppercase tracking-wider opacity-60"
                style={{ color: '#5a4a35' }}
              >
                Value
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: '#2A2A2A' }}
              >
                {bells.toLocaleString()} Bells
              </span>
            </div>
          )}
          {habitat && <HabitatChip label={habitat} />}
        </div>

        {/* Month availability grid */}
        {category !== 'fossils' && (
          <div>
            <div
              className="text-[11px] uppercase tracking-wider opacity-60 mb-2"
              style={{ color: '#5a4a35' }}
            >
              {months && months.length > 0 ? 'Available' : 'Year-round'}
            </div>
            <MonthGrid months={months} />
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div
            className="rounded-[8px] px-3 py-2 italic text-xs"
            style={{
              backgroundColor: '#fff8ee',
              border: '1px solid #E7DAC4',
              color: '#5a4a35',
            }}
          >
            {notes}
          </div>
        )}

        {/* Donation timestamp */}
        {checked && donatedAt && (
          <div className="text-xs" style={{ color: '#2A7A52' }}>
            Donated {formatTimestamp(donatedAt)}
          </div>
        )}

        {/* Donate toggle button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] font-medium text-sm transition"
          style={{
            backgroundColor: checked ? '#EDE3D0' : '#3CA370',
            color: checked ? '#2A2A2A' : '#fff',
            border: '1px solid #E7DAC4',
          }}
        >
          {checked && <CheckCircle2 className="w-4 h-4" />}
          {checked ? 'Remove from Donated' : 'Mark as Donated'}
        </button>
      </div>
    </div>
  );
}
