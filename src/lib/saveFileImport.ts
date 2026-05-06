/**
 * JSON save-file import — parser and validator.
 *
 * Consumes the artifact produced by saveFile.ts (PR #106). Schema is documented
 * in docs/v0.9.3-csv-import-plan.md §4. Hard-rejects on shape/version/app
 * violations; tolerates malformed individual donation rows by dropping them
 * with a count surfaced as a warning.
 */

import type { CategoryId, GameId } from './types';
import { GAMES } from './types';
import type { Hemisphere } from './store';
import {
  SAVE_FILE_APP,
  SAVE_FILE_SCHEMA_VERSION,
  type SaveDonationV1,
  type SaveFileV1,
  type SaveTownV1,
} from './saveFile';

const KNOWN_CATEGORIES: ReadonlySet<CategoryId> = new Set([
  'fish',
  'bugs',
  'fossils',
  'art',
  'sea_creatures',
]);

export type ParseError =
  | { kind: 'invalid_json'; message: string }
  | { kind: 'unsupported_version'; received: unknown }
  | { kind: 'wrong_app'; received: unknown }
  | { kind: 'malformed_shape'; field: string; message: string }
  | { kind: 'unknown_game'; received: unknown }
  | { kind: 'missing_hemisphere' };

export interface ParseWarnings {
  /** Donation rows whose shape was malformed and silently dropped. */
  droppedMalformedRows: number;
}

export type ParseResult =
  | { ok: true; file: SaveFileV1; warnings: ParseWarnings }
  | { ok: false; error: ParseError };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || s.length === 0) return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function isValidGameId(v: unknown): v is GameId {
  return typeof v === 'string' && v in GAMES;
}

function parseDonation(row: unknown): SaveDonationV1 | null {
  if (!isRecord(row)) return null;
  const { itemId, category, donatedAt } = row;
  if (typeof itemId !== 'string' || itemId.length === 0) return null;
  if (
    typeof category !== 'string' ||
    !KNOWN_CATEGORIES.has(category as CategoryId)
  ) {
    return null;
  }
  if (typeof donatedAt !== 'string') return null;
  // Empty donatedAt is permitted by the producer (sea_bass with no timestamp
  // sinks to the end). Non-empty strings must parse as a Date.
  if (donatedAt.length > 0 && !isValidIsoDate(donatedAt)) return null;
  return {
    itemId,
    category: category as CategoryId,
    donatedAt,
  };
}

export function parseSaveFile(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not parse JSON.';
    return { ok: false, error: { kind: 'invalid_json', message } };
  }

  if (!isRecord(raw)) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: '<root>',
        message: 'Expected a JSON object at the top level.',
      },
    };
  }

  // schemaVersion gate first — a future version's shape might otherwise fail
  // confusingly downstream.
  if (raw.schemaVersion !== SAVE_FILE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: { kind: 'unsupported_version', received: raw.schemaVersion },
    };
  }

  if (raw.app !== SAVE_FILE_APP) {
    return { ok: false, error: { kind: 'wrong_app', received: raw.app } };
  }

  if (typeof raw.appVersion !== 'string') {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'appVersion',
        message: 'Expected a string.',
      },
    };
  }

  if (!isValidIsoDate(raw.exportedAt)) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'exportedAt',
        message: 'Expected an ISO date string.',
      },
    };
  }

  if (!isRecord(raw.town)) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'town',
        message: 'Expected an object.',
      },
    };
  }

  const town = raw.town;
  if (typeof town.name !== 'string' || town.name.length === 0) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'town.name',
        message: 'Expected a non-empty string.',
      },
    };
  }
  if (!isValidGameId(town.gameId)) {
    return {
      ok: false,
      error: { kind: 'unknown_game', received: town.gameId },
    };
  }
  if (!isValidIsoDate(town.createdAt)) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'town.createdAt',
        message: 'Expected an ISO date string.',
      },
    };
  }

  let hemisphere: Hemisphere | undefined;
  if (town.gameId === 'ACNH') {
    if (town.hemisphere !== 'NH' && town.hemisphere !== 'SH') {
      return { ok: false, error: { kind: 'missing_hemisphere' } };
    }
    hemisphere = town.hemisphere;
  } else if (town.hemisphere !== undefined) {
    // Tolerate stray hemisphere on non-ACNH files — drop it silently.
    hemisphere = undefined;
  }

  const saveTown: SaveTownV1 = {
    name: town.name,
    gameId: town.gameId,
    createdAt: town.createdAt,
  };
  if (hemisphere) saveTown.hemisphere = hemisphere;

  if (!Array.isArray(raw.donations)) {
    return {
      ok: false,
      error: {
        kind: 'malformed_shape',
        field: 'donations',
        message: 'Expected an array.',
      },
    };
  }

  const donations: SaveDonationV1[] = [];
  let droppedMalformedRows = 0;
  for (const row of raw.donations) {
    const parsed = parseDonation(row);
    if (parsed) donations.push(parsed);
    else droppedMalformedRows += 1;
  }

  const file: SaveFileV1 = {
    schemaVersion: SAVE_FILE_SCHEMA_VERSION,
    app: SAVE_FILE_APP,
    appVersion: raw.appVersion,
    exportedAt: raw.exportedAt,
    town: saveTown,
    donations,
  };

  return { ok: true, file, warnings: { droppedMalformedRows } };
}

/** Human-readable error string for the modal UI. */
export function formatParseError(error: ParseError): string {
  switch (error.kind) {
    case 'invalid_json':
      return `That file isn't valid JSON. (${error.message})`;
    case 'unsupported_version':
      return `Unsupported save-file version: ${String(error.received)}. This file may have been exported by a newer version of the app.`;
    case 'wrong_app':
      return `This file isn't an Animal Crossing Museum Tracker save (app field was "${String(error.received)}").`;
    case 'unknown_game':
      return `Unknown game: "${String(error.received)}".`;
    case 'missing_hemisphere':
      return 'ACNH save files require a hemisphere ("NH" or "SH"), but none was found.';
    case 'malformed_shape':
      return `Malformed save file at "${error.field}": ${error.message}`;
  }
}
