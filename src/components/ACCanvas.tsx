import React from 'react';
import { createPortal } from 'react-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Fish as FishIcon,
  Bug,
  Bone,
  Palette,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Plus,
  Pencil,
  Clock,
  BarChart2,
  Download,
  Home,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import HomeTab from './HomeTab';
import { downloadCSV } from '../lib/csvExport';
import ErrorBanner, { type AppErrorKind } from './ErrorBanner';
import ErrorState from './ErrorState';
import type {
  Fish as FishType,
  BugItem,
  FossilItem,
  ArtPiece,
  CategoryId,
} from '../lib/types';
import {
  displayName,
  rowSubtitle,
  itemBells,
  itemMonths,
  itemNotes,
  formatTimestamp,
  formatRelativeDate,
  formatTime,
  filterByQuery,
  globalFilter,
  type AnyItem,
} from '../lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const CATEGORY_META: Record<
  CategoryId,
  {
    label: string;
    Icon: React.ElementType;
    file: string;
  }
> = {
  fish: { label: 'Fish', Icon: FishIcon, file: '/data/acgcn/fish.json' },
  bugs: { label: 'Bugs', Icon: Bug, file: '/data/acgcn/bugs.json' },
  fossils: { label: 'Fossils', Icon: Bone, file: '/data/acgcn/fossils.json' },
  art: { label: 'Art', Icon: Palette, file: '/data/acgcn/art.json' },
};

const CATEGORY_ORDER: CategoryId[] = ['fish', 'bugs', 'fossils', 'art'];

const SEASONS: { label: string; months: number[]; color: string }[] = [
  { label: 'Spring', months: [3, 4, 5], color: '#3CA370' },
  { label: 'Summer', months: [6, 7, 8], color: '#E8A838' },
  { label: 'Fall', months: [9, 10, 11], color: '#C8663A' },
  { label: 'Winter', months: [12, 1, 2], color: '#6A9EC8' },
];

// Stable empty fallbacks so Zustand selectors don't return new {} references
const EMPTY_DONATED: Record<string, boolean> = {};
const EMPTY_DONATED_AT: Record<string, string> = {};

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewId = CategoryId | 'home' | 'activity' | 'search' | 'analytics';

interface AllData {
  fish: FishType[];
  bugs: BugItem[];
  fossils: FossilItem[];
  art: ArtPiece[];
}

// ─── CreateTownModal ──────────────────────────────────────────────────────────

function CreateTownModal({
  onClose,
  required,
}: {
  onClose: () => void;
  required: boolean; // true = no towns exist yet, can't dismiss
}) {
  const createTown = useAppStore(s => s.createTown);
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !playerName.trim()) return;
    createTown(name.trim(), playerName.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={required ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-[20px] overflow-hidden"
        style={{ backgroundColor: '#FDF9F1', border: '1px solid #E7DAC4' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#F5E9D4' }}>
            New Town
          </h2>
          {!required && (
            <button
              onClick={onClose}
              style={{ color: '#F5E9D4', opacity: 0.7 }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#5a4a35' }}
            >
              Town Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Plumeria"
              className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: '#E7DAC4',
                backgroundColor: '#FFFDF6',
                color: '#2A2A2A',
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#5a4a35' }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Brock"
              className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: '#E7DAC4',
                backgroundColor: '#FFFDF6',
                color: '#2A2A2A',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !playerName.trim()}
            className="w-full py-3 rounded-[12px] text-sm font-semibold transition"
            style={{
              backgroundColor:
                name.trim() && playerName.trim() ? '#3CA370' : '#D9CCBA',
              color: '#fff',
            }}
          >
            Create Town
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── EditTownModal ────────────────────────────────────────────────────────────

function EditTownModal({
  town,
  onClose,
}: {
  town: { id: string; name: string; playerName: string };
  onClose: () => void;
}) {
  const updateTown = useAppStore(s => s.updateTown);
  const [name, setName] = useState(town.name);
  const [playerName, setPlayerName] = useState(town.playerName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !playerName.trim()) return;
    updateTown(town.id, name.trim(), playerName.trim());
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-[20px] overflow-hidden"
        style={{ backgroundColor: '#FDF9F1', border: '1px solid #E7DAC4' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#F5E9D4' }}>
            Edit Town
          </h2>
          <button onClick={onClose} style={{ color: '#F5E9D4', opacity: 0.7 }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#5a4a35' }}
            >
              Town Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: '#E7DAC4',
                backgroundColor: '#FFFDF6',
                color: '#2A2A2A',
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#5a4a35' }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: '#E7DAC4',
                backgroundColor: '#FFFDF6',
                color: '#2A2A2A',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !playerName.trim()}
            className="w-full py-3 rounded-[12px] text-sm font-semibold transition"
            style={{
              backgroundColor:
                name.trim() && playerName.trim() ? '#3CA370' : '#D9CCBA',
              color: '#fff',
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── TownSwitcher ─────────────────────────────────────────────────────────────

function TownSwitcher({ onCreateNew }: { onCreateNew: () => void }) {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const setActiveTown = useAppStore(s => s.setActiveTown);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeTown = towns.find(t => t.id === activeTownId);
  if (!activeTown) return null;

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Town name button — only tappable if multiple towns */}
          {towns.length > 1 ? (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition"
              style={{
                backgroundColor: '#EDE3D0',
                color: '#2A2A2A',
                border: '1px solid #E7DAC4',
              }}
            >
              {activeTown.name}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          ) : (
            <span
              className="text-sm font-medium px-1"
              style={{ color: '#2A2A2A' }}
            >
              {activeTown.name}
            </span>
          )}

          {/* Edit town button */}
          <button
            onClick={() => setEditing(true)}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
            aria-label="Edit town"
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>

          {/* New town button */}
          <button
            onClick={onCreateNew}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
            aria-label="Add town"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>
        </div>

        {/* Dropdown */}
        {open && towns.length > 1 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute left-0 top-full mt-1.5 z-20 rounded-[12px] overflow-hidden shadow-lg"
              style={{
                backgroundColor: '#FDF9F1',
                border: '1px solid #E7DAC4',
                minWidth: '160px',
              }}
            >
              {towns.map((town, i) => (
                <button
                  key={town.id}
                  onClick={() => {
                    setActiveTown(town.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition"
                  style={{
                    backgroundColor:
                      town.id === activeTownId ? '#F5E9D4' : 'transparent',
                    color: '#2A2A2A',
                    borderTop: i > 0 ? '1px solid #E7DAC4' : 'none',
                    fontWeight: town.id === activeTownId ? '600' : '400',
                  }}
                >
                  <div>{town.name}</div>
                  <div className="text-[11px] opacity-60">
                    {town.playerName}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {editing && (
        <EditTownModal town={activeTown} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

// ─── MuseumHeader ─────────────────────────────────────────────────────────────

function MuseumHeader({
  donatedCount,
  totalCount,
  onCreateTown,
  onExport,
}: {
  donatedCount: number;
  totalCount: number;
  onCreateTown: () => void;
  onExport: () => void;
}) {
  const pct = totalCount ? Math.round((donatedCount / totalCount) * 100) : 0;
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
        <div className="flex items-end justify-between">
          <h1
            className="text-2xl font-semibold"
            style={{ letterSpacing: '0.2px' }}
          >
            Museum Tracker
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              title="Export CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(245,233,212,0.15)',
                color: '#F5E9D4',
                border: '1px solid rgba(245,233,212,0.3)',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor =
                  'rgba(245,233,212,0.25)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor =
                  'rgba(245,233,212,0.15)')
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <TownSwitcher onCreateNew={onCreateTown} />
          </div>
        </div>
      </div>
      <div className="px-5 py-3" style={{ backgroundColor: '#F5E9D4' }}>
        <div
          className="flex items-center justify-between text-sm mb-1.5"
          style={{ color: '#2A2A2A' }}
        >
          <span>Overall progress</span>
          <span>
            {donatedCount} / {totalCount} · {pct}% complete
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: '#e9dcc3' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: '#3CA370' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

function TabBar({
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
      className="flex rounded-[14px] overflow-hidden border"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#F5E9D4' }}
    >
      {/* Home tab */}
      <button
        onClick={() => onChange('home')}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
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
      {CATEGORY_ORDER.map(cat => {
        const { label, Icon } = CATEGORY_META[cat];
        const isActive = cat === active;
        const total = data[cat].length;
        const donated = catCounts[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
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
      })}
      {/* Activity tab */}
      <button
        onClick={() => onChange('activity')}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
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
      {/* Search tab */}
      <button
        onClick={() => onChange('search')}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
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
      {/* Analytics tab */}
      <button
        onClick={() => onChange('analytics')}
        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
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
  );
}

// ─── CategoryProgress ─────────────────────────────────────────────────────────

function CategoryProgress({
  donated,
  total,
  label,
}: {
  donated: number;
  total: number;
  label: string;
}) {
  const pct = total ? Math.round((donated / total) * 100) : 0;
  return (
    <div
      className="rounded-[12px] border px-4 py-3"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#FFFDF6' }}
    >
      <div
        className="flex items-center justify-between text-sm mb-1.5"
        style={{ color: '#2A2A2A' }}
      >
        <span className="font-medium">{label} Collection</span>
        <span>
          {donated} / {total} donated · {pct}%
        </span>
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
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

function SearchBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#FDF9F1' }}
    >
      <Search className="w-4 h-4 opacity-50 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-sm"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="opacity-40 hover:opacity-70 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── HabitatChip ─────────────────────────────────────────────────────────────

function HabitatChip({ label }: { label: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] rounded-[10px] shrink-0"
      style={{
        backgroundColor: '#F5E9D4',
        border: '1px solid #E7DAC4',
        color: '#5a4a35',
      }}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

// ─── DonateToggle ─────────────────────────────────────────────────────────────

function DonateToggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={checked}
      aria-label={checked ? 'Mark as not donated' : 'Mark as donated'}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs transition select-none"
      style={{
        backgroundColor: checked ? '#3CA370' : '#EDE3D0',
        color: checked ? '#fff' : '#2A2A2A',
        border: '1px solid #E7DAC4',
      }}
    >
      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
      {checked ? 'Donated' : 'Donate'}
    </button>
  );
}

// ─── CollectibleRow ───────────────────────────────────────────────────────────

function CollectibleRow({
  item,
  category,
  checked,
  onToggle,
  onClick,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  onToggle: () => void;
  onClick: () => void;
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
      className="w-full text-left flex items-center gap-3 rounded-[14px] border px-4 py-3 transition"
      style={{
        borderColor: checked ? '#b8dfc8' : '#E7DAC4',
        backgroundColor: checked ? '#f2faf6' : '#FFFDF6',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
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
      <DonateToggle checked={checked} onToggle={onToggle} />
    </button>
  );
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

function MonthGrid({ months }: { months?: number[] }) {
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

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({
  item,
  category,
  checked,
  donatedAt,
  onToggle,
  onClose,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  donatedAt?: string;
  onToggle: () => void;
  onClose: () => void;
}) {
  const { Icon, label } = CATEGORY_META[category];
  const name = displayName(item, category);
  const subtitle = rowSubtitle(item, category);
  const bells = itemBells(item, category);
  const months = itemMonths(item, category);
  const notes = itemNotes(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={onClose}
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

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

interface ActivityEntry {
  itemId: string;
  name: string;
  category: CategoryId;
  ts: string;
}

function ActivityFeed({
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

  // Group entries by day label
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

// ─── AnalyticsView ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] border"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <h2
          style={{ fontSize: 14, fontWeight: 700, color: '#2A2A2A', margin: 0 }}
        >
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: 11, color: '#5a4a35', opacity: 0.7 }}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function AnalyticsView({
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

  // Monthly availability: for each month, count donated fish/bugs available that month
  const monthAvailability = useMemo(() => {
    const donatedIds = new Set(Object.keys(donatedAt));
    const counts = new Array(12).fill(0);
    for (const cat of ['fish', 'bugs'] as const) {
      for (const item of data[cat]) {
        if (!donatedIds.has(item.id)) continue;
        const months: number[] | undefined = (item as FishType | BugItem)
          .months;
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

  // Seasonal breakdown: for each season, count donated fish/bugs available in that season
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
        const months: number[] | undefined = (item as FishType | BugItem)
          .months;
        const active =
          months && months.length > 0
            ? months
            : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        for (const season of SEASONS) {
          if (active.some(m => season.months.includes(m))) {
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
      {/* Section 1: Collection Progress */}
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

      {/* Section 2: Monthly Donation Timeline */}
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

      {/* Section 3: Monthly Availability */}
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

      {/* Section 4: Seasonal Breakdown */}
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

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[14px] border px-4 py-8 text-center text-sm"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        color: '#5a4a35',
      }}
    >
      {message}
    </div>
  );
}

// ─── SearchHistoryPopover ─────────────────────────────────────────────────────

function SearchHistoryPopover({
  searches,
  onSelect,
  onClear,
}: {
  searches: string[];
  onSelect: (s: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-[14px] overflow-hidden shadow-lg"
      style={{ backgroundColor: '#FDF9F1', border: '1px solid #E7DAC4' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid #E7DAC4' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#5a4a35' }}
        >
          Recent Searches
        </span>
        <button
          onClick={onClear}
          className="text-xs font-medium"
          style={{ color: '#3CA370' }}
        >
          Clear
        </button>
      </div>
      {searches.length === 0 ? (
        <div
          className="px-4 py-3 text-sm"
          style={{ color: '#5a4a35', opacity: 0.6 }}
        >
          No recent searches.
        </div>
      ) : (
        searches.map(s => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition"
            style={{ color: '#2A2A2A', borderTop: '1px solid #E7DAC4' }}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 opacity-50" />
            {s}
          </button>
        ))
      )}
    </div>
  );
}

// ─── GlobalSearchBar ──────────────────────────────────────────────────────────

function GlobalSearchBar({
  query,
  setQuery,
  onSubmit,
  historyOpen,
  setHistoryOpen,
  recentSearches,
  onSelectHistory,
  onClearHistory,
  wrapperRef,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (q: string) => void;
  historyOpen: boolean;
  setHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  recentSearches: string[];
  onSelectHistory: (s: string) => void;
  onClearHistory: () => void;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
        style={{ borderColor: '#E7DAC4', backgroundColor: '#FDF9F1' }}
      >
        <Search className="w-4 h-4 opacity-50 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) onSubmit(query.trim());
          }}
          placeholder="Search all categories…"
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: '#2A2A2A' }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="opacity-40 hover:opacity-70 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="shrink-0 opacity-50 hover:opacity-80"
          aria-label="Recent searches"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {historyOpen && (
        <SearchHistoryPopover
          searches={recentSearches}
          onSelect={s => {
            onSelectHistory(s);
            setHistoryOpen(false);
          }}
          onClear={onClearHistory}
        />
      )}
    </div>
  );
}

// ─── GlobalSearchResults ──────────────────────────────────────────────────────

function GlobalSearchResults({
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

// ─── ACCanvas (root) ──────────────────────────────────────────────────────────

export default function ACCanvas() {
  const [activeTab, setActiveTab] = useState<ViewId>('home');
  const [query, setQuery] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<AllData>({
    fish: [],
    bugs: [],
    fossils: [],
    art: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<AppErrorKind | null>(null);
  const [banner, setBanner] = useState<AppErrorKind | null>(null);
  const [selected, setSelected] = useState<{
    item: AnyItem;
    category: CategoryId;
  } | null>(null);
  const [showCreateTown, setShowCreateTown] = useState(false);

  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const activeTownDonated = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED;
    return s.donated[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED;
  });
  const activeTownDonatedAt = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED_AT;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED_AT;
    return s.donatedAt[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED_AT;
  });
  const toggle = useAppStore(s => s.toggle);

  // Show create town modal on first load if no towns exist
  const noTowns = towns.length === 0;

  const activeTown = towns.find(t => t.id === activeTownId);

  function handleExport() {
    if (!activeTown) return;
    downloadCSV(
      data,
      activeTownDonated,
      activeTownDonatedAt,
      activeTown.name,
      activeTown.playerName
    );
  }

  function loadMuseumData() {
    setLoading(true);
    setLoadError(null);
    Promise.all(
      CATEGORY_ORDER.map(cat =>
        fetch(CATEGORY_META[cat].file).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      )
    )
      .then(([fish, bugs, fossils, art]) => {
        setData({ fish, bugs, fossils, art });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load museum data:', err);
        const isNetwork = !navigator.onLine || err instanceof TypeError;
        setLoadError(
          isNetwork
            ? {
                type: 'networkError',
                message: 'Check your internet connection and try again.',
              }
            : {
                type: 'dataLoadFailed',
                message:
                  'Something went wrong while fetching the museum collection.',
              }
        );
        setLoading(false);
      });
  }

  useEffect(() => {
    loadMuseumData();
  }, []);

  const activeCat: CategoryId | null =
    activeTab !== 'home' &&
    activeTab !== 'activity' &&
    activeTab !== 'search' &&
    activeTab !== 'analytics'
      ? activeTab
      : null;
  const activeItems = useMemo(
    () => (activeCat ? (data[activeCat] as AnyItem[]) : []),
    [activeCat, data]
  );

  const filtered = useMemo(() => {
    if (!activeCat) return [];
    return filterByQuery(activeItems, activeCat, query);
  }, [activeItems, activeCat, query]);

  const globalResults = useMemo(() => {
    if (!globalQuery.trim()) return null;
    return globalFilter(data as Record<CategoryId, AnyItem[]>, globalQuery);
  }, [globalQuery, data]);

  function pushRecentSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const deduped = prev.filter(s => s !== trimmed);
      return [trimmed, ...deduped].slice(0, 10);
    });
  }

  useEffect(() => {
    if (!historyOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [historyOpen]);

  const catCounts = useMemo(() => {
    const counts = { fish: 0, bugs: 0, fossils: 0, art: 0 } as Record<
      CategoryId,
      number
    >;
    for (const cat of CATEGORY_ORDER) {
      counts[cat] = (data[cat] as AnyItem[]).filter(
        item => !!activeTownDonated[item.id]
      ).length;
    }
    return counts;
  }, [data, activeTownDonated]);

  const totalItems = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + data[cat].length,
    0
  );
  const totalDonated = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + catCounts[cat],
    0
  );

  const handleTabChange = (cat: ViewId) => {
    setActiveTab(cat);
    setQuery('');
  };

  if (loadError) {
    return <ErrorState error={loadError} onRetry={loadMuseumData} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: '#2A2A2A' }}>
            Loading museum data…
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: '#5a4a35', opacity: 0.7 }}
          >
            Preparing your collection
          </div>
        </div>
      </div>
    );
  }

  const catLabel = activeCat ? CATEGORY_META[activeCat].label : '';

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Parchment background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #f7f3ea 0%, #efe6d6 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,.15) 1px, transparent 1px), linear-gradient(rgba(0,0,0,.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 space-y-4">
        <MuseumHeader
          donatedCount={totalDonated}
          totalCount={totalItems}
          onCreateTown={() => setShowCreateTown(true)}
          onExport={handleExport}
        />

        {banner && (
          <ErrorBanner
            error={banner}
            onDismiss={() => setBanner(null)}
            onRetry={
              banner.type === 'networkError'
                ? () => {
                    setBanner(null);
                    loadMuseumData();
                  }
                : undefined
            }
          />
        )}

        {noTowns ? (
          <EmptyState message="Create a town to start tracking your museum donations." />
        ) : (
          <>
            <TabBar
              active={activeTab}
              onChange={handleTabChange}
              catCounts={catCounts}
              data={data}
            />

            {activeTab === 'home' ? (
              <HomeTab
                data={data}
                donated={activeTownDonated}
                donatedAt={activeTownDonatedAt}
                catCounts={catCounts}
                onNavigate={v => handleTabChange(v)}
              />
            ) : activeTab === 'analytics' ? (
              <AnalyticsView
                data={data}
                catCounts={catCounts}
                donatedAt={activeTownDonatedAt}
              />
            ) : activeTab === 'activity' ? (
              <ActivityFeed donatedAt={activeTownDonatedAt} data={data} />
            ) : activeTab === 'search' ? (
              <>
                <GlobalSearchBar
                  query={globalQuery}
                  setQuery={setGlobalQuery}
                  onSubmit={pushRecentSearch}
                  historyOpen={historyOpen}
                  setHistoryOpen={setHistoryOpen}
                  recentSearches={recentSearches}
                  onSelectHistory={s => {
                    setGlobalQuery(s);
                    pushRecentSearch(s);
                  }}
                  onClearHistory={() => {
                    setRecentSearches([]);
                    setHistoryOpen(false);
                  }}
                  wrapperRef={historyRef}
                />
                <GlobalSearchResults
                  results={globalResults}
                  query={globalQuery}
                  donated={activeTownDonated}
                  onToggle={id => toggle(id)}
                  onSelect={(item, category) => {
                    if (globalQuery.trim())
                      pushRecentSearch(globalQuery.trim());
                    setSelected({ item, category });
                  }}
                />
              </>
            ) : (
              <>
                <CategoryProgress
                  donated={catCounts[activeCat!]}
                  total={activeItems.length}
                  label={catLabel}
                />

                <SearchBar
                  query={query}
                  setQuery={setQuery}
                  placeholder={`Search ${catLabel.toLowerCase()}…`}
                />

                <div className="space-y-3">
                  {filtered.map(item => (
                    <CollectibleRow
                      key={item.id}
                      item={item}
                      category={activeCat!}
                      checked={!!activeTownDonated[item.id]}
                      onToggle={() => toggle(item.id)}
                      onClick={() =>
                        setSelected({ item, category: activeCat! })
                      }
                    />
                  ))}
                  {filtered.length === 0 && (
                    <EmptyState
                      message={
                        query
                          ? `No ${catLabel.toLowerCase()} match "${query}".`
                          : `No ${catLabel.toLowerCase()} found.`
                      }
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create town modal — required on first load, optional after */}
      {(noTowns || showCreateTown) && (
        <CreateTownModal
          required={noTowns}
          onClose={() => setShowCreateTown(false)}
        />
      )}

      {selected && !noTowns && (
        <DetailModal
          item={selected.item}
          category={selected.category}
          checked={!!activeTownDonated[selected.item.id]}
          donatedAt={activeTownDonatedAt[selected.item.id]}
          onToggle={() => toggle(selected.item.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
