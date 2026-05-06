import { describe, it, expect } from 'vitest';
import {
  buildSaveFile,
  serializeSaveFile,
  saveFileName,
  SAVE_FILE_APP,
  SAVE_FILE_SCHEMA_VERSION,
  type BuildSaveFileArgs,
} from './saveFile';
import type { AllData } from './viewTypes';
import type { GameId } from './types';
import type { Hemisphere } from './store';

function emptyData(): AllData {
  return { fish: [], bugs: [], fossils: [], art: [], sea_creatures: [] };
}

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

function baseArgs(
  overrides: Partial<BuildSaveFileArgs> = {}
): BuildSaveFileArgs {
  return {
    data: sampleData(),
    donatedMap: {},
    donatedAtMap: {},
    town: {
      name: 'Pelican Town',
      gameId: 'ACGCN' as GameId,
      hemisphere: 'NH' as Hemisphere,
      createdAt: '2026-04-01T12:00:00.000Z',
    },
    appVersion: '0.9.3-beta',
    now: new Date('2026-05-06T18:42:11.000Z'),
    ...overrides,
  };
}

describe('buildSaveFile — shape', () => {
  it('emits the locked top-level fields', () => {
    const file = buildSaveFile(baseArgs());
    expect(file.schemaVersion).toBe(SAVE_FILE_SCHEMA_VERSION);
    expect(file.schemaVersion).toBe(1);
    expect(file.app).toBe(SAVE_FILE_APP);
    expect(file.app).toBe('ac-web');
    expect(file.appVersion).toBe('0.9.3-beta');
    expect(file.exportedAt).toBe('2026-05-06T18:42:11.000Z');
    expect(() => new Date(file.exportedAt).toISOString()).not.toThrow();
  });

  it('writes town name, gameId, createdAt', () => {
    const file = buildSaveFile(baseArgs());
    expect(file.town.name).toBe('Pelican Town');
    expect(file.town.gameId).toBe('ACGCN');
    expect(file.town.createdAt).toBe('2026-04-01T12:00:00.000Z');
  });
});

describe('buildSaveFile — hemisphere gating', () => {
  it('omits hemisphere outside ACNH', () => {
    const file = buildSaveFile(
      baseArgs({ town: { ...baseArgs().town, gameId: 'ACGCN' } })
    );
    expect('hemisphere' in file.town).toBe(false);
    expect(file.town.hemisphere).toBeUndefined();
  });

  it('includes hemisphere for ACNH (NH)', () => {
    const file = buildSaveFile(
      baseArgs({
        town: { ...baseArgs().town, gameId: 'ACNH', hemisphere: 'NH' },
      })
    );
    expect(file.town.hemisphere).toBe('NH');
  });

  it('includes hemisphere for ACNH (SH)', () => {
    const file = buildSaveFile(
      baseArgs({
        town: { ...baseArgs().town, gameId: 'ACNH', hemisphere: 'SH' },
      })
    );
    expect(file.town.hemisphere).toBe('SH');
  });

  it.each<GameId>(['ACWW', 'ACCF', 'ACNL'])(
    'omits hemisphere for %s',
    gameId => {
      const file = buildSaveFile(
        baseArgs({ town: { ...baseArgs().town, gameId } })
      );
      expect('hemisphere' in file.town).toBe(false);
    }
  );
});

describe('buildSaveFile — donations', () => {
  it('emits empty array when nothing is donated', () => {
    const file = buildSaveFile(baseArgs());
    expect(file.donations).toEqual([]);
  });

  it('only includes items present in data', () => {
    const file = buildSaveFile(
      baseArgs({
        donatedMap: { 'sea-bass': true, 'ghost-id': true },
        donatedAtMap: { 'sea-bass': '2026-04-15T18:42:11.000Z' },
      })
    );
    expect(file.donations.map(d => d.itemId)).toEqual(['sea-bass']);
  });

  it('tags rows with their CategoryId', () => {
    const file = buildSaveFile(
      baseArgs({
        donatedMap: {
          'sea-bass': true,
          tarantula: true,
          trex_skull: true,
          'mona-lisa': true,
        },
        donatedAtMap: {
          'sea-bass': '2026-04-15T00:00:00.000Z',
          tarantula: '2026-04-16T00:00:00.000Z',
          trex_skull: '2026-04-17T00:00:00.000Z',
          'mona-lisa': '2026-04-18T00:00:00.000Z',
        },
      })
    );
    const byItem = Object.fromEntries(
      file.donations.map(d => [d.itemId, d.category])
    );
    expect(byItem['sea-bass']).toBe('fish');
    expect(byItem.tarantula).toBe('bugs');
    expect(byItem.trex_skull).toBe('fossils');
    expect(byItem['mona-lisa']).toBe('art');
  });

  it('sorts donations ascending by donatedAt', () => {
    const file = buildSaveFile(
      baseArgs({
        donatedMap: { koi: true, 'sea-bass': true, tarantula: true },
        donatedAtMap: {
          koi: '2026-04-20T00:00:00.000Z',
          'sea-bass': '2026-04-10T00:00:00.000Z',
          tarantula: '2026-04-15T00:00:00.000Z',
        },
      })
    );
    expect(file.donations.map(d => d.itemId)).toEqual([
      'sea-bass',
      'tarantula',
      'koi',
    ]);
  });

  it('sinks rows with empty donatedAt to the end', () => {
    const file = buildSaveFile(
      baseArgs({
        donatedMap: { koi: true, 'sea-bass': true },
        donatedAtMap: { 'sea-bass': '2026-04-10T00:00:00.000Z' },
      })
    );
    expect(file.donations.map(d => d.itemId)).toEqual(['sea-bass', 'koi']);
    expect(file.donations[1].donatedAt).toBe('');
  });

  it('includes sea_creatures when the data file has them', () => {
    const data = sampleData();
    data.sea_creatures = [
      { id: 'lobster', name: 'Lobster' } as AllData['sea_creatures'][number],
    ];
    const file = buildSaveFile(
      baseArgs({
        data,
        donatedMap: { lobster: true },
        donatedAtMap: { lobster: '2026-04-20T00:00:00.000Z' },
        town: { ...baseArgs().town, gameId: 'ACNH', hemisphere: 'NH' },
      })
    );
    expect(file.donations).toEqual([
      {
        itemId: 'lobster',
        category: 'sea_creatures',
        donatedAt: '2026-04-20T00:00:00.000Z',
      },
    ]);
  });
});

describe('saveFileName', () => {
  it('uses the ac-save-<safeTown>-<date>.json shape', () => {
    expect(
      saveFileName('Pelican Town', new Date('2026-05-06T00:00:00.000Z'))
    ).toBe('ac-save-Pelican_Town-2026-05-06.json');
  });

  it('sanitizes non-alphanumerics', () => {
    expect(saveFileName('My Town!', new Date('2026-05-06T00:00:00.000Z'))).toBe(
      'ac-save-My_Town_-2026-05-06.json'
    );
  });
});

describe('serialize → parse round-trip', () => {
  it('JSON.parse(serializeSaveFile(...)) deep-equals the build output', () => {
    const file = buildSaveFile(
      baseArgs({
        donatedMap: { 'sea-bass': true, tarantula: true },
        donatedAtMap: {
          'sea-bass': '2026-04-15T18:42:11.000Z',
          tarantula: '2026-04-16T02:11:08.000Z',
        },
        town: {
          name: 'Pelican Town',
          gameId: 'ACNH',
          hemisphere: 'SH',
          createdAt: '2026-04-01T12:00:00.000Z',
        },
      })
    );
    const json = serializeSaveFile(file);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(file);
    expect(parsed.town.hemisphere).toBe('SH');
  });

  it('produces valid JSON for an empty town', () => {
    const file = buildSaveFile(baseArgs({ data: emptyData() }));
    const json = serializeSaveFile(file);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).donations).toEqual([]);
  });
});
