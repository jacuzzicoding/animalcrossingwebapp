import React, { useRef, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { CATEGORY_META } from '../../lib/categoryMeta';
import { MonthGrid } from '../shared/MonthGrid';
import {
  displayName,
  rowSubtitle,
  itemBells,
  itemMonths,
  itemNotes,
  formatTimestamp,
  type AnyItem,
} from '../../lib/utils';
import type { CategoryId } from '../../lib/types';

export function DetailModal({
  item,
  category,
  checked,
  donatedAt,
  onToggle,
  onClose,
  hemisphere,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  donatedAt?: string;
  onToggle: () => void;
  onClose: () => void;
  hemisphere?: 'NH' | 'SH';
}) {
  const { Icon, label } = CATEGORY_META[category];
  const name = displayName(item, category);
  const subtitle = rowSubtitle(item, category);
  const bells = itemBells(item, category);
  const months = itemMonths(item, category, hemisphere);
  const notes = itemNotes(item);

  // Guard against ghost-clicks: the same click that opens the modal can land on
  // the newly-mounted backdrop before the browser event loop settles. Defer
  // closeability by one tick so backdrop clicks only register on subsequent taps.
  const closeable = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => {
      closeable.current = true;
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={() => {
        if (closeable.current) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl rounded-t-[20px] overflow-hidden"
        style={{
          backgroundColor: '#FDF9F1',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: '#D9CCBA' }}
          />
        </div>
        <div className="flex justify-end px-4 pt-1 pb-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: '#EDE3D0' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: '#5a4a35' }} />
          </button>
        </div>
        <div className="px-6 pb-8 space-y-5">
          <div className="flex items-start gap-4">
            <div
              className="rounded-2xl p-3.5 shrink-0"
              style={{
                backgroundColor: '#EDE3D0',
                border: '1px solid #E7DAC4',
              }}
            >
              <Icon className="w-7 h-7" />
            </div>
            <div className="pt-1">
              <div
                className="text-[11px] uppercase tracking-wider opacity-60 mb-0.5"
                style={{ color: '#5a4a35' }}
              >
                {label}
              </div>
              <h2
                className="text-xl font-semibold leading-snug"
                style={{ color: '#2A2A2A' }}
              >
                {name}
              </h2>
              {subtitle && (
                <p className="text-sm mt-1" style={{ color: '#5a4a35' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {bells != null && (
            <div
              className="rounded-[12px] px-4 py-3"
              style={{
                backgroundColor: '#F5E9D4',
                border: '1px solid #E7DAC4',
              }}
            >
              <div
                className="text-[11px] uppercase tracking-wider opacity-60 mb-0.5"
                style={{ color: '#5a4a35' }}
              >
                Value
              </div>
              <div
                className="font-semibold text-base"
                style={{ color: '#2A2A2A' }}
              >
                {bells.toLocaleString()} Bells
              </div>
            </div>
          )}

          {category !== 'fossils' && category !== 'art' && (
            <div>
              <div
                className="text-[11px] uppercase tracking-wider opacity-60 mb-2"
                style={{ color: '#5a4a35' }}
              >
                Availability
              </div>
              <MonthGrid months={months} />
              {(!months || months.length === 0) && (
                <p
                  className="text-xs mt-1.5 opacity-60"
                  style={{ color: '#5a4a35' }}
                >
                  Active all year
                </p>
              )}
            </div>
          )}

          {notes && (
            <div
              className="rounded-[12px] px-4 py-3 italic text-sm"
              style={{
                backgroundColor: '#fff8ee',
                border: '1px solid #E7DAC4',
                color: '#5a4a35',
              }}
            >
              {notes}
            </div>
          )}

          {checked && donatedAt && (
            <div
              className="rounded-[12px] px-4 py-3"
              style={{
                backgroundColor: '#f2faf6',
                border: '1px solid #b8dfc8',
              }}
            >
              <div
                className="text-[11px] uppercase tracking-wider opacity-60 mb-0.5"
                style={{ color: '#2A7A52' }}
              >
                Donated
              </div>
              <div className="text-sm font-medium" style={{ color: '#2A7A52' }}>
                {formatTimestamp(donatedAt)}
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] font-medium text-sm transition"
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
    </div>
  );
}
