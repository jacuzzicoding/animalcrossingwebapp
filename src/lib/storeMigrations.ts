import type { Town } from './store';

/**
 * Zustand persist migrate callback.
 * Called when the stored version is older than the current version.
 */
export function migrateStore(persisted: unknown, fromVersion: number): unknown {
  let state = persisted as Record<string, unknown>;

  if (fromVersion < 2) {
    // v1 → v2:
    // 1. Backfill Town.gameId = 'ACGCN' for all existing towns
    // 2. Lift donated/donatedAt from [townId][itemId] to [townId][gameId][itemId]

    const towns = (state.towns as Town[] | undefined) ?? [];
    const migratedTowns = towns.map(t => ({ ...t, gameId: t.gameId ?? 'ACGCN' }));

    const oldDonated   = (state.donated   as Record<string, Record<string, boolean>> | undefined) ?? {};
    const oldDonatedAt = (state.donatedAt as Record<string, Record<string, string>>  | undefined) ?? {};

    const newDonated:   Record<string, Record<string, Record<string, boolean>>> = {};
    const newDonatedAt: Record<string, Record<string, Record<string, string>>>  = {};

    for (const townId of Object.keys(oldDonated)) {
      newDonated[townId]   = { ACGCN: oldDonated[townId] };
    }
    for (const townId of Object.keys(oldDonatedAt)) {
      newDonatedAt[townId] = { ACGCN: oldDonatedAt[townId] };
    }

    state = {
      ...state,
      towns:     migratedTowns,
      donated:   newDonated,
      donatedAt: newDonatedAt,
    };
  }

  // Future: if (fromVersion < 3) { ... }

  return state;
}
