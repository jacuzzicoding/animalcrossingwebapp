import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  displayName,
  rowSubtitle,
  itemBells,
  itemMonths,
  formatTimestamp,
  formatRelativeDate,
  filterByQuery,
  globalFilter,
} from './utils';
import type { AnyItem } from './utils';
import type { Fish, BugItem, FossilItem, ArtPiece, CategoryId } from './types';

// ─── Sample fixtures ──────────────────────────────────────────────────────────

const fishItem: Fish = {
  id: 'fish-001',
  name: 'Crucian Carp',
  value: 160,
  habitat: 'river',
  months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const bugItem: BugItem = {
  id: 'bug-001',
  name: 'Common Butterfly',
  value: 90,
  months: [3, 4, 5, 6, 7, 8, 9],
};

const fossilNoPartItem: FossilItem = {
  id: 'fossil-001',
  name: 'Dinosaur',
  value: 5000,
};

const fossilWithPart: FossilItem = {
  id: 'fossil-002',
  name: 'Dinosaur',
  part: 'Skull',
  value: 6000,
};

const artItem: ArtPiece = {
  id: 'art-001',
  name: 'Academic Painting',
  basedOn: 'Vitruvian Man',
};

// ─── displayName ──────────────────────────────────────────────────────────────

describe('displayName', () => {
  it('returns the item name for fish', () => {
    expect(displayName(fishItem, 'fish')).toBe('Crucian Carp');
  });

  it('returns the item name for bugs', () => {
    expect(displayName(bugItem, 'bugs')).toBe('Common Butterfly');
  });

  it('returns name only when fossil has no part', () => {
    expect(displayName(fossilNoPartItem, 'fossils')).toBe('Dinosaur');
  });

  it('appends the part for fossils with a part field', () => {
    expect(displayName(fossilWithPart, 'fossils')).toBe('Dinosaur — Skull');
  });

  it('returns the item name for art', () => {
    expect(displayName(artItem, 'art')).toBe('Academic Painting');
  });
});

// ─── rowSubtitle ──────────────────────────────────────────────────────────────

describe('rowSubtitle', () => {
  it('returns the habitat for fish', () => {
    expect(rowSubtitle(fishItem, 'fish')).toBe('river');
  });

  it('returns null for fossils', () => {
    expect(rowSubtitle(fossilNoPartItem, 'fossils')).toBeNull();
  });

  it('returns basedOn for art', () => {
    expect(rowSubtitle(artItem, 'art')).toBe('Vitruvian Man');
  });

  it('returns null for bugs', () => {
    expect(rowSubtitle(bugItem, 'bugs')).toBeNull();
  });
});

// ─── itemBells ────────────────────────────────────────────────────────────────

describe('itemBells', () => {
  it('returns the sell value for fish', () => {
    expect(itemBells(fishItem, 'fish')).toBe(160);
  });

  it('returns the sell value for bugs', () => {
    expect(itemBells(bugItem, 'bugs')).toBe(90);
  });

  it('returns null for art (no sell value)', () => {
    expect(itemBells(artItem, 'art')).toBeNull();
  });
});

// ─── itemMonths ───────────────────────────────────────────────────────────────

describe('itemMonths', () => {
  it('returns months for fish', () => {
    expect(itemMonths(fishItem, 'fish')).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
  });

  it('returns months for bugs', () => {
    expect(itemMonths(bugItem, 'bugs')).toEqual([3,4,5,6,7,8,9]);
  });

  it('returns undefined for fossils', () => {
    expect(itemMonths(fossilNoPartItem, 'fossils')).toBeUndefined();
  });

  it('returns undefined for art', () => {
    expect(itemMonths(artItem, 'art')).toBeUndefined();
  });
});

// ─── formatTimestamp ──────────────────────────────────────────────────────────

describe('formatTimestamp', () => {
  it('formats an ISO date string to short readable form', () => {
    // Use a fixed date to avoid locale flakiness
    const iso = '2024-06-15T12:00:00.000Z';
    const result = formatTimestamp(iso);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });
});

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for an ISO string from today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-10T10:00:00'));
    expect(formatRelativeDate('2024-08-10T08:00:00')).toBe('Today');
  });

  it('returns "Yesterday" for an ISO string from yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-10T10:00:00'));
    expect(formatRelativeDate('2024-08-09T23:59:00')).toBe('Yesterday');
  });

  it('returns a formatted date string for older dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-10T10:00:00'));
    const result = formatRelativeDate('2024-07-04T12:00:00');
    expect(result).toMatch(/July/);
    expect(result).toMatch(/4/);
    expect(result).toMatch(/2024/);
  });
});

// ─── filterByQuery ────────────────────────────────────────────────────────────

const allFish: AnyItem[] = [
  { id: 'f1', name: 'Crucian Carp', value: 160, habitat: 'river' },
  { id: 'f2', name: 'Dace',         value: 200, habitat: 'river' },
  { id: 'f3', name: 'Carp',         value: 300, habitat: 'pond'  },
];

describe('filterByQuery', () => {
  it('returns all items when query is empty', () => {
    expect(filterByQuery(allFish, 'fish', '')).toHaveLength(3);
  });

  it('returns all items when query is whitespace only', () => {
    expect(filterByQuery(allFish, 'fish', '   ')).toHaveLength(3);
  });

  it('filters case-insensitively', () => {
    expect(filterByQuery(allFish, 'fish', 'CARP')).toHaveLength(2);
    expect(filterByQuery(allFish, 'fish', 'carp')).toHaveLength(2);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterByQuery(allFish, 'fish', 'zzz')).toHaveLength(0);
  });

  it('matches partial strings', () => {
    const results = filterByQuery(allFish, 'fish', 'cru');
    expect(results).toHaveLength(1);
    expect((results[0] as Fish).name).toBe('Crucian Carp');
  });

  it('includes fossil part in the match for fossils', () => {
    const fossils: AnyItem[] = [
      { id: 'fo1', name: 'Dinosaur', part: 'Skull', value: 5000 },
      { id: 'fo2', name: 'Dinosaur', part: 'Tail',  value: 4000 },
    ];
    const results = filterByQuery(fossils, 'fossils', 'Skull');
    expect(results).toHaveLength(1);
  });
});

// ─── globalFilter ─────────────────────────────────────────────────────────────

describe('globalFilter', () => {
  const data: Record<CategoryId, AnyItem[]> = {
    fish: allFish,
    bugs: [{ id: 'b1', name: 'Dace Beetle', value: 100, months: [6] }],
    fossils: [{ id: 'fo1', name: 'Dace Fossil', value: 500 }],
    art: [{ id: 'a1', name: 'Fake Painting', basedOn: 'The Last Supper' }],
  };

  it('returns matches across all categories for a shared query term', () => {
    const results = globalFilter(data, 'Dace');
    // fish: Dace; bugs: Dace Beetle; fossils: Dace Fossil; art: 0
    expect(results.fish).toHaveLength(1);
    expect(results.bugs).toHaveLength(1);
    expect(results.fossils).toHaveLength(1);
    expect(results.art).toHaveLength(0);
  });

  it('returns all items per category when query is empty', () => {
    const results = globalFilter(data, '');
    expect(results.fish).toHaveLength(allFish.length);
    expect(results.bugs).toHaveLength(1);
  });

  it('returns empty arrays when nothing matches', () => {
    const results = globalFilter(data, 'zzz');
    for (const cat of Object.values(results)) {
      expect(cat).toHaveLength(0);
    }
  });
});
