import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { EditTownModal } from './modals/EditTownModal';

export function TownSwitcher({ onCreateNew }: { onCreateNew: () => void }) {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Close the dropdown whenever the active town changes so stale-open state
  // can't persist across town switches (fixes duplicate-entry visual bug).
  useEffect(() => {
    setOpen(false);
  }, [activeTownId]);

  const activeTown = towns.find(t => t.id === activeTownId);

  // If activeTown can't be resolved (e.g. during a state transition), still
  // render the + button so the user can always create a new town.
  if (!activeTown) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center rounded-[10px] p-1.5 transition"
          style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
          aria-label="Add town"
        >
          <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2 relative z-20">
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

          <button
            onClick={() => setEditing(true)}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
            aria-label="Edit town"
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{ backgroundColor: '#EDE3D0', border: '1px solid #E7DAC4' }}
            aria-label="Add town"
          >
            <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>
        </div>

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
              {towns
                .filter(t => t.id !== activeTownId)
                .map((town, i) => (
                  <button
                    key={town.id}
                    onClick={() => {
                      navigate(`/town/${town.id}/home`);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm transition"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#2A2A2A',
                      borderTop: i > 0 ? '1px solid #E7DAC4' : 'none',
                      fontWeight: '400',
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
