import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';

// Reset store state before each test so tests are independent.
beforeEach(() => {
  useAppStore.setState({
    towns: [],
    activeTownId: null,
    donated: {},
    donatedAt: {},
  });
});

// ─── Town Management ──────────────────────────────────────────────────────────

describe('createTown', () => {
  it('adds a town to the list', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    expect(useAppStore.getState().towns).toHaveLength(1);
    expect(useAppStore.getState().towns[0].name).toBe('Pallet');
    expect(useAppStore.getState().towns[0].gameId).toBe('ACGCN');
  });

  it('sets the new town as active immediately', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    expect(useAppStore.getState().activeTownId).toBe(town.id);
  });

  it('returns a town with a non-empty id and ISO createdAt', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    expect(town.id).toBeTruthy();
    expect(() => new Date(town.createdAt)).not.toThrow();
  });

  it('accumulates multiple towns', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    const _t2 = useAppStore.getState().createTown('Viridian', 'ACGCN');
    expect(useAppStore.getState().towns).toHaveLength(2);
  });
});

describe('setActiveTown', () => {
  it('switches the active town', () => {
    const t1 = useAppStore.getState().createTown('Pallet', 'ACGCN');
    const t2 = useAppStore.getState().createTown('Viridian', 'ACGCN');
    // createTown sets active to t2; switch back to t1
    useAppStore.getState().setActiveTown(t1.id);
    expect(useAppStore.getState().activeTownId).toBe(t1.id);
    useAppStore.getState().setActiveTown(t2.id);
    expect(useAppStore.getState().activeTownId).toBe(t2.id);
  });
});

describe('deleteTown', () => {
  it('removes the town from the list', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().deleteTown(town.id);
    expect(useAppStore.getState().towns).toHaveLength(0);
  });

  it('clears donated data for the deleted town', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().toggle('fish-001');
    expect(useAppStore.getState().donated[town.id]).toBeDefined();
    useAppStore.getState().deleteTown(town.id);
    expect(useAppStore.getState().donated[town.id]).toBeUndefined();
    expect(useAppStore.getState().donatedAt[town.id]).toBeUndefined();
  });

  it('falls back to the first remaining town when the active town is deleted', () => {
    const t1 = useAppStore.getState().createTown('Pallet', 'ACGCN');
    const t2 = useAppStore.getState().createTown('Viridian', 'ACGCN');
    // t2 is active now; delete t2 → should fall back to t1
    useAppStore.getState().deleteTown(t2.id);
    expect(useAppStore.getState().activeTownId).toBe(t1.id);
  });

  it('sets activeTownId to null when the last town is deleted', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().deleteTown(town.id);
    expect(useAppStore.getState().activeTownId).toBeNull();
  });

  it('does not change activeTownId when a non-active town is deleted', () => {
    const t1 = useAppStore.getState().createTown('Pallet', 'ACGCN');
    const t2 = useAppStore.getState().createTown('Viridian', 'ACGCN');
    useAppStore.getState().setActiveTown(t2.id);
    useAppStore.getState().deleteTown(t1.id);
    expect(useAppStore.getState().activeTownId).toBe(t2.id);
  });
});

// ─── Donation Toggle ──────────────────────────────────────────────────────────

describe('toggle', () => {
  it('marks an item as donated for the active town', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().toggle('fish-001');
    expect(useAppStore.getState().isDonated('fish-001')).toBe(true);
  });

  it('un-donates an already-donated item (toggle off)', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().toggle('fish-001');
    useAppStore.getState().toggle('fish-001');
    expect(useAppStore.getState().isDonated('fish-001')).toBe(false);
  });

  it('records a donatedAt timestamp when toggled on', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    const before = Date.now();
    useAppStore.getState().toggle('fish-001');
    const after = Date.now();
    const ts = useAppStore.getState().getDonatedAt('fish-001');
    expect(ts).toBeDefined();
    const ms = new Date(ts!).getTime();
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(after);
  });

  it('removes the donatedAt timestamp when toggled off', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().toggle('fish-001');
    useAppStore.getState().toggle('fish-001');
    expect(useAppStore.getState().getDonatedAt('fish-001')).toBeUndefined();
  });

  it('does nothing when there is no active town', () => {
    // No town created → activeTownId is null
    useAppStore.getState().toggle('fish-001');
    expect(useAppStore.getState().donated).toEqual({});
  });

  it('keeps donations isolated per town', () => {
    const t1 = useAppStore.getState().createTown('Pallet', 'ACGCN');
    useAppStore.getState().toggle('fish-001');

    const _t2 = useAppStore.getState().createTown('Viridian', 'ACGCN');
    // t2 is now active; fish-001 should NOT be donated here
    expect(useAppStore.getState().isDonated('fish-001')).toBe(false);

    // Switch back to t1 — still donated
    useAppStore.getState().setActiveTown(t1.id);
    expect(useAppStore.getState().isDonated('fish-001')).toBe(true);
  });
});

// ─── Selectors ────────────────────────────────────────────────────────────────

describe('isDonated', () => {
  it('returns false when no active town', () => {
    expect(useAppStore.getState().isDonated('fish-001')).toBe(false);
  });

  it('returns false for an item that has never been toggled', () => {
    useAppStore.getState().createTown('Pallet', 'ACGCN');
    expect(useAppStore.getState().isDonated('fish-999')).toBe(false);
  });
});

describe('getDonatedAt', () => {
  it('returns undefined when no active town', () => {
    expect(useAppStore.getState().getDonatedAt('fish-001')).toBeUndefined();
  });
});

describe('getActiveTown', () => {
  it('returns undefined when no towns exist', () => {
    expect(useAppStore.getState().getActiveTown()).toBeUndefined();
  });

  it('returns the currently active town', () => {
    const town = useAppStore.getState().createTown('Pallet', 'ACGCN');
    expect(useAppStore.getState().getActiveTown()?.id).toBe(town.id);
  });
});
