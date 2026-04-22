import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { EditTownModal } from './modals/EditTownModal';

// Shared tap hardening for the header's small icon buttons. Explicit button
// type prevents accidental form-submit semantics; manipulation disables the
// iOS Safari double-tap-zoom delay that otherwise swallows quick taps.
const ICON_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: '#EDE3D0',
  border: '1px solid #E7DAC4',
  touchAction: 'manipulation',
};

export function TownSwitcher({ onCreateNew }: { onCreateNew: () => void }) {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const setActiveTown = useAppStore(s => s.setActiveTown);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the dropdown whenever the active town changes so stale-open state
  // can't persist across town switches (fixes duplicate-entry visual bug).
  useEffect(() => {
    setOpen(false);
  }, [activeTownId]);

  // Close on outside click. Previously a full-viewport `fixed inset-0 z-10`
  // overlay handled this, but it sat above the +/edit buttons and swallowed
  // their taps, so the add-town modal never opened from an open dropdown.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const activeTown = towns.find(t => t.id === activeTownId);

  // If activeTown can't be resolved (e.g. during a state transition), still
  // render the + button so the user can always create a new town.
  if (!activeTown) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCreateNew}
          className="flex items-center justify-center rounded-[10px] p-1.5 transition"
          style={ICON_BUTTON_STYLE}
          aria-label="Add town"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
        </button>
      </div>
    );
  }

  function handleCreateNew() {
    setOpen(false);
    onCreateNew();
  }

  function handleEdit() {
    setOpen(false);
    setEditing(true);
  }

  return (
    <>
      <div className="relative" ref={rootRef}>
        <div className="flex items-center gap-2">
          {towns.length > 1 ? (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm font-medium transition"
              style={{
                backgroundColor: '#EDE3D0',
                color: '#2A2A2A',
                border: '1px solid #E7DAC4',
                touchAction: 'manipulation',
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

          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={ICON_BUTTON_STYLE}
            aria-label="Edit town"
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={ICON_BUTTON_STYLE}
            aria-label="Add town"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>
        </div>

        {open && towns.length > 1 && (
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
                type="button"
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
                  touchAction: 'manipulation',
                }}
              >
                <div>{town.name}</div>
                <div className="text-[11px] opacity-60">{town.playerName}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {editing && (
        <EditTownModal town={activeTown} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
