import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CATEGORY_META } from '../lib/categoryMeta';
import { HabitatChip } from './shared/HabitatChip';
import { DonateToggle } from './shared/DonateToggle';
import {
  displayName,
  rowSubtitle,
  itemBells,
  itemMonths,
  itemNotes,
  type AnyItem,
} from '../lib/utils';
import type { CategoryId } from '../lib/types';

export function CollectibleRow({
  item,
  category,
  checked,
  onToggle,
  onClick,
  expanded,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  onToggle: () => void;
  onClick: () => void;
  expanded?: boolean;
}) {
  const { Icon } = CATEGORY_META[category];
  const name = displayName(item, category);
  const subtitle = rowSubtitle(item, category);
  const bells = itemBells(item, category);
  const months = itemMonths(item, category);
  const notes = itemNotes(item);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 border px-4 py-3 transition"
      style={{
        borderColor: checked ? '#b8dfc8' : '#E7DAC4',
        backgroundColor: checked ? '#f2faf6' : '#FFFDF6',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
        borderRadius: expanded ? '14px 14px 0 0' : '14px',
      }}
    >
      <div
        className="shrink-0 rounded-xl p-2"
        style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
        aria-hidden
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="truncate font-medium text-sm"
            style={{ color: '#2A2A2A' }}
          >
            {name}
          </span>
          {category === 'fish' && subtitle && <HabitatChip label={subtitle} />}
        </div>
        <div
          className="text-[12px] mt-0.5 truncate"
          style={{ color: '#5a4a35' }}
        >
          {bells != null
            ? `${bells.toLocaleString()} Bells`
            : category === 'art'
              ? 'Painting'
              : '—'}
          {category !== 'fossils' && category !== 'art' && (
            <span className="ml-2 opacity-60">
              {months && months.length > 0
                ? `${months.length} months`
                : 'Year-round'}
            </span>
          )}
          {category === 'art' && subtitle && (
            <span className="ml-1 opacity-70">
              · {subtitle.length > 38 ? subtitle.slice(0, 38) + '…' : subtitle}
            </span>
          )}
          {notes && <span className="ml-2 italic opacity-70">{notes}</span>}
        </div>
      </div>
      {expanded !== undefined && (
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: '#9c8a6e',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      )}
      <DonateToggle checked={checked} onToggle={onToggle} />
    </button>
  );
}
