import type { CategoryId } from './types';

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  fossils: 'Fossils',
  art: 'Art',
  sea_creatures: 'Sea Creatures',
};

export const CATEGORY_ORDER: CategoryId[] = [
  'fish',
  'bugs',
  'fossils',
  'art',
  'sea_creatures',
];

export const SEASONS = [
  { label: 'Spring', months: [3, 4, 5], color: '#3CA370' },
  { label: 'Summer', months: [6, 7, 8], color: '#E8A838' },
  { label: 'Fall', months: [9, 10, 11], color: '#C8663A' },
  { label: 'Winter', months: [12, 1, 2], color: '#6A9EC8' },
] as const;
