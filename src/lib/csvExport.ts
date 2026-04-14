/**
 * CSV export utilities — format mirrors the iOS AnimalCrossingGCN-Tracker ExportService.
 *
 * Output structure (three sections, each separated by a blank line):
 *   1. Donation Activity Log   — one row per donated item, sorted by date
 *   2. Category Completion     — totals and % for fish, bugs, fossils, art
 *   3. Monthly Activity        — per-month donation counts broken down by category
 */

import type { Fish, BugItem, FossilItem, ArtPiece, CategoryId } from './types';

interface AllData {
  fish: Fish[];
  bugs: BugItem[];
  fossils: FossilItem[];
  art: ArtPiece[];
}

function escapeCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(',');
}

function fossilDisplayName(item: FossilItem): string {
  return item.part ? `${item.name} — ${item.part}` : item.name;
}

/**
 * Build and trigger a browser download for the CSV.
 */
export function downloadCSV(
  data: AllData,
  donatedMap: Record<string, boolean>,
  donatedAtMap: Record<string, string>,
  townName: string,
  playerName: string,
): void {
  const csv = buildCSV(data, donatedMap, donatedAtMap, townName, playerName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTown = townName.replace(/[^a-z0-9]/gi, '_');
  a.href = url;
  a.download = `ac-museum-${safeTown}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Build the full CSV string.
 */
export function buildCSV(
  data: AllData,
  donatedMap: Record<string, boolean>,
  donatedAtMap: Record<string, string>,
  townName: string,
  playerName: string,
): string {
  const sections: string[] = [];

  // ── 1. Header metadata ────────────────────────────────────────────────────
  sections.push([
    row('Animal Crossing GCN — Museum Tracker Export'),
    row('Town', townName),
    row('Player', playerName),
    row('Exported', new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })),
  ].join('\n'));

  // ── 2. Donation Activity Log ──────────────────────────────────────────────
  interface ActivityEntry {
    name: string;
    category: string;
    iso: string;
    formatted: string;
  }

  const activity: ActivityEntry[] = [];

  for (const item of data.fish) {
    if (donatedMap[item.id]) {
      const iso = donatedAtMap[item.id] ?? '';
      activity.push({ name: item.name, category: 'Fish', iso, formatted: fmtDate(iso) });
    }
  }
  for (const item of data.bugs) {
    if (donatedMap[item.id]) {
      const iso = donatedAtMap[item.id] ?? '';
      activity.push({ name: item.name, category: 'Bugs', iso, formatted: fmtDate(iso) });
    }
  }
  for (const item of data.fossils) {
    if (donatedMap[item.id]) {
      const iso = donatedAtMap[item.id] ?? '';
      activity.push({ name: fossilDisplayName(item), category: 'Fossils', iso, formatted: fmtDate(iso) });
    }
  }
  for (const item of data.art) {
    if (donatedMap[item.id]) {
      const iso = donatedAtMap[item.id] ?? '';
      activity.push({ name: item.name, category: 'Art', iso, formatted: fmtDate(iso) });
    }
  }

  // Sort by date ascending (empty dates go last)
  activity.sort((a, b) => {
    if (!a.iso && !b.iso) return 0;
    if (!a.iso) return 1;
    if (!b.iso) return -1;
    return a.iso.localeCompare(b.iso);
  });

  const activityLines = [
    row('DONATION ACTIVITY LOG'),
    row('Item', 'Category', 'Date Donated'),
    ...activity.map(e => row(e.name, e.category, e.formatted)),
    ...(activity.length === 0 ? [row('(no donations yet)')] : []),
  ];
  sections.push(activityLines.join('\n'));

  // ── 3. Category Completion ─────────────────────────────────────────────────
  const cats: { id: CategoryId; label: string }[] = [
    { id: 'fish',    label: 'Fish'    },
    { id: 'bugs',    label: 'Bugs'    },
    { id: 'fossils', label: 'Fossils' },
    { id: 'art',     label: 'Art'     },
  ];

  const completionLines = [
    row('CATEGORY COMPLETION'),
    row('Category', 'Donated', 'Total', 'Percentage'),
  ];

  let grandDonated = 0;
  let grandTotal = 0;

  for (const { id, label } of cats) {
    const items = data[id];
    const total = items.length;
    const donated = items.filter(i => donatedMap[i.id]).length;
    const pct = total ? ((donated / total) * 100).toFixed(1) : '0.0';
    completionLines.push(row(label, donated, total, `${pct}%`));
    grandDonated += donated;
    grandTotal += total;
  }

  const grandPct = grandTotal ? ((grandDonated / grandTotal) * 100).toFixed(1) : '0.0';
  completionLines.push(row('Total', grandDonated, grandTotal, `${grandPct}%`));
  sections.push(completionLines.join('\n'));

  // ── 4. Monthly Activity ───────────────────────────────────────────────────
  // Map: "YYYY-MM" -> { fish, bugs, fossils, art }
  const monthMap: Record<string, Record<CategoryId, number>> = {};

  function tally(items: { id: string }[], cat: CategoryId) {
    for (const item of items) {
      if (!donatedMap[item.id]) continue;
      const iso = donatedAtMap[item.id];
      if (!iso) continue;
      const d = new Date(iso);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { fish: 0, bugs: 0, fossils: 0, art: 0 };
      monthMap[key][cat]++;
    }
  }

  tally(data.fish, 'fish');
  tally(data.bugs, 'bugs');
  tally(data.fossils, 'fossils');
  tally(data.art, 'art');

  const monthlyLines = [
    row('MONTHLY ACTIVITY'),
    row('Month', 'Fish', 'Bugs', 'Fossils', 'Art', 'Total'),
  ];

  const sortedMonths = Object.keys(monthMap).sort();
  for (const key of sortedMonths) {
    const m = monthMap[key];
    const [year, month] = key.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const total = m.fish + m.bugs + m.fossils + m.art;
    monthlyLines.push(row(label, m.fish, m.bugs, m.fossils, m.art, total));
  }

  if (sortedMonths.length === 0) {
    monthlyLines.push(row('(no donations yet)'));
  }

  sections.push(monthlyLines.join('\n'));

  return sections.join('\n\n');
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
