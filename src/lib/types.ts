export type GameId = 'ACGCN';

export type Habitat = 'river' | 'ocean' | 'pond' | 'lake' | 'other';

export type CategoryId = 'fish' | 'bugs' | 'fossils' | 'art';

export interface Fish {
  id: string;
  name: string;
  value: number | null;
  habitat: Habitat;
  months?: number[];
  hours?: number[];
  notes?: string;
}

export interface BugItem {
  id: string;
  name: string;
  value: number | null;
  months?: number[];
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
}

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
}
