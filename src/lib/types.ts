export type GameId = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH';

export interface Game {
  id: GameId;
  name: string;
  shortName: string;
  year: number;
  platform: string;
  /** Whether this game has hemisphere-specific availability (NL, NH only) */
  hasHemispheres: boolean;
}

export const GAMES: Record<GameId, Game> = {
  ACGCN: {
    id: 'ACGCN',
    name: 'Animal Crossing (GameCube)',
    shortName: 'Animal Crossing',
    year: 2001,
    platform: 'Nintendo GameCube',
    hasHemispheres: false,
  },
  ACWW: {
    id: 'ACWW',
    name: 'Animal Crossing: Wild World',
    shortName: 'Wild World',
    year: 2005,
    platform: 'Nintendo DS',
    hasHemispheres: false,
  },
  ACCF: {
    id: 'ACCF',
    name: 'Animal Crossing: City Folk',
    shortName: 'City Folk',
    year: 2008,
    platform: 'Nintendo Wii',
    hasHemispheres: false,
  },
  ACNL: {
    id: 'ACNL',
    name: 'Animal Crossing: New Leaf',
    shortName: 'New Leaf',
    year: 2012,
    platform: 'Nintendo 3DS',
    hasHemispheres: false,
  },
  ACNH: {
    id: 'ACNH',
    name: 'Animal Crossing: New Horizons',
    shortName: 'New Horizons',
    year: 2020,
    platform: 'Nintendo Switch',
    hasHemispheres: true,
  },
};

/** Convenience: list of games for selectors. */
export const GAME_LIST: Game[] = [
  GAMES.ACGCN,
  GAMES.ACWW,
  GAMES.ACCF,
  GAMES.ACNL,
  GAMES.ACNH,
];

export type Habitat = 'river' | 'ocean' | 'pond' | 'lake' | 'other';

export type CategoryId = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';

export interface Fish {
  id: string;
  name: string;
  value: number | null;
  habitat: Habitat;
  months?: number[];
  months_nh?: number[];
  months_sh?: number[];
  hours?: number[];
  notes?: string;
}

export interface BugItem {
  id: string;
  name: string;
  value: number | null;
  months?: number[];
  months_nh?: number[];
  months_sh?: number[];
  notes?: string;
}

export interface FossilItem {
  id: string;
  name: string;
  part?: string;
  value: number | null;
}

export interface ArtPiece {
  id: string;
  name: string;
  basedOn: string;
  /** ACNH: whether Crazy Redd sells a counterfeit version of this piece */
  hasFake?: boolean;
}

export interface SeaCreature {
  id: string;
  name: string;
  value: number | null;
  shadow?: string;
  time?: string;
  months?: number[];
  months_nh?: number[];
  months_sh?: number[];
}

// ─── Error types ─────────────────────────────────────────────────────────────

export type AppErrorKind =
  | { type: 'dataLoadFailed'; message: string }
  | { type: 'operationFailed'; message: string; recoverySuggestion?: string }
  | { type: 'networkError'; message: string }
  | { type: 'validationFailed'; message: string };

/** Normalised view of any collectible, used for the detail sheet. */
export interface CollectibleDetail {
  id: string;
  name: string;
  category: CategoryId;
  value?: number | null;
  /** habitat (fish) or undefined */
  habitat?: Habitat;
  /** fossil body-part label */
  part?: string;
  /** real-world artwork reference */
  basedOn?: string;
  months?: number[];
  notes?: string;
  /** shadow size (sea creatures) */
  shadow?: string;
  /** time availability (sea creatures) */
  time?: string;
}
