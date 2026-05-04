import type { CategoryId, GameId } from '../lib/types';

// Games that ship a committed icon set under public/icons/<gameId>/. Other
// games render the textual glyph fallback instead of attempting a fetch that
// would 404. Update as each game's icon scrape is shipped.
export const GAMES_WITH_ICONS = new Set<GameId>(['ACGCN']);

export function gameHasIcons(gameId: GameId): boolean {
  return GAMES_WITH_ICONS.has(gameId);
}

type CategoryMap = Record<string, string>;
export type GameManifest = Partial<Record<CategoryId, CategoryMap>>;

export type ManifestState =
  | { status: 'loading' }
  | { status: 'ready'; manifest: GameManifest }
  | { status: 'missing' };

const cache = new Map<GameId, ManifestState>();
const inflight = new Map<GameId, Promise<void>>();
const subscribers = new Map<GameId, Set<() => void>>();

function notify(gameId: GameId) {
  const subs = subscribers.get(gameId);
  if (!subs) return;
  for (const cb of subs) cb();
}

export function getManifestState(gameId: GameId): ManifestState | undefined {
  return cache.get(gameId);
}

export function loadManifest(gameId: GameId): Promise<void> {
  const existing = inflight.get(gameId);
  if (existing) return existing;
  cache.set(gameId, { status: 'loading' });
  const url = `/icons/${gameId.toLowerCase()}/manifest.json`;
  const promise = fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`status ${r.status}`);
      return r.json() as Promise<GameManifest>;
    })
    .then(manifest => {
      cache.set(gameId, { status: 'ready', manifest });
    })
    .catch(() => {
      cache.set(gameId, { status: 'missing' });
    })
    .finally(() => {
      inflight.delete(gameId);
      notify(gameId);
    });
  inflight.set(gameId, promise);
  return promise;
}

export function subscribeManifest(gameId: GameId, cb: () => void): () => void {
  const subs = subscribers.get(gameId) ?? new Set<() => void>();
  subs.add(cb);
  subscribers.set(gameId, subs);
  return () => subs.delete(cb);
}

// Test seam — reset the module-level manifest cache between tests.
export function __resetItemIconCacheForTests() {
  cache.clear();
  inflight.clear();
  subscribers.clear();
}
