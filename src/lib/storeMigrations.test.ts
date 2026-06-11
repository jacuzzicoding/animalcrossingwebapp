import { describe, it, expect } from 'vitest';
import { migrateStore } from './storeMigrations';

type AnyState = Record<string, unknown>;

describe('migrateStore — v1 → v2 (gameId backfill + donation lift)', () => {
  it('lifts donated/donatedAt from [townId][itemId] to [townId][ACGCN][itemId]', () => {
    const v1: AnyState = {
      towns: [{ id: 't1', name: 'Smashville' }],
      donated: { t1: { 'sea-bass': true, koi: false } },
      donatedAt: { t1: { 'sea-bass': '2026-01-02T00:00:00.000Z' } },
    };

    const out = migrateStore(v1, 1) as AnyState;

    expect(out.donated).toEqual({
      t1: { ACGCN: { 'sea-bass': true, koi: false } },
    });
    expect(out.donatedAt).toEqual({
      t1: { ACGCN: { 'sea-bass': '2026-01-02T00:00:00.000Z' } },
    });
  });

  it('backfills gameId = ACGCN on towns that lack one', () => {
    const v1: AnyState = {
      towns: [{ id: 't1', name: 'Smashville' }],
      donated: {},
      donatedAt: {},
    };

    const out = migrateStore(v1, 1) as AnyState;
    const towns = out.towns as Array<Record<string, unknown>>;
    expect(towns[0].gameId).toBe('ACGCN');
  });

  it('preserves an already-set gameId rather than overwriting it', () => {
    const v1: AnyState = {
      towns: [{ id: 't1', name: 'Leaf', gameId: 'ACNH' }],
      donated: {},
      donatedAt: {},
    };

    const out = migrateStore(v1, 1) as AnyState;
    const towns = out.towns as Array<Record<string, unknown>>;
    expect(towns[0].gameId).toBe('ACNH');
  });

  it('tolerates missing donated/donatedAt/towns', () => {
    const out = migrateStore({}, 1) as AnyState;
    expect(out.towns).toEqual([]);
    expect(out.donated).toEqual({});
    expect(out.donatedAt).toEqual({});
  });
});

describe('migrateStore — v2 → v3 (hemisphere backfill)', () => {
  it('backfills hemisphere = NH on towns that lack one', () => {
    const v2: AnyState = {
      towns: [
        { id: 't1', name: 'A', gameId: 'ACGCN' },
        { id: 't2', name: 'B', gameId: 'ACNH' },
      ],
    };

    const out = migrateStore(v2, 2) as AnyState;
    const towns = out.towns as Array<Record<string, unknown>>;
    expect(towns.map(t => t.hemisphere)).toEqual(['NH', 'NH']);
  });

  it('preserves an explicitly-set SH hemisphere', () => {
    const v2: AnyState = {
      towns: [{ id: 't1', name: 'A', gameId: 'ACNH', hemisphere: 'SH' }],
    };

    const out = migrateStore(v2, 2) as AnyState;
    const towns = out.towns as Array<Record<string, unknown>>;
    expect(towns[0].hemisphere).toBe('SH');
  });
});

describe('migrateStore — full v1 → v3 chain and idempotency', () => {
  it('applies both the donation lift and hemisphere backfill from version 0/1', () => {
    const v1: AnyState = {
      towns: [{ id: 't1', name: 'A' }],
      donated: { t1: { 'sea-bass': true } },
      donatedAt: { t1: { 'sea-bass': '2026-01-02T00:00:00.000Z' } },
    };

    const out = migrateStore(v1, 0) as AnyState;
    const towns = out.towns as Array<Record<string, unknown>>;
    expect(towns[0].gameId).toBe('ACGCN');
    expect(towns[0].hemisphere).toBe('NH');
    expect(out.donated).toEqual({ t1: { ACGCN: { 'sea-bass': true } } });
  });

  it('is a no-op (other than identity) when already at the current version', () => {
    const v3: AnyState = {
      towns: [{ id: 't1', name: 'A', gameId: 'ACNH', hemisphere: 'SH' }],
      donated: { t1: { ACNH: { 'sea-bass': true } } },
      donatedAt: { t1: { ACNH: { 'sea-bass': '2026-01-02T00:00:00.000Z' } } },
    };

    const out = migrateStore(v3, 3) as AnyState;
    expect(out.donated).toEqual(v3.donated);
    expect(out.donatedAt).toEqual(v3.donatedAt);
    expect(out.towns).toEqual(v3.towns);
  });

  it('re-running the migration on its own output does not double-lift donations', () => {
    const v1: AnyState = {
      towns: [{ id: 't1', name: 'A' }],
      donated: { t1: { koi: true } },
      donatedAt: {},
    };

    const once = migrateStore(v1, 1) as AnyState;
    // Feeding the already-migrated state back through at the current version
    // must not wrap it a second time (no [townId][ACGCN][ACGCN]).
    const twice = migrateStore(once, 3) as AnyState;
    expect(twice.donated).toEqual({ t1: { ACGCN: { koi: true } } });
  });
});
