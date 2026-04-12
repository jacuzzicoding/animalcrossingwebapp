// ─── Game Versions ───────────────────────────────────────────────────────────

export type ACGame = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH';

export const AC_GAMES: { id: ACGame; label: string; year: number }[] = [
  { id: 'ACGCN', label: 'Animal Crossing (GCN)', year: 2001 },
  { id: 'ACWW',  label: 'Wild World',            year: 2005 },
  { id: 'ACCF',  label: 'City Folk',              year: 2008 },
  { id: 'ACNL',  label: 'New Leaf',               year: 2012 },
  { id: 'ACNH',  label: 'New Horizons',            year: 2020 },
];

// ─── Collectible Categories ───────────────────────────────────────────────────

export type Category = 'fish' | 'bugs' | 'fossils' | 'art';

export const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'fish',    label: 'Fish',    icon: '🐟', color: '#4A7EA5' },
  { id: 'bugs',    label: 'Bugs',    icon: '🐛', color: '#7A9E4A' },
  { id: 'fossils', label: 'Fossils', icon: '🦕', color: '#C4945A' },
  { id: 'art',     label: 'Art',     icon: '🖼️', color: '#9E4A7A' },
];

// ─── Base Collectible ─────────────────────────────────────────────────────────

export interface BaseCollectible {
  id: string;
  name: string;
  games: ACGame[];
}

// ─── Fish ─────────────────────────────────────────────────────────────────────

export interface FishData extends BaseCollectible {
  category: 'fish';
  season: string;
  location: string;
}

// ─── Bug ──────────────────────────────────────────────────────────────────────

export interface BugData extends BaseCollectible {
  category: 'bugs';
  season: string;
}

// ─── Fossil ───────────────────────────────────────────────────────────────────

export interface FossilData extends BaseCollectible {
  category: 'fossils';
  part?: string;
}

// ─── Art ──────────────────────────────────────────────────────────────────────

export interface ArtData extends BaseCollectible {
  category: 'art';
  basedOn: string;
}

export type CollectibleData = FishData | BugData | FossilData | ArtData;

// ─── Donation Record ──────────────────────────────────────────────────────────

export interface DonationRecord {
  itemId: string;
  category: Category;
  donatedAt: string; // ISO date string
}

// ─── Town ─────────────────────────────────────────────────────────────────────

export interface Town {
  id: string;
  name: string;
  playerName: string;
  game: ACGame;
  createdAt: string; // ISO date string
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface CategoryProgress {
  category: Category;
  donated: number;
  total: number;
  percentage: number;
}

export interface OverallProgress {
  donated: number;
  total: number;
  percentage: number;
  byCategory: CategoryProgress[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  item: CollectibleData;
  isDonated: boolean;
}
