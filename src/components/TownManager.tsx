import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Hemisphere, type Town } from '../lib/store';
import { useUIStore } from '../lib/uiStore';
import { GAME_LIST, GAMES, type GameId } from '../lib/types';

const HEMISPHERE_GAMES = new Set<GameId>(['ACNH']);

export function TownManager() {
  const open = useUIStore(s => s.townManagerOpen);
  const forceCreate = useUIStore(s => s.townManagerForceCreate);
  const close = useUIStore(s => s.closeTownManager);

  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const donated = useAppStore(s => s.donated);
  const setActiveTown = useAppStore(s => s.setActiveTown);
  const updateTown = useAppStore(s => s.updateTown);
  const createTown = useAppStore(s => s.createTown);
  const deleteTown = useAppStore(s => s.deleteTown);

  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Reset transient state when drawer toggles
  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setCreating(false);
    } else if (forceCreate) {
      setCreating(true);
      setEditingId(null);
    }
  }, [open, forceCreate]);

  // Esc to close (unless forced)
  useEffect(() => {
    if (!open || forceCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, forceCreate, close]);

  if (!open) return null;

  const showEmptyState = towns.length === 0 && !creating;

  function donatedCount(town: Town): number {
    const byGame = donated[town.id]?.[town.gameId];
    if (!byGame) return 0;
    return Object.keys(byGame).length;
  }

  function handleScrimClick() {
    if (forceCreate) return;
    close();
  }

  function handleActivate(id: string) {
    setActiveTown(id);
    navigate(`/town/${id}/home`);
    close();
  }

  function handleSave(
    id: string,
    patch: { name: string; hemisphere: Hemisphere | null }
  ) {
    // Decision 1: gameId is intentionally never included.
    updateTown(id, { name: patch.name, hemisphere: patch.hemisphere });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const town = towns.find(t => t.id === id);
    if (!town) return;
    if (towns.length <= 1) return;
    if (!window.confirm(`Delete "${town.name}"? This can't be undone.`)) return;
    deleteTown(id);
    setEditingId(null);
  }

  function handleCreate(input: {
    name: string;
    gameId: GameId;
    hemisphere: Hemisphere | null;
  }) {
    const hemi: Hemisphere = input.hemisphere ?? 'NH';
    const town = createTown(input.name, input.gameId, hemi);
    setCreating(false);
    navigate(`/town/${town.id}/home`);
    if (!forceCreate) close();
    else useUIStore.getState().closeTownManager();
  }

  return (
    <div className="ac-tm-scrim" onClick={handleScrimClick}>
      <aside
        className="ac-tm-drawer"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Towns"
      >
        <header className="ac-tm-head">
          <div>
            <div className="ac-tm-eyebrow">Your towns</div>
            <h2 className="ac-tm-title">
              {forceCreate
                ? 'Create your first town'
                : 'Switch, edit, or add a town'}
            </h2>
          </div>
          {!forceCreate && (
            <button className="ac-tm-close" onClick={close} aria-label="Close">
              ×
            </button>
          )}
        </header>

        {showEmptyState && (
          <div className="ac-tm-empty">
            <div className="ac-tm-empty-glyph">○</div>
            <div className="ac-tm-empty-title">No towns yet</div>
            <div className="ac-tm-empty-sub">
              Create your first town to start tracking donations.
            </div>
          </div>
        )}

        <div className="ac-tm-list">
          {towns.map(t => (
            <TownRow
              key={t.id}
              town={t}
              active={t.id === activeTownId}
              editing={editingId === t.id}
              donatedCount={donatedCount(t)}
              canDelete={towns.length > 1}
              onActivate={() => handleActivate(t.id)}
              onEditStart={() => setEditingId(t.id)}
              onEditCancel={() => setEditingId(null)}
              onSave={patch => handleSave(t.id, patch)}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>

        <footer className="ac-tm-foot">
          {creating ? (
            <NewTownForm
              onCancel={() => {
                if (!forceCreate) setCreating(false);
              }}
              onCreate={handleCreate}
              cancellable={!forceCreate}
            />
          ) : (
            <button className="ac-tm-cta" onClick={() => setCreating(true)}>
              <span className="ac-tm-cta-plus">+</span>
              <span>New town</span>
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

interface TownRowProps {
  town: Town;
  active: boolean;
  editing: boolean;
  donatedCount: number;
  canDelete: boolean;
  onActivate: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (patch: { name: string; hemisphere: Hemisphere | null }) => void;
  onDelete: () => void;
}

function TownRow({
  town,
  active,
  editing,
  donatedCount,
  canDelete,
  onActivate,
  onEditStart,
  onEditCancel,
  onSave,
  onDelete,
}: TownRowProps) {
  const [name, setName] = useState(town.name);
  const [hemisphere, setHemisphere] = useState<Hemisphere>(
    town.hemisphere ?? 'NH'
  );
  const showHemisphere = HEMISPHERE_GAMES.has(town.gameId);

  useEffect(() => {
    setName(town.name);
    setHemisphere(town.hemisphere ?? 'NH');
  }, [town, editing]);

  const game = GAMES[town.gameId];

  if (editing) {
    return (
      <div className="ac-tm-row ac-tm-row-editing">
        <div className="ac-tm-form">
          <label className="ac-tm-field">
            <span className="ac-tm-field-label">Town name</span>
            <input
              className="ac-tm-input"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </label>
          <div className="ac-tm-field">
            <span className="ac-tm-field-label">Game</span>
            <div className="ac-tm-row-meta" style={{ marginTop: 0 }}>
              <span className="ac-tm-badge">{game.shortName}</span>
              <span style={{ fontSize: 13 }}>{game.name}</span>
            </div>
            <span className="ac-tm-field-hint">
              Game can&apos;t be changed after creation.
            </span>
          </div>
          {showHemisphere && (
            <label className="ac-tm-field">
              <span className="ac-tm-field-label">Hemisphere</span>
              <div className="ac-tm-seg">
                <button
                  type="button"
                  className={hemisphere === 'NH' ? 'ac-tm-seg-on' : ''}
                  onClick={() => setHemisphere('NH')}
                >
                  Northern
                </button>
                <button
                  type="button"
                  className={hemisphere === 'SH' ? 'ac-tm-seg-on' : ''}
                  onClick={() => setHemisphere('SH')}
                >
                  Southern
                </button>
              </div>
            </label>
          )}
        </div>
        <div className="ac-tm-row-actions">
          {canDelete && (
            <button type="button" className="ac-tm-danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <div className="ac-tm-row-actions-right">
            <button
              type="button"
              className="ac-tm-ghost"
              onClick={onEditCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ac-tm-primary"
              disabled={!name.trim()}
              onClick={() =>
                onSave({
                  name: name.trim(),
                  hemisphere: showHemisphere ? hemisphere : null,
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ac-tm-row ${active ? 'ac-tm-row-active' : ''}`}>
      <button className="ac-tm-row-main" onClick={onActivate}>
        <div
          className="ac-tm-row-mark"
          style={{
            borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
          }}
        >
          {active && <span className="ac-tm-row-tick">●</span>}
        </div>
        <div className="ac-tm-row-text">
          <div className="ac-tm-row-name">{town.name}</div>
          <div className="ac-tm-row-meta">
            <span className="ac-tm-badge">{game.shortName}</span>
            <span>{game.name}</span>
            {showHemisphere && (
              <>
                <span className="ac-dot-sep">·</span>
                <span>Hem. {town.hemisphere}</span>
              </>
            )}
            <span className="ac-dot-sep">·</span>
            <span>{donatedCount} donated</span>
          </div>
        </div>
      </button>
      <button
        className="ac-tm-row-edit"
        onClick={onEditStart}
        aria-label="Edit town"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M11 2l3 3-9 9H2v-3l9-9z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

interface NewTownFormProps {
  onCancel: () => void;
  onCreate: (input: {
    name: string;
    gameId: GameId;
    hemisphere: Hemisphere | null;
  }) => void;
  cancellable: boolean;
}

function NewTownForm({ onCancel, onCreate, cancellable }: NewTownFormProps) {
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState<GameId>('ACNH');
  const [hemisphere, setHemisphere] = useState<Hemisphere>('NH');
  const showHemisphere = HEMISPHERE_GAMES.has(gameId);

  return (
    <div className="ac-tm-newform">
      <input
        className="ac-tm-input"
        autoFocus
        placeholder="Town name (e.g. Marigold)"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <select
        className="ac-tm-input"
        value={gameId}
        onChange={e => setGameId(e.target.value as GameId)}
      >
        {GAME_LIST.map(g => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {showHemisphere && (
        <div className="ac-tm-seg">
          <button
            type="button"
            className={hemisphere === 'NH' ? 'ac-tm-seg-on' : ''}
            onClick={() => setHemisphere('NH')}
          >
            Northern
          </button>
          <button
            type="button"
            className={hemisphere === 'SH' ? 'ac-tm-seg-on' : ''}
            onClick={() => setHemisphere('SH')}
          >
            Southern
          </button>
        </div>
      )}
      <div className="ac-tm-newform-actions">
        {cancellable && (
          <button type="button" className="ac-tm-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="ac-tm-primary"
          disabled={!name.trim()}
          onClick={() =>
            onCreate({
              name: name.trim(),
              gameId,
              hemisphere: showHemisphere ? hemisphere : null,
            })
          }
        >
          Create town
        </button>
      </div>
    </div>
  );
}
