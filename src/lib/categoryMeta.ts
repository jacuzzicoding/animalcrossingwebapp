import type React from 'react';
import { Fish as FishIcon, Bug, Bone, Palette, Waves } from 'lucide-react';
import type { CategoryId, GameId } from './types';

export const CATEGORY_META: Record<
  CategoryId,
  { label: string; Icon: React.ElementType; file: string }
> = {
  fish: { label: 'Fish', Icon: FishIcon, file: '/data/acgcn/fish.json' },
  bugs: { label: 'Bugs', Icon: Bug, file: '/data/acgcn/bugs.json' },
  fossils: { label: 'Fossils', Icon: Bone, file: '/data/acgcn/fossils.json' },
  art: { label: 'Art', Icon: Palette, file: '/data/acgcn/art.json' },
  sea_creatures: {
    label: 'Sea Creatures',
    Icon: Waves,
    file: '/data/acnh/sea_creatures.json',
  },
};

const GAME_DATA_DIR: Partial<Record<GameId, string>> = {
  ACGCN: '/data/acgcn',
  ACWW: '/data/acww',
  ACCF: '/data/accf',
  ACNL: '/data/acnl',
  ACNH: '/data/acnh',
};

const GAMES_WITH_ART = new Set<GameId>([
  'ACGCN',
  'ACWW',
  'ACCF',
  'ACNL',
  'ACNH',
]);
const GAMES_WITH_SEA_CREATURES = new Set<GameId>(['ACNL', 'ACNH']);

/** Returns per-category fetch paths for the given game. Null means no data file for that category/game combo. */
export function getDataPaths(
  gameId: GameId
): Record<CategoryId, string | null> {
  const dir = GAME_DATA_DIR[gameId] ?? '/data/acgcn';
  return {
    fish: `${dir}/fish.json`,
    bugs: `${dir}/bugs.json`,
    fossils: `${dir}/fossils.json`,
    art: GAMES_WITH_ART.has(gameId) ? `${dir}/art.json` : null,
    sea_creatures: GAMES_WITH_SEA_CREATURES.has(gameId)
      ? `${dir}/sea_creatures.json`
      : null,
  };
}
