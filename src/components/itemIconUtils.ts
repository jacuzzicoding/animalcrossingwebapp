import { useEffect, useState } from 'react';
import type { CategoryId } from '../lib/types';

/**
 * Flat icon manifest. Values are file extensions; the filename is always
 * `<id>.<ext>` under `public/icons/<category>/`.
 */
export type CategoryMap = Record<string, string>;
export type IconManifest = Partial<Record<CategoryId, CategoryMap>>;

export type ManifestState =
  | { status: 'unknown' }
  | { status: 'present'; manifest: IconManifest }
  | { status: 'absent' };

/**
 * Cross-game id aliases. Same drawing, different spellings between catalogs.
 * Canonical id is the older-game spelling. Applied before manifest lookup.
 *
 * Per-category prefixing isn't needed today — catalog ids don't collide
 * across categories. If that ever changes, key as `"<category>/<id>"`.
 */
export const RENAME_OVERRIDES: Record<string, string> = {
  // bugs
  'citrus-long-horned-beetle': 'citrus-longhorn-beetle',
  'rajah-brookes-birdwing': 'rajah-brooke-birdwing',
  'man-faced-stink-bug': 'manfaced-stink-bug',
  'giant-water-bug': 'giant-waterbug',
  'queen-alexandras-birdwing': 'queen-alexandra-birdwing',
  // fossils — older games use "sabretooth"; ACNH uses "sabertooth"
  'sabertooth-skull': 'sabretooth-skull',
  'sabertooth-torso': 'sabretooth-torso',
  'sabertooth-tail': 'sabretooth-tail',
  // fossils — older games use the full "pachycephalosaurus"
  'pachycephalosaur-skull': 'pachycephalosaurus-skull',
  'pachycephalosaur-tail': 'pachycephalosaurus-tail',
  // fossils — ACNH adds the explicit "-skull" suffix
  'peking-man': 'peking-man-skull',
};

export function canonicalizeId(id: string): string {
  return RENAME_OVERRIDES[id] ?? id;
}

let cache: ManifestState = { status: 'unknown' };
let inflight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

function isUsableManifest(value: unknown): value is IconManifest {
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
  return known.some(cat => {
    const entry = (value as Record<string, unknown>)[cat];
    return entry && typeof entry === 'object' && Object.keys(entry).length > 0;
  });
}

export function getManifestState(): ManifestState {
  return cache;
}

export function loadManifest(): Promise<void> {
  if (inflight) return inflight;
  const promise = fetch('/icons/manifest.json')
    .then(r => {
      if (!r.ok) throw new Error(`status ${r.status}`);
      return r.json();
    })
    .then((parsed: unknown) => {
      if (!isUsableManifest(parsed)) {
        cache = { status: 'absent' };
        return;
      }
      cache = { status: 'present', manifest: parsed };
    })
    .catch(() => {
      cache = { status: 'absent' };
    })
    .finally(() => {
      inflight = null;
      notify();
    });
  inflight = promise;
  return promise;
}

export function subscribeManifest(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Subscribe to the flat icon manifest. Triggers a one-time lazy probe of
 * `/icons/manifest.json` on first call. Returns the current state
 * synchronously and re-renders when the probe settles.
 */
export function useManifestState(): ManifestState {
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = subscribeManifest(() => force(n => n + 1));
    if (cache.status === 'unknown' && !inflight) {
      void loadManifest();
    }
    return unsub;
  }, []);
  return getManifestState();
}

/**
 * Resolve `(category, id)` to a public URL or null. Applies `RENAME_OVERRIDES`
 * before manifest lookup. Fossils with no specific entry fall back to a
 * generic `fossils/placeholder.<ext>` when committed; until then, callers
 * render the monogram fallback.
 */
export function resolveIconUrl(
  manifest: IconManifest,
  category: CategoryId,
  id: string
): string | null {
  const canonical = canonicalizeId(id);
  const ext = manifest[category]?.[canonical];
  if (ext) return `/icons/${category}/${canonical}.${ext}`;
  if (category === 'fossils') {
    const placeholderExt = manifest.fossils?.placeholder;
    if (placeholderExt) return `/icons/fossils/placeholder.${placeholderExt}`;
  }
  return null;
}

/**
 * Returns a stable predicate `(category, id) => boolean` keyed off the current
 * manifest state. Use inside list renders where calling `useHasIcon` per row
 * would violate the rules of hooks.
 */
export function useIconChecker(): (
  category: CategoryId,
  id: string
) => boolean {
  const state = useManifestState();
  if (state.status !== 'present') return () => false;
  const manifest = state.manifest;
  return (category, id) => resolveIconUrl(manifest, category, id) !== null;
}

/**
 * True iff the manifest has resolved AND has an entry for `(category, id)`
 * after rename canonicalization. Returns false during the in-flight probe so
 * callers don't flash a placeholder before the manifest lands.
 */
export function useHasIcon(category: CategoryId, id: string): boolean {
  const state = useManifestState();
  if (state.status !== 'present') return false;
  return resolveIconUrl(state.manifest, category, id) !== null;
}

// Test seam — reset the module-level manifest cache between tests.
export function __resetItemIconCacheForTests() {
  cache = { status: 'unknown' };
  inflight = null;
  subscribers.clear();
}
