import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../lib/store';

// Museum category tabs where the edit/new-town modals can't render (ACCanvas
// is not yet in the layout tree on these routes). Greyed out as a v0.8.1
// stopgap; proper fix deferred to the v0.9 UI revamp.
const MODAL_BLOCKED_TABS = new Set(['fish', 'bugs', 'fossils']);
const BLOCKED_TOOLTIP =
  'Switch to Home, Search, or Recent Donations to edit your town';

export function TownSwitcher({
  onCreateNew,
  onEditTown,
}: {
  onCreateNew: () => void;
  onEditTown: () => void;
}) {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const modalBlocked = MODAL_BLOCKED_TABS.has(tab ?? '');
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

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
              ref={triggerRef}
              onClick={() => {
                if (!open && triggerRef.current) {
                  const r = triggerRef.current.getBoundingClientRect();
                  setDropdownPos({ top: r.bottom + 6, left: r.left });
                }
                setOpen(o => !o);
              }}
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
            onClick={modalBlocked ? undefined : onEditTown}
            disabled={modalBlocked}
            aria-disabled={modalBlocked}
            title={modalBlocked ? BLOCKED_TOOLTIP : 'Edit town'}
            aria-label="Edit town"
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{
              backgroundColor: '#EDE3D0',
              border: '1px solid #E7DAC4',
              opacity: modalBlocked ? 0.4 : 1,
              cursor: modalBlocked ? 'not-allowed' : 'pointer',
            }}
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>

          <button
            onClick={modalBlocked ? undefined : onCreateNew}
            disabled={modalBlocked}
            aria-disabled={modalBlocked}
            title={modalBlocked ? BLOCKED_TOOLTIP : 'Add town'}
            aria-label="Add town"
            className="flex items-center justify-center rounded-[10px] p-1.5 transition"
            style={{
              backgroundColor: '#EDE3D0',
              border: '1px solid #E7DAC4',
              opacity: modalBlocked ? 0.4 : 1,
              cursor: modalBlocked ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus className="w-3.5 h-3.5" style={{ color: '#5a4a35' }} />
          </button>
        </div>

        {open && towns.length > 1 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-50 rounded-[12px] overflow-hidden shadow-lg"
              style={{
                backgroundColor: '#FDF9F1',
                border: '1px solid #E7DAC4',
                minWidth: '160px',
                top: dropdownPos.top,
                left: dropdownPos.left,
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
    </>
  );
}
