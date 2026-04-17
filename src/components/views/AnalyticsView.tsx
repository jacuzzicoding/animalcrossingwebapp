import React, { useMemo } from 'react';
import { CATEGORY_META } from '../../lib/categoryMeta';
import { CATEGORY_ORDER, MONTH_NAMES, SEASONS } from '../../lib/constants';
import { SectionCard } from './SectionCard';
import type { CategoryId, Fish as FishType, BugItem } from '../../lib/types';
import type { AllData } from '../../lib/viewTypes';

export function AnalyticsView({
  data,
  catCounts,
  donatedAt,
}: {
  data: AllData;
  catCounts: Record<CategoryId, number>;
  donatedAt: Record<string, string>;
}) {
  const monthlyBuckets = useMemo(() => {
    const map: Record<string, number> = {};
    for (const iso of Object.values(donatedAt)) {
      const d = new Date(iso);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const maxCount = sorted.reduce((m, [, v]) => Math.max(m, v), 0);
    return { buckets: sorted, maxCount };
  }, [donatedAt]);

  const monthAvailability = useMemo(() => {
    const donatedIds = new Set(Object.keys(donatedAt));
    const counts = new Array(12).fill(0);
    for (const cat of ['fish', 'bugs'] as const) {
      for (const item of data[cat]) {
        if (!donatedIds.has(item.id)) continue;
        const months: number[] | undefined = (item as FishType | BugItem).months;
        const active =
          months && months.length > 0
            ? months
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        for (const m of active) counts[m - 1]++;
      }
    }
    const max = Math.max(...counts, 1);
    return { counts, max };
  }, [donatedAt, data]);

  const seasonalData = useMemo(() => {
    const donatedIds = new Set(Object.keys(donatedAt));
    const counts: Record<string, number> = {
      Spring: 0,
      Summer: 0,
      Fall: 0,
      Winter: 0,
    };
    for (const cat of ['fish', 'bugs'] as const) {
      for (const item of data[cat]) {
        if (!donatedIds.has(item.id)) continue;
        const months: number[] | undefined = (item as FishType | BugItem).months;
        const active =
          months && months.length > 0
            ? months
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        for (const season of SEASONS) {
          if (active.some(m => (season.months as readonly number[]).includes(m))) {
            counts[season.label]++;
          }
        }
      }
    }
    const totalDonatedFishBugs = [...donatedIds].filter(
      id => data.fish.some(f => f.id === id) || data.bugs.some(b => b.id === id)
    ).length;
    return { counts, total: totalDonatedFishBugs };
  }, [donatedAt, data]);

  const totalDonated = Object.keys(donatedAt).length;

  return (
    <div className="space-y-4">
      <SectionCard title="Collection Progress">
        {CATEGORY_ORDER.map((cat, i) => {
          const { label, Icon } = CATEGORY_META[cat];
          const donated = catCounts[cat];
          const total = data[cat].length;
          const pct = total ? Math.round((donated / total) * 100) : 0;
          const complete = donated === total && total > 0;
          return (
            <div
              key={cat}
              style={{ marginBottom: i < CATEGORY_ORDER.length - 1 ? 14 : 0 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#EDE3D0',
                    border: '1px solid #E7DAC4',
                    borderRadius: 8,
                    padding: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon style={{ width: 14, height: 14, color: '#5a4a35' }} />
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#2A2A2A',
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: 12, color: '#5a4a35' }}>
                  {donated}/{total}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: complete ? '#C89A3A' : '#3CA370',
                    minWidth: 36,
                    textAlign: 'right',
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  backgroundColor: '#e9dcc3',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: complete ? '#C89A3A' : '#3CA370',
                    transition: 'width 0.5s ease',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </SectionCard>

      <SectionCard
        title="Donation Timeline"
        subtitle={
          totalDonated > 0
            ? `${totalDonated} donation${totalDonated !== 1 ? 's' : ''}`
            : undefined
        }
      >
        {monthlyBuckets.buckets.length === 0 ? (
          <div
            className="rounded-[10px] border px-4 py-6 text-center text-sm"
            style={{
              borderColor: '#E7DAC4',
              backgroundColor: '#F5E9D4',
              color: '#5a4a35',
            }}
          >
            No donations yet — timestamps will appear here once you start
            donating.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              height: 120,
              padding: '0 2px',
            }}
          >
            {monthlyBuckets.buckets.map(([key, count]) => {
              const barHeightPct = (count / monthlyBuckets.maxCount) * 100;
              const [year, month] = key.split('-');
              const label = `${MONTH_NAMES[Number(month) - 1]} '${year.slice(2)}`;
              return (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: '#5a4a35',
                      opacity: 0.75,
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(4, barHeightPct)}%`,
                      maxHeight: 76,
                      backgroundColor: '#3CA370',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: '#5a4a35',
                      opacity: 0.65,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      textAlign: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Monthly Availability">
        <div style={{ fontSize: 12, color: '#5a4a35', marginBottom: 10 }}>
          Donated fish &amp; bugs available each month
        </div>
        {totalDonated === 0 ? (
          <div
            className="rounded-[10px] border px-4 py-6 text-center text-sm"
            style={{
              borderColor: '#E7DAC4',
              backgroundColor: '#F5E9D4',
              color: '#5a4a35',
            }}
          >
            Donate fish or bugs to see monthly availability.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MONTH_NAMES.map((name, i) => {
              const count = monthAvailability.counts[i];
              const barWidth = (count / monthAvailability.max) * 100;
              return (
                <div
                  key={name}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <div
                    style={{
                      width: 28,
                      fontSize: 11,
                      color: '#5a4a35',
                      flexShrink: 0,
                    }}
                  >
                    {name.slice(0, 3)}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 10,
                      backgroundColor: '#e9dcc3',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: '#3CA370',
                        transition: 'width 0.4s ease',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 18,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#2A2A2A',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Seasonal Breakdown">
        <div style={{ fontSize: 12, color: '#5a4a35', marginBottom: 10 }}>
          Donated fish &amp; bugs available each season
        </div>
        {seasonalData.total === 0 ? (
          <div
            className="rounded-[10px] border px-4 py-6 text-center text-sm"
            style={{
              borderColor: '#E7DAC4',
              backgroundColor: '#F5E9D4',
              color: '#5a4a35',
            }}
          >
            Donate fish or bugs to see seasonal availability.
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            {SEASONS.map(season => {
              const count = seasonalData.counts[season.label];
              const pct =
                seasonalData.total > 0
                  ? Math.round((count / seasonalData.total) * 100)
                  : 0;
              const maxCount = Math.max(
                ...SEASONS.map(s => seasonalData.counts[s.label]),
                1
              );
              const barWidth = (count / maxCount) * 100;
              return (
                <div
                  key={season.label}
                  style={{
                    backgroundColor: '#FFFDF6',
                    border: '1px solid #E7DAC4',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: '#5a4a35', marginBottom: 3 }}
                  >
                    {season.label}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: '#2A2A2A',
                      lineHeight: 1.1,
                      marginBottom: 2,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{ fontSize: 11, color: '#5a4a35', marginBottom: 8 }}
                  >
                    {pct}% of donated
                  </div>
                  <div
                    style={{
                      height: 4,
                      backgroundColor: '#e9dcc3',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: season.color,
                        transition: 'width 0.4s ease',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
