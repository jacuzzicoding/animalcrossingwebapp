import { describe, it, expect } from 'vitest';
import { buildImportPlan, findCandidateMatch } from './saveFileReconcile';
import { buildSaveFile, serializeSaveFile } from './saveFile';
import { parseSaveFile } from './saveFileImport';
import type { Town } from './store';
import type { AllData } from './viewTypes';

function sampleData(): AllData {
  return {
    fish: [
      { id: 'sea-bass', name: 'Sea Bass' } as AllData['fish'][number],
      { id: 'koi', name: 'Koi' } as AllData['fish'][number],
    ],
    bugs: [{ id: 'tarantula', name: 'Tarantula' } as AllData['bugs'][number]],
    fossils: [],
    art: [],
    sea_creatures: [],
  };
}

function knownIds(): Set<string> {
  return new Set(['sea-bass', 'koi', 'tarantula']);
}

function buildAndParse(town: Town, donatedAt: Record<string, string>) {
  const donatedMap: Record<string, boolean> = {};
  for (const k of Object.keys(donatedAt)) donatedMap[k] = true;
  const json = serializeSaveFile(
    buildSaveFile({
      data: sampleData(),
      donatedMap,
      donatedAtMap: donatedAt,
      town: {
        name: town.name,
        gameId: town.gameId,
        hemisphere: town.hemisphere,
        createdAt: town.createdAt,
      },
      appVersion: '0.9.3-beta',
      now: new Date('2026-05-06T18:42:11.000Z'),
    })
  );
  const parsed = parseSaveFile(json);
  if (!parsed.ok) throw new Error(`parse failed: ${parsed.error.kind}`);
  return parsed.file;
}

const townA: Town = {
  id: 'town-A',
  name: 'Pelican Town',
  gameId: 'ACNH',
  hemisphere: 'NH',
  createdAt: '2026-04-01T12:00:00.000Z',
};

describe('findCandidateMatch', () => {
  it('matches on (name, gameId)', () => {
    const file = buildAndParse(townA, {});
    expect(findCandidateMatch([townA], file)).toBe(townA);
  });

  it('does not match if name differs', () => {
    const file = buildAndParse({ ...townA, name: 'Aroma Park' }, {});
    expect(findCandidateMatch([townA], file)).toBeNull();
  });

  it('does not match if gameId differs', () => {
    const file = buildAndParse({ ...townA, gameId: 'ACGCN' }, {});
    expect(findCandidateMatch([townA], file)).toBeNull();
  });
});

describe('buildImportPlan — create', () => {
  it('produces a create plan when there is no matched town', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-04-15T00:00:00.000Z',
      tarantula: '2026-04-16T00:00:00.000Z',
    });
    const plan = buildImportPlan({
      file,
      mode: 'create',
      existing: null,
      existingDonatedAt: {},
      knownItemIds: knownIds(),
    });
    expect(plan.kind).toBe('create');
    if (plan.kind === 'create') {
      expect(plan.newTown.name).toBe('Pelican Town');
      expect(plan.newTown.gameId).toBe('ACNH');
      expect(plan.newTown.hemisphere).toBe('NH');
      expect(plan.donations).toHaveLength(2);
      expect(plan.droppedUnknownIds).toBe(0);
    }
  });

  it('drops donations whose itemId is not in knownItemIds', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-04-15T00:00:00.000Z',
      tarantula: '2026-04-16T00:00:00.000Z',
    });
    const plan = buildImportPlan({
      file,
      mode: 'create',
      existing: null,
      existingDonatedAt: {},
      knownItemIds: new Set(['sea-bass']),
    });
    if (plan.kind !== 'create') throw new Error('wrong kind');
    expect(plan.donations).toHaveLength(1);
    expect(plan.droppedUnknownIds).toBe(1);
  });
});

describe('buildImportPlan — replace', () => {
  it('replaces the existing town and reports previousCount', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-04-15T00:00:00.000Z',
    });
    const plan = buildImportPlan({
      file,
      mode: 'replace',
      existing: townA,
      existingDonatedAt: {
        koi: '2026-03-01T00:00:00.000Z',
        tarantula: '2026-03-02T00:00:00.000Z',
      },
      knownItemIds: knownIds(),
    });
    if (plan.kind !== 'replace') throw new Error('wrong kind');
    expect(plan.townId).toBe(townA.id);
    expect(plan.previousCount).toBe(2);
    expect(plan.donations).toHaveLength(1);
    expect(plan.donations[0].itemId).toBe('sea-bass');
    expect(plan.townPatch.name).toBe('Pelican Town');
    expect(plan.townPatch.hemisphere).toBe('NH');
  });
});

describe('buildImportPlan — merge', () => {
  it('unions rows and reports newRows + conflicts', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-04-15T00:00:00.000Z', // conflict
      tarantula: '2026-04-16T00:00:00.000Z', // new
    });
    const plan = buildImportPlan({
      file,
      mode: 'merge',
      existing: townA,
      existingDonatedAt: {
        'sea-bass': '2026-05-01T00:00:00.000Z',
        koi: '2026-04-10T00:00:00.000Z',
      },
      knownItemIds: knownIds(),
    });
    if (plan.kind !== 'merge') throw new Error('wrong kind');
    expect(plan.newRows).toBe(1);
    expect(plan.conflicts).toBe(1);
    // merged set: sea-bass + koi + tarantula
    expect(plan.donations).toHaveLength(3);
  });

  it('keeps the earlier donatedAt on conflict', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-03-15T00:00:00.000Z', // earlier than existing
    });
    const plan = buildImportPlan({
      file,
      mode: 'merge',
      existing: townA,
      existingDonatedAt: {
        'sea-bass': '2026-05-01T00:00:00.000Z',
      },
      knownItemIds: knownIds(),
    });
    if (plan.kind !== 'merge') throw new Error('wrong kind');
    const seaBass = plan.donations.find(d => d.itemId === 'sea-bass');
    expect(seaBass?.donatedAt).toBe('2026-03-15T00:00:00.000Z');
  });

  it('keeps the earlier existing donatedAt when import is later', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-06-01T00:00:00.000Z',
    });
    const plan = buildImportPlan({
      file,
      mode: 'merge',
      existing: townA,
      existingDonatedAt: {
        'sea-bass': '2026-04-01T00:00:00.000Z',
      },
      knownItemIds: knownIds(),
    });
    if (plan.kind !== 'merge') throw new Error('wrong kind');
    const seaBass = plan.donations.find(d => d.itemId === 'sea-bass');
    expect(seaBass?.donatedAt).toBe('2026-04-01T00:00:00.000Z');
  });
});

describe('round-trip', () => {
  it('parse → reconcile (create) preserves donation set', () => {
    const file = buildAndParse(townA, {
      'sea-bass': '2026-04-15T00:00:00.000Z',
      tarantula: '2026-04-16T00:00:00.000Z',
    });
    const plan = buildImportPlan({
      file,
      mode: 'create',
      existing: null,
      existingDonatedAt: {},
      knownItemIds: knownIds(),
    });
    if (plan.kind !== 'create') throw new Error('wrong kind');
    const ids = plan.donations.map(d => d.itemId).sort();
    expect(ids).toEqual(['sea-bass', 'tarantula']);
  });
});
