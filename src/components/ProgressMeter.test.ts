import { describe, it, expect } from 'vitest';
import { segmentsForGame } from './progressMeterUtils';

describe('ProgressMeter — segmentsForGame', () => {
  it('returns 4 segments for ACGCN when art has data', () => {
    expect(
      segmentsForGame('ACGCN', { fish: 40, bugs: 40, fossils: 25, art: 13 })
    ).toEqual(['fish', 'bugs', 'fossils', 'art']);
  });

  it('omits art segment when art has no data (e.g. ACWW)', () => {
    expect(
      segmentsForGame('ACWW', { fish: 56, bugs: 56, fossils: 52, art: 0 })
    ).toEqual(['fish', 'bugs', 'fossils']);
  });

  it('includes sea_creatures only for ACNL/ACNH when present', () => {
    expect(
      segmentsForGame('ACNH', {
        fish: 81,
        bugs: 80,
        fossils: 86,
        art: 43,
        sea_creatures: 40,
      })
    ).toEqual(['fish', 'bugs', 'fossils', 'art', 'sea_creatures']);
    expect(
      segmentsForGame('ACGCN', {
        fish: 40,
        bugs: 40,
        fossils: 25,
        art: 13,
        sea_creatures: 0,
      })
    ).toEqual(['fish', 'bugs', 'fossils', 'art']);
  });

  it('drops sea segment for ACNL when totals.sea_creatures is 0', () => {
    expect(
      segmentsForGame('ACNL', { fish: 72, bugs: 72, fossils: 67, art: 30 })
    ).toEqual(['fish', 'bugs', 'fossils', 'art']);
  });
});
