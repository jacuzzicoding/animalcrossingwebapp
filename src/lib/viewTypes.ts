import type {
  CategoryId,
  Fish,
  BugItem,
  FossilItem,
  ArtPiece,
  SeaCreature,
} from './types';

export type ViewId = CategoryId | 'home' | 'activity' | 'analytics';

export interface AllData {
  fish: Fish[];
  bugs: BugItem[];
  fossils: FossilItem[];
  art: ArtPiece[];
  sea_creatures: SeaCreature[];
}
