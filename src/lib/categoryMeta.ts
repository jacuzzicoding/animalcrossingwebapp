import type React from 'react';
import { Fish as FishIcon, Bug, Bone, Palette } from 'lucide-react';
import type { CategoryId, GameId } from './types';

export const CATEGORY_META: Record<
  CategoryId,
  { label: string; Icon: React.ElementType; file: string }
> = {
  fish: { label: 'Fish', Icon: FishIcon, file: '/data/acgcn/fish.json' },
  bugs: { label: 'Bugs', Icon: Bug, file: '/data/acgcn/bugs.json' },
  fossils: { label: 'Fossils', Icon: Bone, file: '/data/acgcn/fossils.json' },
  art: { label: 'Art', Icon: Palette, file: '/data/acgcn/art.json' },
};

const GAME_DATA_DIR: Partial<Record<GameId, string>> = {
  ACGCN: '/data/acgcn',
  ACWW: '/data/acww',
  ACCF: '/data/accf',
};

const GAMES_WITH_ART = new Set<GameId>(['ACGCN']);

/** Returns per-category fetch paths for the given game. Art is null for games without art data. */
export function getDataPaths(gameId: GameId): Record<CategoryId, string | null> {
  const dir = GAME_DATA_DIR[gameId] ?? '/data/acgcn';
  return {
    fish: `${dir}/fish.json`,
    bugs: `${dir}/bugs.json`,
    fossils: `${dir}/fossils.json`,
    art: GAMES_WITH_ART.has(gameId) ? `${dir}/art.json` : null,
  };
}
