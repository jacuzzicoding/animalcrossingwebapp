/**
 * generate-icon-manifest.ts
 *
 * Walks `public/icons/<gameId>/{fish,bugs,fossils,art,sea_creatures}/` and
 * emits `public/icons/<gameId>/manifest.json` shaped as
 *   { [category]: { [id]: filename } }
 *
 * The on-disk extension is preserved per file (Fandom serves a mix of png/jpg),
 * so the consuming UI cannot guess the extension at render time without this
 * lookup. `fetch-icons.ts` writes the same manifest as part of a scrape; this
 * script is the standalone re-emit path — useful after a manual icon swap or
 * after committing icons fetched outside of `fetch-icons.ts`.
 *
 * Catalog order (from `public/data/<gameId>/<category>.json`) is preserved
 * when the matching data file exists; otherwise entries fall back to
 * filesystem (sorted) order. This keeps the output identical to what
 * `fetch-icons.ts` would have written for the same set of files.
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

function buildManifestForGame(
  gameId: string,
  gameDir: string
): Record<string, Record<string, string>> | null {
  const manifest: Record<string, Record<string, string>> = {};
  let any = false;
  for (const cat of CATEGORIES) {
    const dir = join(gameDir, cat);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(name => {
      const full = join(dir, name);
      try {
        return statSync(full).isFile() && !name.startsWith('.');
      } catch {
        return false;
      }
    });
    if (files.length === 0) continue;

    const fileById = new Map<string, string>();
    for (const filename of files) {
      fileById.set(parse(filename).name, filename);
    }

    const cat_map: Record<string, string> = {};
    const catalogIds = readCatalogIds(gameId, cat);
    const orderedIds = catalogIds
      ? [
          ...catalogIds.filter(id => fileById.has(id)),
          // any orphans on disk not in catalog: sorted alpha for determinism
          ...[...fileById.keys()].filter(id => !catalogIds.includes(id)).sort(),
        ]
      : [...fileById.keys()].sort();

    for (const id of orderedIds) {
      cat_map[id] = fileById.get(id)!;
    }
    manifest[cat] = cat_map;
    any = true;
  }
  return any ? manifest : null;
}

function main() {
  if (!existsSync(ICONS_ROOT)) {
    console.error(`No icons directory at ${ICONS_ROOT}`);
    process.exit(1);
  }
  const gameDirs = readdirSync(ICONS_ROOT).filter(name => {
    const full = join(ICONS_ROOT, name);
    return statSync(full).isDirectory();
  });

  let written = 0;
  for (const game of gameDirs) {
    const gameDir = join(ICONS_ROOT, game);
    const manifest = buildManifestForGame(game, gameDir);
    if (!manifest) {
      console.log(`skip   ${game} (no icons)`);
      continue;
    }
    const out = join(gameDir, 'manifest.json');
    writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
    const counts = Object.entries(manifest)
      .map(([c, m]) => `${c}:${Object.keys(m).length}`)
      .join('  ');
    console.log(`wrote  ${out}  (${counts})`);
    written++;
  }

  if (written === 0) {
    console.log('No manifests written — public/icons/ is empty.');
  }
}

main();
