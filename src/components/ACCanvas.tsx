import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Fish, CheckCircle2, Search } from 'lucide-react';
import { useDonationStore } from '../lib/store';
import type { Fish as FishType } from '../lib/types';

export default function ACCanvas() {
  const [query, setQuery] = useState('');
  const [fishData, setFishData] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);
  const { donated, toggle } = useDonationStore();

  useEffect(() => {
    const loadFishData = async () => {
      try {
        const response = await fetch('/data/acgcn/fish.json');
        const data = await response.json();
        setFishData(data);
      } catch (error) {
        console.error('Failed to load fish data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFishData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fishData;
    return fishData.filter(f => f.name.toLowerCase().includes(q));
  }, [query, fishData]);

  const donatedCount = useMemo(
    () => Object.values(donated).filter(Boolean).length,
    [donated]
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading fish data...</div>
          <div className="text-sm text-gray-500 mt-1">
            Preparing your museum collection
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Cozy parchment background with a hint of museum wood */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #f7f3ea 0%, #efe6d6 100%)',
        }}
      />
      {/* subtle checker grain */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,.15) 1px, transparent 1px), linear-gradient(rgba(0,0,0,.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Frame */}
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <MuseumHeader donated={donatedCount} total={fishData.length} />

        <div className="mt-6">
          <SearchBar query={query} setQuery={setQuery} />
        </div>

        <div className="mt-4 space-y-3">
          {filtered.map(f => (
            <FishRow
              key={f.id}
              fish={f}
              checked={!!donated[f.id]}
              onToggle={() => toggle(f.id)}
            />
          ))}
          {filtered.length === 0 && <EmptyState />}
        </div>
      </div>
    </div>
  );
}

/* Header with warm wood band and progress */
function MuseumHeader(props: { donated: number; total: number }) {
  const pct = props.total ? Math.round((props.donated / props.total) * 100) : 0;

  return (
    <div
      className="rounded-[14px] overflow-hidden border"
      style={{ borderColor: '#E7DAC4' }}
    >
      <div
        className="px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
          color: '#F5E9D4',
        }}
      >
        <div className="text-[13px] tracking-wide opacity-90">
          AC GCN Museum
        </div>
        <h1
          className="text-2xl font-semibold"
          style={{ letterSpacing: '0.2px' }}
        >
          Fish Collection
        </h1>
      </div>
      <div
        className="bg-white px-5 py-4"
        style={{ backgroundColor: '#F5E9D4' }}
      >
        <div
          className="flex items-center justify-between text-sm"
          style={{ color: '#2A2A2A' }}
        >
          <span>
            {props.donated} of {props.total} donated
          </span>
          <span>{pct}% complete</span>
        </div>
        <div
          className="mt-2 h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: '#e9dcc3' }}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: '#3CA370' }}
          />
        </div>
      </div>
    </div>
  );
}

function SearchBar(props: { query: string; setQuery: (v: string) => void }) {
  return (
    <label className="block">
      <div
        className="flex items-center gap-2 rounded-[14px] border bg-white px-3 py-2"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FDF9F1' }}
      >
        <Search className="w-4 h-4 opacity-70" />
        <input
          type="text"
          value={props.query}
          onChange={e => props.setQuery(e.target.value)}
          placeholder="Search fish..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
    </label>
  );
}

/* Row card: parchment card with habitat label and donate toggle */
function FishRow(props: {
  fish: FishType;
  checked: boolean;
  onToggle: () => void;
}) {
  const { fish, checked, onToggle } = props;

  return (
    <div
      className="group flex items-center gap-4 rounded-[14px] border px-4 py-3 transition"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="shrink-0 rounded-xl p-2"
        style={{
          backgroundColor: '#EDE3D0',
          border: '1px solid #E7DAC4',
        }}
        aria-hidden
      >
        <Fish className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-medium" style={{ color: '#2A2A2A' }}>
            {fish.name}
          </div>
          <HabitatChip habitat={fish.habitat} />
        </div>
        <div className="text-[13px] mt-0.5" style={{ color: '#4a4a4a' }}>
          {fish.value != null ? `${fish.value.toLocaleString()} Bells` : '—'}
          {fish.notes && (
            <span className="ml-2 italic opacity-75">{fish.notes}</span>
          )}
        </div>
      </div>

      <DonateToggle checked={checked} onToggle={onToggle} />
    </div>
  );
}

function HabitatChip({ habitat }: { habitat: FishType['habitat'] }) {
  const label = habitat[0].toUpperCase() + habitat.slice(1);
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] rounded-[10px]"
      style={{
        backgroundColor: '#F5E9D4',
        border: '1px solid #E7DAC4',
        color: '#2A2A2A',
      }}
    >
      {label}
    </span>
  );
}

function DonateToggle(props: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={props.onToggle}
      className="relative inline-flex items-center gap-2 select-none rounded-[12px] px-3 py-1.5 text-sm transition"
      aria-pressed={props.checked}
      aria-label={props.checked ? 'Mark as not donated' : 'Mark as donated'}
      style={{
        backgroundColor: props.checked ? '#3CA370' : '#EDE3D0',
        color: props.checked ? '#fff' : '#2A2A2A',
        border: '1px solid #E7DAC4',
      }}
    >
      {props.checked ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <span className="w-4 h-4" />
      )}
      {props.checked ? 'Donated' : 'Donate'}
    </button>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-[14px] border px-4 py-8 text-center"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        color: '#2A2A2A',
      }}
    >
      No fish found. Try a different search.
    </div>
  );
}
