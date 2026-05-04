import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { useUIStore } from '../lib/uiStore';
import { GAMES } from '../lib/types';
import type { CategoryId, GameId } from '../lib/types';
import type { ViewId, AllData } from '../lib/viewTypes';

type Stats = Record<CategoryId, number>;

const CATEGORY_NAV: { id: CategoryId; label: string }[] = [
  { id: 'fish', label: 'Fish' },
  { id: 'bugs', label: 'Bugs' },
  { id: 'fossils', label: 'Fossils' },
  { id: 'art', label: 'Art' },
  { id: 'sea_creatures', label: 'Sea' },
];

const SEA_GAMES = new Set<GameId>(['ACNL', 'ACNH']);

export function Sidebar({
  townId,
  data,
  catCounts,
  onExport,
}: {
  townId: string;
  data: AllData;
  catCounts: Stats;
  onExport: () => void;
}) {
  const navigate = useNavigate();
  const towns = useAppStore(s => s.towns);
  const openTownManager = useUIStore(s => s.openTownManager);
  const activeTown = towns.find(t => t.id === townId);

  const gameId = activeTown?.gameId ?? 'ACGCN';
  const game = GAMES[gameId];
  const showSea = SEA_GAMES.has(gameId) && data.sea_creatures.length > 0;

  function navItemHref(view: ViewId) {
    return `/town/${townId}/${view}`;
  }

  return (
    <aside className="ac-sidebar">
      <div className="ac-brand">
        <div className="ac-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 18 Q16 8 22 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="20" r="1.6" fill="currentColor" />
          </svg>
        </div>
        <div className="ac-brand-text">
          <div className="ac-brand-name">Museum Tracker</div>
          <div className="ac-brand-sub">a museum companion</div>
        </div>
      </div>

      {activeTown && (
        <div className="ac-town-card">
          <div className="ac-town-label">Active town</div>
          <div className="ac-town-name">{activeTown.name}</div>
          <div className="ac-town-meta">
            <span>{game.shortName}</span>
            {game.hasHemispheres && (
              <>
                <span className="ac-dot-sep">·</span>
                <span>Hem. {activeTown.hemisphere ?? 'NH'}</span>
              </>
            )}
          </div>
          <div className="ac-town-actions">
            <button
              className="ac-town-switch"
              onClick={() => openTownManager(false)}
            >
              Switch town ›
            </button>
          </div>
        </div>
      )}

      <nav className="ac-nav">
        <NavLink
          to={navItemHref('home')}
          className={({ isActive }) =>
            `ac-nav-item ${isActive ? 'ac-nav-item-active' : ''}`
          }
        >
          <span>Home</span>
        </NavLink>
        {CATEGORY_NAV.map(t => {
          if (t.id === 'sea_creatures' && !showSea) return null;
          if (t.id === 'art' && data.art.length === 0) return null;
          const total = data[t.id].length;
          const donated = catCounts[t.id];
          return (
            <NavLink
              key={t.id}
              to={navItemHref(t.id)}
              className={({ isActive }) =>
                `ac-nav-item ${isActive ? 'ac-nav-item-active' : ''}`
              }
            >
              <span>{t.label}</span>
              <span className="ac-nav-count">
                {donated}
                <span className="ac-nav-count-slash">/</span>
                {total}
              </span>
            </NavLink>
          );
        })}
        <NavLink
          to={navItemHref('activity')}
          className={({ isActive }) =>
            `ac-nav-item ${isActive ? 'ac-nav-item-active' : ''}`
          }
        >
          <span>Log</span>
        </NavLink>
        <NavLink
          to={navItemHref('analytics')}
          className={({ isActive }) =>
            `ac-nav-item ${isActive ? 'ac-nav-item-active' : ''}`
          }
        >
          <span>Stats</span>
        </NavLink>
      </nav>

      <div className="ac-sidebar-foot">
        <button className="ac-foot-link" onClick={onExport}>
          Export CSV
        </button>
        <button
          className="ac-foot-link"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          Settings
        </button>
        <button
          className="ac-foot-link"
          onClick={() => navigate('/credits')}
          title="Credits"
        >
          Credits
        </button>
      </div>
    </aside>
  );
}
