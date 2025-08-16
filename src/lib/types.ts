export type GameId = 'ACGCN';

export type Habitat = 'river' | 'ocean' | 'pond' | 'lake' | 'other';

export interface Fish {
  id: string;
  name: string;
  value: number | null;
  habitat: Habitat;
  months?: number[];
  hours?: number[];
  notes?: string;
}
