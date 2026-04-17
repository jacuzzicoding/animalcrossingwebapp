import React from 'react';
import { CATEGORY_META } from '../../lib/categoryMeta';
import { CATEGORY_ORDER } from '../../lib/constants';
import { CollectibleRow } from '../CollectibleRow';
import { EmptyState } from '../shared/EmptyState';
import type { CategoryId } from '../../lib/types';
import type { AnyItem } from '../../lib/utils';

export function GlobalSearchResults({
  results,
  query,
  donated,
  onToggle,
  onSelect,
}: {
  results: Record<CategoryId, AnyItem[]> | null;
  query: string;
  donated: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (item: AnyItem, category: CategoryId) => void;
}) {
  if (!results) {
    return (
      <EmptyState message="Type above to search fish, bugs, fossils, and art at once." />
    );
  }

  const hasAny = CATEGORY_ORDER.some(cat => results[cat].length > 0);

  if (!hasAny) {
    return <EmptyState message={`No items match "${query}".`} />;
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map(cat => {
        const items = results[cat];
        if (items.length === 0) return null;
        const { label, Icon } = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Icon className="w-3.5 h-3.5" style={{ color: '#7B5E3B' }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#7B5E3B' }}
              >
                {label}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#EDE3D0', color: '#5a4a35' }}
              >
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <CollectibleRow
                  key={item.id}
                  item={item}
                  category={cat}
                  checked={!!donated[item.id]}
                  onToggle={() => onToggle(item.id)}
                  onClick={() => onSelect(item, cat)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
