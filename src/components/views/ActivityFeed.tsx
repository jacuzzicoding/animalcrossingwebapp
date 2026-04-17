import React, { useMemo } from 'react';
import { CATEGORY_META } from '../../lib/categoryMeta';
import { CATEGORY_ORDER } from '../../lib/constants';
import { EmptyState } from '../shared/EmptyState';
import {
  displayName,
  formatRelativeDate,
  formatTime,
  type AnyItem,
} from '../../lib/utils';
import type { CategoryId } from '../../lib/types';
import type { AllData } from '../../lib/viewTypes';

interface ActivityEntry {
  itemId: string;
  name: string;
  category: CategoryId;
  ts: string;
}

export function ActivityFeed({
  donatedAt,
  data,
}: {
  donatedAt: Record<string, string>;
  data: AllData;
}) {
  const allItems = useMemo(() => {
    const map: Record<string, { name: string; category: CategoryId }> = {};
    for (const cat of CATEGORY_ORDER) {
      for (const item of data[cat] as AnyItem[]) {
        map[item.id] = { name: displayName(item, cat), category: cat };
      }
    }
    return map;
  }, [data]);

  const entries: ActivityEntry[] = useMemo(() => {
    return Object.entries(donatedAt)
      .map(([itemId, ts]) => {
        const info = allItems[itemId];
        if (!info) return null;
        return { itemId, ts, name: info.name, category: info.category };
      })
      .filter((e): e is ActivityEntry => e !== null)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [donatedAt, allItems]);

  if (entries.length === 0) {
    return (
      <EmptyState message="No donations yet. Head to the museum tabs to start donating!" />
    );
  }

  const groups: { label: string; items: ActivityEntry[] }[] = [];
  for (const entry of entries) {
    const label = formatRelativeDate(entry.ts);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(entry);
    } else {
      groups.push({ label, items: [entry] });
    }
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.label}>
          <div
            className="text-[11px] uppercase tracking-wider font-semibold mb-2 px-1"
            style={{ color: '#5a4a35', opacity: 0.65 }}
          >
            {group.label}
          </div>
          <div className="space-y-2">
            {group.items.map(entry => {
              const { Icon } = CATEGORY_META[entry.category];
              return (
                <div
                  key={`${entry.itemId}-${entry.ts}`}
                  className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
                  style={{ borderColor: '#b8dfc8', backgroundColor: '#f2faf6' }}
                >
                  <div
                    className="shrink-0 rounded-xl p-2"
                    style={{
                      backgroundColor: '#EDE3D0',
                      border: '1px solid #E7DAC4',
                    }}
                    aria-hidden
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-medium text-sm truncate"
                      style={{ color: '#2A2A2A' }}
                    >
                      {entry.name}
                    </div>
                    <div
                      className="text-[12px] mt-0.5"
                      style={{ color: '#2A7A52' }}
                    >
                      Donated to museum
                    </div>
                  </div>
                  <div
                    className="text-[11px] shrink-0"
                    style={{ color: '#5a4a35', opacity: 0.7 }}
                  >
                    {formatTime(entry.ts)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
