import { describe, it, expect } from 'vitest';
import { parseSaveFile, formatParseError } from './saveFileImport';
import {
  buildSaveFile,
  serializeSaveFile,
  type BuildSaveFileArgs,
} from './saveFile';
import type { AllData } from './viewTypes';
import type { GameId } from './types';
import type { Hemisphere } from './store';

function sampleData(): AllData {
  return {
    fish: [
      { id: 'sea-bass', name: 'Sea Bass' } as AllData['fish'][number],
      { id: 'koi', name: 'Koi' } as AllData['fish'][number],
    ],
    bugs: [{ id: 'tarantula', name: 'Tarantula' } as AllData['bugs'][number]],
    fossils: [
      { id: 'trex_skull', name: 'T. Rex Skull' } as AllData['fossils'][number],
    ],
    art: [
      { id: 'mona-lisa', name: 'Famous Painting' } as AllData['art'][number],
    ],
    sea_creatures: [],
  };
}

function buildJson(overrides: Partial<BuildSaveFileArgs> = {}): string {
  const base: BuildSaveFileArgs = {
    data: sampleData(),
    donatedMap: { 'sea-bass': true, tarantula: true },
    donatedAtMap: {
      'sea-bass': '2026-04-15T18:42:11.000Z',
      tarantula: '2026-04-16T02:11:08.000Z',
    },
    town: {
      name: 'Pelican Town',
      gameId: 'ACNH' as GameId,
      hemisphere: 'NH' as Hemisphere,
      createdAt: '2026-04-01T12:00:00.000Z',
    },
    appVersion: '0.9.3-beta',
    now: new Date('2026-05-06T18:42:11.000Z'),
    ...overrides,
  };
  return serializeSaveFile(buildSaveFile(base));
}

describe('parseSaveFile — happy path', () => {
  it('round-trips a file produced by buildSaveFile (ACNH)', () => {
    const json = buildJson();
    const result = parseSaveFile(json);
    if (!result.ok) throw new Error(formatParseError(result.error));
    expect(result.file.app).toBe('ac-web');
    expect(result.file.schemaVersion).toBe(1);
    expect(result.file.town.name).toBe('Pelican Town');
    expect(result.file.town.gameId).toBe('ACNH');
    expect(result.file.town.hemisphere).toBe('NH');
    expect(result.file.donations).toHaveLength(2);
    expect(result.warnings.droppedMalformedRows).toBe(0);
  });

  it('round-trips for ACGCN (no hemisphere)', () => {
    const json = buildJson({
      town: {
        name: 'Marigold',
        gameId: 'ACGCN',
        hemisphere: 'NH',
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    });
    const result = parseSaveFile(json);
    if (!result.ok) throw new Error(formatParseError(result.error));
    expect(result.file.town.gameId).toBe('ACGCN');
    expect(result.file.town.hemisphere).toBeUndefined();
  });

  it('accepts an empty donations array', () => {
    const json = buildJson({ donatedMap: {}, donatedAtMap: {} });
    const result = parseSaveFile(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.donations).toHaveLength(0);
    }
  });
});

describe('parseSaveFile — hard rejects', () => {
  it('rejects invalid JSON', () => {
    const result = parseSaveFile('{not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('invalid_json');
  });

  it('rejects schemaVersion ≠ 1', () => {
    const obj = JSON.parse(buildJson());
    obj.schemaVersion = 2;
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('unsupported_version');
  });

  it('rejects wrong app field', () => {
    const obj = JSON.parse(buildJson());
    obj.app = 'something-else';
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('wrong_app');
  });

  it('rejects missing town', () => {
    const obj = JSON.parse(buildJson());
    delete obj.town;
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('malformed_shape');
  });

  it('rejects unknown gameId', () => {
    const obj = JSON.parse(buildJson());
    obj.town.gameId = 'ACPC';
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('unknown_game');
  });

  it('rejects ACNH save with no hemisphere', () => {
    const obj = JSON.parse(buildJson());
    delete obj.town.hemisphere;
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('missing_hemisphere');
  });

  it('rejects malformed exportedAt', () => {
    const obj = JSON.parse(buildJson());
    obj.exportedAt = 'not-a-date';
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('malformed_shape');
      if (result.error.kind === 'malformed_shape') {
        expect(result.error.field).toBe('exportedAt');
      }
    }
  });

  it('rejects donations not being an array', () => {
    const obj = JSON.parse(buildJson());
    obj.donations = 'oops';
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('malformed_shape');
  });
});

describe('parseSaveFile — donation row tolerance', () => {
  it('drops malformed rows and reports a warning count', () => {
    const obj = JSON.parse(buildJson());
    obj.donations.push({ itemId: '', category: 'fish', donatedAt: '' }); // empty itemId
    obj.donations.push({ itemId: 'x', category: 'monsters', donatedAt: '' }); // bad category
    obj.donations.push({
      itemId: 'y',
      category: 'fish',
      donatedAt: 'totally not a date',
    });
    obj.donations.push('not-an-object');
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.droppedMalformedRows).toBe(4);
      expect(result.file.donations).toHaveLength(2);
    }
  });

  it('accepts donation rows with empty donatedAt strings', () => {
    const obj = JSON.parse(buildJson());
    obj.donations.push({
      itemId: 'koi',
      category: 'fish',
      donatedAt: '',
    });
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.donations).toHaveLength(3);
      expect(result.warnings.droppedMalformedRows).toBe(0);
    }
  });
});

describe('parseSaveFile — strays', () => {
  it('drops a stray hemisphere field on a non-ACNH save without failing', () => {
    const obj = JSON.parse(buildJson());
    obj.town.gameId = 'ACGCN';
    obj.town.hemisphere = 'SH';
    const result = parseSaveFile(JSON.stringify(obj));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.town.hemisphere).toBeUndefined();
    }
  });
});
