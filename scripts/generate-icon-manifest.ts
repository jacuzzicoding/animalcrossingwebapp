/**
 * generate-icon-manifest.ts
 *
 * Walks `public/icons/{fish,bugs,fossils,art,sea_creatures}/` and emits
 * `public/icons/manifest.json` shaped as
 *   { [category]: { [id]: ext } }
 *
 * Under the flat layout, filenames are the invariant `<id>.<ext>`, so the
 * manifest stores only the extension per id.
 *
 * Catalog ordering: each per-game data catalog at
 * `public/data/<gameId>/<category>.json` contributes its id order. Multiple
 * catalogs are merged (first-seen wins); ids on disk that no catalog mentions
 * fall back to filesystem (sorted) order at the tail.
 *
 * Run: `npm run icons:manifest`
 */
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, parse } from 'node:path';

const ROOT = process.cwd();
const ICONS_ROOT = join(ROOT, 'public', 'icons');
const DATA_ROOT = join(ROOT, 'public', 'data');
const CATEGORIES = ['fish', 'bugs', 'fossils', 'art', 'sea_creatures'];

function readCatalogIds(gameId: string, category: string): string[] | null {
  const path = join(DATA_ROOT, gameId.toLowerCase(), `${category}.json`);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((it: { id?: string }) => it.id)
      .filter((id): id is string => typeof id === 'string');
  } catch {
    return null;
  }
}

function listGameDirs(): string[] {
  if (!existsSync(DATA_ROOT)) return [];
  return readdirSync(DATA_ROOT).filter(name => {
    try {
      return statSync(join(DATA_ROOT, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

function buildCategoryMap(category: string): Record<string, string> {
  const dir = join(ICONS_ROOT, category);
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter(name => {
    try {
      return statSync(join(dir, name)).isFile() && !name.startsWith('.');
    } catch {
      return false;
    }
  });
  if (files.length === 0) return {};

  // id → ext. Note: parse('foo.png').ext = '.png'; strip the leading dot.
  const extById = new Map<string, string>();
  for (const filename of files) {
    const { name, ext } = parse(filename);
    extById.set(name, ext.replace(/^\./, ''));
  }

  // Order: every game catalog's order, merged first-seen-wins, then sorted
  // tail of any disk-only ids.
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const game of listGameDirs()) {
    const catalogIds = readCatalogIds(game, category);
    if (!catalogIds) continue;
    for (const id of catalogIds) {
      if (extById.has(id) && !seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
  }
  for (const id of [...extById.keys()].sort()) {
    if (!seen.has(id)) ordered.push(id);
  }

  const out: Record<string, string> = {};
  for (const id of ordered) {
    out[id] = extById.get(id)!;
  }
  return out;
}

function main() {
  if (!existsSync(ICONS_ROOT)) {
    console.error(`No icons directory at ${ICONS_ROOT}`);
    process.exit(1);
  }

  const manifest: Record<string, Record<string, string>> = {};
  for (const cat of CATEGORIES) {
    const map = buildCategoryMap(cat);
    if (Object.keys(map).length === 0) continue;
    manifest[cat] = map;
  }

  const out = join(ICONS_ROOT, 'manifest.json');
  writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  const counts = Object.entries(manifest)
    .map(([c, m]) => `${c}:${Object.keys(m).length}`)
    .join('  ');
  console.log(`wrote  ${out}  (${counts || 'empty'})`);
}

main();
