import { useEffect, useState } from 'react';
import type { CategoryId, GameId } from '../lib/types';

type CategoryMap = Record<string, string>;
export type GameManifest = Partial<Record<CategoryId, CategoryMap>>;

// Tri-state per gameId. `unknown` = no probe yet (or in flight); `present` =
// fetch returned a usable manifest; `absent` = fetch 404'd or returned
// malformed JSON. Callers treat `unknown` as "don't render the icon yet" so
// no fetch-driven flicker shows up while the probe is in flight.
export type ManifestState =
  | { status: 'unknown' }
  | { status: 'present'; manifest: GameManifest }
  | { status: 'absent' };

const cache = new Map<GameId, ManifestState>();
const inflight = new Map<GameId, Promise<void>>();
const subscribers = new Map<GameId, Set<() => void>>();

function notify(gameId: GameId) {
  const subs = subscribers.get(gameId);
  if (!subs) return;
  for (const cb of subs) cb();
}

function isUsableManifest(value: unknown): value is GameManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const known: CategoryId[] = [
    'fish',
    'bugs',
    'fossils',
    'art',
    'sea_creatures',
  ];
  for (const cat of known) {
    const entry = (value as Record<string, unknown>)[cat];
    if (entry === undefined) continue;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false;
    }
  }
  // At least one recognised category must carry entries.
  return known.some(cat => {
    const entry = (value as Record<string, unknown>)[cat];
    return entry && typeof entry === 'object' && Object.keys(entry).length > 0;
  });
}

export function getManifestState(gameId: GameId): ManifestState {
  return cache.get(gameId) ?? { status: 'unknown' };
}

export function loadManifest(gameId: GameId): Promise<void> {
  const existing = inflight.get(gameId);
  if (existing) return existing;
  // Mark in-flight as `unknown` (still indistinguishable from "not probed yet"
  // for callers — the only thing they care about is `present` vs not).
  if (!cache.has(gameId)) cache.set(gameId, { status: 'unknown' });
  const url = `/icons/${gameId.toLowerCase()}/manifest.json`;
  const promise = fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`status ${r.status}`);
      return r.json();
    })
    .then((parsed: unknown) => {
      if (!isUsableManifest(parsed)) {
        cache.set(gameId, { status: 'absent' });
        return;
      }
      cache.set(gameId, { status: 'present', manifest: parsed });
    })
    .catch(() => {
      cache.set(gameId, { status: 'absent' });
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

/**
 * Subscribe to a gameId's manifest state. Triggers a one-time lazy probe of
 * `/icons/<gameId>/manifest.json` on first call per gameId. Returns the
 * current state synchronously and re-renders when the probe settles.
 */
export function useManifestState(gameId: GameId): ManifestState {
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = subscribeManifest(gameId, () => force(n => n + 1));
    if (!cache.has(gameId)) {
      void loadManifest(gameId);
    }
    return unsub;
  }, [gameId]);
  return getManifestState(gameId);
}

/**
 * True iff a usable `manifest.json` is committed for the given game. Probes
 * the file lazily on first call; returns false during the in-flight window so
 * callers fall back to the textual-glyph render path until the probe settles.
 *
 * No code change is needed when a new game's icon set ships — the probe sees
 * the manifest the next time the page loads and `<ItemIcon>` lights up.
 */
export function useGameHasIcons(gameId: GameId): boolean {
  return useManifestState(gameId).status === 'present';
}

// Test seam — reset the module-level manifest cache between tests.
export function __resetItemIconCacheForTests() {
  cache.clear();
  inflight.clear();
  subscribers.clear();
}
