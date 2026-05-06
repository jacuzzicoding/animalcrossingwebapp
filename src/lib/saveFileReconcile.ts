/**
 * Reconcile a parsed SaveFileV1 against the current store, producing an
 * ImportPlan that the store can apply atomically. Pure — no React, no
 * persistence side-effects.
 */

import type { Town, TownPatch, Hemisphere } from './store';
import type { GameId } from './types';
import type { SaveFileV1, SaveDonationV1 } from './saveFile';

export type ReconcileMode = 'replace' | 'merge' | 'create';

export interface DonationRow {
  itemId: string;
  donatedAt: string;
}

export interface ImportPlanCreate {
  kind: 'create';
  newTown: {
    name: string;
    gameId: GameId;
    hemisphere: Hemisphere;
    createdAt: string;
  };
  donations: DonationRow[];
  /** Donations dropped because their itemId is not in the loaded data files. */
  droppedUnknownIds: number;
}

export interface ImportPlanReplace {
  kind: 'replace';
  townId: string;
  /** Patch to the existing town record (name + hemisphere from the file). */
  townPatch: TownPatch;
  gameId: GameId;
  donations: DonationRow[];
  /** Number of existing donations that will be wiped (for warning copy). */
  previousCount: number;
  droppedUnknownIds: number;
}

export interface ImportPlanMerge {
  kind: 'merge';
  townId: string;
  gameId: GameId;
  /** Final donations (existing ∪ imported, earlier donatedAt wins on conflict). */
  donations: DonationRow[];
  /** New rows that were not previously donated. */
  newRows: number;
  /** Rows that were donated in both — earlier timestamp kept. */
  conflicts: number;
  droppedUnknownIds: number;
}

export type ImportPlan = ImportPlanCreate | ImportPlanReplace | ImportPlanMerge;

/** Match by (name, gameId). Returns the first matching town, or null. */
export function findCandidateMatch(
  towns: Town[],
  file: SaveFileV1
): Town | null {
  return (
    towns.find(
      t => t.name === file.town.name && t.gameId === file.town.gameId
    ) ?? null
  );
}

function filterKnown(
  donations: SaveDonationV1[],
  knownItemIds: ReadonlySet<string>
): { rows: DonationRow[]; dropped: number } {
  const rows: DonationRow[] = [];
  let dropped = 0;
  for (const d of donations) {
    if (!knownItemIds.has(d.itemId)) {
      dropped += 1;
      continue;
    }
    rows.push({ itemId: d.itemId, donatedAt: d.donatedAt });
  }
  return { rows, dropped };
}

function compareIso(a: string, b: string): number {
  // Empty strings sort last; otherwise lexicographic on ISO is chronological.
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

interface BuildPlanArgs {
  file: SaveFileV1;
  mode: ReconcileMode;
  /** Existing matched town. Required for replace/merge; ignored for create. */
  existing: Town | null;
  /** Existing donatedAt map for the matched town's gameId (id → ISO string). */
  existingDonatedAt: Record<string, string>;
  /** All known itemIds for the file's gameId, loaded from data files. */
  knownItemIds: ReadonlySet<string>;
}

export function buildImportPlan(args: BuildPlanArgs): ImportPlan {
  const { file, mode, existing, existingDonatedAt, knownItemIds } = args;
  const { rows: importedRows, dropped } = filterKnown(
    file.donations,
    knownItemIds
  );

  if (mode === 'create' || existing === null) {
    const hemisphere: Hemisphere =
      file.town.gameId === 'ACNH' ? (file.town.hemisphere ?? 'NH') : 'NH';
    return {
      kind: 'create',
      newTown: {
        name: file.town.name,
        gameId: file.town.gameId,
        hemisphere,
        createdAt: file.town.createdAt,
      },
      donations: importedRows,
      droppedUnknownIds: dropped,
    };
  }

  // Replace + merge both target the matched existing town.
  const townPatch: TownPatch = { name: file.town.name };
  if (file.town.gameId === 'ACNH' && file.town.hemisphere) {
    townPatch.hemisphere = file.town.hemisphere;
  }

  if (mode === 'replace') {
    return {
      kind: 'replace',
      townId: existing.id,
      townPatch,
      gameId: existing.gameId,
      donations: importedRows,
      previousCount: Object.keys(existingDonatedAt).length,
      droppedUnknownIds: dropped,
    };
  }

  // merge — union; earlier donatedAt wins on conflict.
  const merged = new Map<string, string>();
  for (const [itemId, donatedAt] of Object.entries(existingDonatedAt)) {
    merged.set(itemId, donatedAt ?? '');
  }
  let conflicts = 0;
  let newRows = 0;
  for (const row of importedRows) {
    const prior = merged.get(row.itemId);
    if (prior === undefined) {
      merged.set(row.itemId, row.donatedAt);
      newRows += 1;
    } else {
      conflicts += 1;
      if (compareIso(row.donatedAt, prior) < 0) {
        merged.set(row.itemId, row.donatedAt);
      }
    }
  }

  const donations: DonationRow[] = Array.from(
    merged,
    ([itemId, donatedAt]) => ({
      itemId,
      donatedAt,
    })
  );

  return {
    kind: 'merge',
    townId: existing.id,
    gameId: existing.gameId,
    donations,
    newRows,
    conflicts,
    droppedUnknownIds: dropped,
  };
}
