import { useMemo, type ElementType } from 'react';
import {
  Fish as FishIcon,
  Bug,
  Bone,
  Palette,
  BarChart2,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type {
  Fish as FishType,
  BugItem,
  FossilItem,
  ArtPiece,
  CategoryId,
} from '../lib/types';
import { displayName, formatRelativeDate, type AnyItem } from '../lib/utils';

const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CAT_ICON: Record<CategoryId, ElementType> = {
  fish: FishIcon,
  bugs: Bug,
  fossils: Bone,
  art: Palette,
};

const CAT_LABEL: Record<CategoryId, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  fossils: 'Fossils',
  art: 'Art',
};

export interface HomeTabProps {
  data: {
    fish: FishType[];
    bugs: BugItem[];
    fossils: FossilItem[];
    art: ArtPiece[];
  };
  donated: Record<string, boolean>;
  donatedAt: Record<string, string>;
  catCounts: Record<CategoryId, number>;
  onNavigate: (view: CategoryId | 'activity' | 'analytics') => void;
}

interface AvailItem {
  id: string;
  name: string;
  category: 'fish' | 'bugs';
  leavingSoon: boolean;
}

export default function HomeTab({
  data,
  donated,
  donatedAt,
  catCounts,
  onNavigate,
}: HomeTabProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const monthName = MONTH_FULL[currentMonth - 1];

  const available: AvailItem[] = useMemo(() => {
    const out: AvailItem[] = [];
    const push = (items: (FishType | BugItem)[], category: 'fish' | 'bugs') => {
      for (const item of items) {
        if (!item.months?.includes(currentMonth)) continue;
        if (donated[item.id]) continue;
        out.push({
          id: item.id,
          name: displayName(item, category),
          category,
          leavingSoon: !item.months.includes(nextMonth),
        });
      }
    };
    push(data.fish, 'fish');
    push(data.bugs, 'bugs');
    return out.sort(
      (a, b) =>
        Number(b.leavingSoon) - Number(a.leavingSoon) ||
        a.name.localeCompare(b.name)
    );
  }, [data.fish, data.bugs, donated, currentMonth, nextMonth]);

  const fishCount = available.filter(a => a.category === 'fish').length;
  const bugsCount = available.filter(a => a.category === 'bugs').length;
  const leavingCount = available.filter(a => a.leavingSoon).length;

  const recent = useMemo(() => {
    const nameMap: Record<string, { name: string; category: CategoryId }> = {};
    (['fish', 'bugs', 'fossils', 'art'] as CategoryId[]).forEach(cat => {
      for (const item of data[cat]) {
        nameMap[item.id] = {
          name: displayName(item as AnyItem, cat),
          category: cat,
        };
      }
    });
    return Object.entries(donatedAt)
      .map(([id, ts]) => ({ id, ts, ...nameMap[id] }))
      .filter(e => e.name)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 3);
  }, [donatedAt, data]);

  const totals: Record<CategoryId, number> = {
    fish: data.fish.length,
    bugs: data.bugs.length,
    fossils: data.fossils.length,
    art: data.art.length,
  };

  return (
    <div className="space-y-4">
      {/* Hero: Available this month */}
      <div
        className="rounded-[16px] border overflow-hidden"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{
            background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
            color: '#F5E9D4',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <div className="text-sm font-semibold">Available in {monthName}</div>
        </div>
        <div className="px-4 py-4">
          {available.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-1">🎉</div>
              <div className="text-sm font-medium" style={{ color: '#2A7A52' }}>
                You're all caught up for {monthName}!
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: '#5a4a35', opacity: 0.75 }}
              >
                Every fish and bug available this month is already in your
                museum.
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm mb-3" style={{ color: '#2A2A2A' }}>
                <span className="font-semibold">{fishCount}</span> fish and{' '}
                <span className="font-semibold">{bugsCount}</span> bugs still to
                donate this month
                {leavingCount > 0 && (
                  <>
                    {' · '}
                    <span style={{ color: '#b85c2e' }} className="font-medium">
                      {leavingCount} leaving soon
                    </span>
                  </>
                )}
                .
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {available.map(a => {
                  const Icon = CAT_ICON[a.category];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 rounded-[10px] border px-3 py-2"
                      style={{
                        borderColor: a.leavingSoon ? '#f0c8a4' : '#E7DAC4',
                        backgroundColor: a.leavingSoon ? '#fdf3e8' : '#FDF9F1',
                      }}
                    >
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: '#7B5E3B' }}
                      />
                      <div
                        className="flex-1 min-w-0 text-sm truncate"
                        style={{ color: '#2A2A2A' }}
                      >
                        {a.name}
                      </div>
                      {a.leavingSoon && (
                        <div
                          className="flex items-center gap-1 text-[11px] font-medium shrink-0"
                          style={{ color: '#b85c2e' }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Leaving after {monthName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-category progress grid */}
      <div className="grid grid-cols-2 gap-3">
        {(['fish', 'bugs', 'fossils', 'art'] as CategoryId[]).map(cat => {
          const Icon = CAT_ICON[cat];
          const done = catCounts[cat];
          const total = totals[cat];
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={cat}
              onClick={() => onNavigate(cat)}
              className="text-left rounded-[14px] border px-4 py-3 transition-colors hover:bg-[#FDF9F1]"
              style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4" style={{ color: '#7B5E3B' }} />
                <div
                  className="text-sm font-semibold"
                  style={{ color: '#2A2A2A' }}
                >
                  {CAT_LABEL[cat]}
                </div>
              </div>
              <div className="text-xs mb-1.5" style={{ color: '#5a4a35' }}>
                {done} / {total} donated
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
            </button>
          );
        })}
      </div>

      {/* Recent activity */}
      <div
        className="rounded-[14px] border overflow-hidden"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between border-b"
          style={{ borderColor: '#E7DAC4' }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#7B5E3B' }} />
            <div className="text-sm font-semibold" style={{ color: '#2A2A2A' }}>
              Recent donations
            </div>
          </div>
          <button
            onClick={() => onNavigate('activity')}
            className="text-xs font-medium"
            style={{ color: '#7B5E3B' }}
          >
            View all →
          </button>
        </div>
        {recent.length === 0 ? (
          <div
            className="px-4 py-5 text-center text-sm"
            style={{ color: '#5a4a35', opacity: 0.75 }}
          >
            No donations yet.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E7DAC4' }}>
            {recent.map(r => {
              const Icon = CAT_ICON[r.category];
              return (
                <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: '#7B5E3B' }}
                  />
                  <div
                    className="flex-1 min-w-0 text-sm truncate"
                    style={{ color: '#2A2A2A' }}
                  >
                    {r.name}
                  </div>
                  <div
                    className="text-xs shrink-0"
                    style={{ color: '#5a4a35', opacity: 0.75 }}
                  >
                    {formatRelativeDate(r.ts)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats shortcut */}
      <button
        onClick={() => onNavigate('analytics')}
        className="w-full flex items-center gap-3 rounded-[14px] border px-4 py-3 transition-colors hover:bg-[#FDF9F1]"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
      >
        <div
          className="shrink-0 rounded-xl p-2"
          style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
        >
          <BarChart2 className="w-4 h-4" style={{ color: '#2A7A52' }} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold" style={{ color: '#2A2A2A' }}>
            View full stats
          </div>
          <div className="text-xs" style={{ color: '#5a4a35', opacity: 0.75 }}>
            Progress charts and monthly availability
          </div>
        </div>
        <div className="text-sm" style={{ color: '#7B5E3B' }}>
          →
        </div>
      </button>
    </div>
  );
}
