import React from 'react';
import { Home, Clock, Search, BarChart2 } from 'lucide-react';
import { CATEGORY_META } from '../lib/categoryMeta';
import { CATEGORY_ORDER } from '../lib/constants';
import type { CategoryId } from '../lib/types';
import type { ViewId, AllData } from '../lib/viewTypes';

export function TabBar({
  active,
  onChange,
  catCounts,
  data,
}: {
  active: ViewId;
  onChange: (c: ViewId) => void;
  catCounts: Record<CategoryId, number>;
  data: AllData;
}) {
  return (
    <div
      className="rounded-[14px] overflow-hidden border"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#F5E9D4' }}
    >
      <div
        className="flex"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        <button
          onClick={() => onChange('home')}
          className="flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: active === 'home' ? '#7B5E3B' : 'transparent',
            color: active === 'home' ? '#F5E9D4' : '#7B5E3B',
            borderRight: '1px solid #E7DAC4',
          }}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
          <span className="opacity-0" style={{ fontSize: '10px' }}>
            ·
          </span>
        </button>
        {CATEGORY_ORDER.filter(cat => cat !== 'art' || data.art.length > 0).map(
          cat => {
            const { label, Icon } = CATEGORY_META[cat];
            const isActive = cat === active;
            const total = data[cat].length;
            const donated = catCounts[cat];
            return (
              <button
                key={cat}
                onClick={() => onChange(cat)}
                className="flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? '#7B5E3B' : 'transparent',
                  color: isActive ? '#F5E9D4' : '#7B5E3B',
                  borderRight: '1px solid #E7DAC4',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="opacity-70" style={{ fontSize: '10px' }}>
                  {donated}/{total}
                </span>
              </button>
            );
          }
        )}
        <button
          onClick={() => onChange('activity')}
          className="flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: active === 'activity' ? '#5a4a35' : 'transparent',
            color: active === 'activity' ? '#F5E9D4' : '#7B5E3B',
            borderLeft: '1px solid #E7DAC4',
          }}
        >
          <Clock className="w-4 h-4" />
          <span>Log</span>
          <span className="opacity-0" style={{ fontSize: '10px' }}>
            ·
          </span>
        </button>
        <button
          onClick={() => onChange('search')}
          className="flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: active === 'search' ? '#3CA370' : 'transparent',
            color: active === 'search' ? '#fff' : '#7B5E3B',
            borderLeft: '1px solid #E7DAC4',
          }}
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <span className="opacity-0" style={{ fontSize: '10px' }}>
            ·
          </span>
        </button>
        <button
          onClick={() => onChange('analytics')}
          className="flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: active === 'analytics' ? '#2A7A52' : 'transparent',
            color: active === 'analytics' ? '#F5E9D4' : '#7B5E3B',
            borderLeft: '1px solid #E7DAC4',
          }}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stats</span>
          <span className="opacity-0" style={{ fontSize: '10px' }}>
            ·
          </span>
        </button>
      </div>
    </div>
  );
}
