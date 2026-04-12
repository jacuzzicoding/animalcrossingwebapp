import { FISH } from './fish';
import { BUGS } from './bugs';
import { FOSSILS } from './fossils';
import { ART } from './art';
import { Category, CollectibleData } from '@/types';

export { FISH, BUGS, FOSSILS, ART };

export const ALL_ITEMS: CollectibleData[] = [...FISH, ...BUGS, ...FOSSILS, ...ART];

export const ITEMS_BY_CATEGORY: Record<Category, CollectibleData[]> = {
  fish:    FISH,
  bugs:    BUGS,
  fossils: FOSSILS,
  art:     ART,
};

export const TOTAL_BY_CATEGORY: Record<Category, number> = {
  fish:    FISH.length,
  bugs:    BUGS.length,
  fossils: FOSSILS.length,
  art:     ART.length,
};

export const GRAND_TOTAL = ALL_ITEMS.length;

export function getItemById(id: string): CollectibleData | undefined {
  return ALL_ITEMS.find((item) => item.id === id);
}
