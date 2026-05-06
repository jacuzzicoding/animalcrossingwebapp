/**
 * JSON save-file export — versioned, lossless round-trip format.
 *
 * Schema is documented in docs/v0.9.3-csv-import-plan.md §4. The human-readable
 * report still lives in csvExport.ts; this module is strictly the save-file
 * artifact that the v0.9.3 importer (PR 2) will consume.
 */

import type { CategoryId, GameId } from './types';
import type { Hemisphere } from './store';
import type { AllData } from './viewTypes';

export const SAVE_FILE_SCHEMA_VERSION = 1 as const;
export const SAVE_FILE_APP = 'ac-web' as const;

export interface SaveDonationV1 {
  itemId: string;
  category: CategoryId;
  donatedAt: string;
}

export interface SaveTownV1 {
  name: string;
  gameId: GameId;
  createdAt: string;
  hemisphere?: Hemisphere;
}

export interface SaveFileV1 {
  schemaVersion: typeof SAVE_FILE_SCHEMA_VERSION;
  app: typeof SAVE_FILE_APP;
  appVersion: string;
  exportedAt: string;
  town: SaveTownV1;
  donations: SaveDonationV1[];
}

export interface BuildSaveFileArgs {
  data: AllData;
  donatedMap: Record<string, boolean>;
  donatedAtMap: Record<string, string>;
  town: {
    name: string;
    gameId: GameId;
    hemisphere: Hemisphere;
    createdAt: string;
  };
  appVersion: string;
  now?: Date;
}

const CATEGORY_ORDER: CategoryId[] = [
  'fish',
  'bugs',
  'fossils',
  'art',
  'sea_creatures',
];

/**
 * Build a SaveFileV1 object from the active-town slice of state.
 *
 * Items present in donatedMap but missing from the loaded data files are
 * dropped, matching csvExport.ts behaviour. Donations are sorted by donatedAt
 * ascending; rows with an empty donatedAt sink to the end.
 */
export function buildSaveFile(args: BuildSaveFileArgs): SaveFileV1 {
  const { data, donatedMap, donatedAtMap, town, appVersion } = args;
  const now = args.now ?? new Date();

  const donations: SaveDonationV1[] = [];
  for (const category of CATEGORY_ORDER) {
    const items = data[category];
    if (!items || items.length === 0) continue;
    for (const item of items) {
      if (!donatedMap[item.id]) continue;
      donations.push({
        itemId: item.id,
        category,
        donatedAt: donatedAtMap[item.id] ?? '',
      });
    }
  }

  donations.sort((a, b) => {
    if (!a.donatedAt && !b.donatedAt) return 0;
    if (!a.donatedAt) return 1;
    if (!b.donatedAt) return -1;
    return a.donatedAt.localeCompare(b.donatedAt);
  });

  const saveTown: SaveTownV1 = {
    name: town.name,
    gameId: town.gameId,
    createdAt: town.createdAt,
  };
  if (town.gameId === 'ACNH') {
    saveTown.hemisphere = town.hemisphere;
  }

  return {
    schemaVersion: SAVE_FILE_SCHEMA_VERSION,
    app: SAVE_FILE_APP,
    appVersion,
    exportedAt: now.toISOString(),
    town: saveTown,
    donations,
  };
}

export function serializeSaveFile(file: SaveFileV1): string {
  return JSON.stringify(file, null, 2);
}

export function saveFileName(townName: string, date: Date): string {
  const safeTown = townName.replace(/[^a-z0-9]/gi, '_');
  const day = date.toISOString().slice(0, 10);
  return `ac-save-${safeTown}-${day}.json`;
}

/**
 * Build the save file and trigger a browser download.
 */
export function downloadSaveFile(args: BuildSaveFileArgs): void {
  const now = args.now ?? new Date();
  const file = buildSaveFile({ ...args, now });
  const json = serializeSaveFile(file);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = saveFileName(args.town.name, now);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
