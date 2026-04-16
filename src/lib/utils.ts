import type {
  Fish as FishType,
  BugItem,
  FossilItem,
  ArtPiece,
  CategoryId,
} from './types';

export type AnyItem = FishType | BugItem | FossilItem | ArtPiece;

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isFish(item: AnyItem): item is FishType {
  return 'habitat' in item;
}

export function isFossil(item: AnyItem): item is FossilItem {
  return 'part' in item && !('habitat' in item) && !('months' in item);
}

export function isArtPiece(item: AnyItem): item is ArtPiece {
  return 'basedOn' in item;
}

// ─── Item accessors ───────────────────────────────────────────────────────────

export function displayName(item: AnyItem, category: CategoryId): string {
  if (category === 'fossils') {
    const f = item as FossilItem;
    return f.part ? `${f.name} — ${f.part}` : f.name;
  }
  return item.name;
}

export function rowSubtitle(
  item: AnyItem,
  category: CategoryId
): string | null {
  if (category === 'fish') return (item as FishType).habitat;
  if (category === 'fossils') return null;
  if (category === 'art') return (item as ArtPiece).basedOn;
  return null;
}

export function itemBells(item: AnyItem, category: CategoryId): number | null {
  if (category === 'art') return null;
  return (item as FishType | BugItem | FossilItem).value ?? null;
}

export function itemMonths(
  item: AnyItem,
  category: CategoryId
): number[] | undefined {
  if (category === 'fossils' || category === 'art') return undefined;
  return (item as FishType | BugItem).months;
}

export function itemNotes(item: AnyItem): string | undefined {
  return isFish(item) ? item.notes : undefined;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Returns items whose display name matches a case-insensitive query string. */
export function filterByQuery(
  items: AnyItem[],
  category: CategoryId,
  query: string
): AnyItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(item =>
    displayName(item, category).toLowerCase().includes(q)
  );
}

/** Cross-category search: filters all items in each category by a single query. */
export function globalFilter(
  data: Record<CategoryId, AnyItem[]>,
  query: string
): Record<CategoryId, AnyItem[]> {
  const categories: CategoryId[] = ['fish', 'bugs', 'fossils', 'art'];
  const q = query.trim().toLowerCase();
  const results = {} as Record<CategoryId, AnyItem[]>;
  for (const cat of categories) {
    results[cat] = (data[cat] ?? []).filter(item =>
      displayName(item, cat).toLowerCase().includes(q)
    );
  }
  return results;
}
