import type { CategoryId, GameId } from '../lib/types';

const FIVE_SEG_GAMES = new Set<GameId>(['ACNL', 'ACNH']);

export function segmentsForGame(
  gameId: GameId,
  totals: Partial<Record<CategoryId, number>>
): CategoryId[] {
  const base: CategoryId[] = ['fish', 'bugs', 'fossils'];
  if ((totals.art ?? 0) > 0) base.push('art');
  if (FIVE_SEG_GAMES.has(gameId) && (totals.sea_creatures ?? 0) > 0) {
    base.push('sea_creatures');
  }
  return base;
}
