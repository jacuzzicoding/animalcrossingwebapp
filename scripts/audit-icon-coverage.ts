/**
 * audit-icon-coverage.ts
 *
 * For each per-game data catalog (`public/data/<gameId>/<category>.json`),
 * applies the rename-overrides map and reports which ids are covered by the
 * flat icon manifest (`public/icons/manifest.json`) and which are not. The
 * uncovered list per game drives "what to draw next" scoping for v0.9.4+
 * gap-fill releases.
 *
 * Output: `docs/v0.9.2-icon-coverage-audit.md`.
 *
 * Run: `npm run audit:icons`
 */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { RENAME_OVERRIDES } from '../src/components/itemIconUtils';

const ROOT = process.cwd();
const ICONS_ROOT = join(ROOT, 'public', 'icons');
const DATA_ROOT = join(ROOT, 'public', 'data');
const CATEGORIES = ['fish', 'bugs', 'fossils', 'art', 'sea_creatures'] as const;
const OUT_PATH = join(ROOT, 'docs', 'v0.9.2-icon-coverage-audit.md');

type Manifest = Partial<Record<string, Record<string, string>>>;

function loadManifest(): Manifest {
  const path = join(ICONS_ROOT, 'manifest.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function listGameDirs(): string[] {
  if (!existsSync(DATA_ROOT)) return [];
  return readdirSync(DATA_ROOT)
    .filter(name => {
      try {
        return statSync(join(DATA_ROOT, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function readCatalogIds(gameId: string, category: string): string[] {
  const path = join(DATA_ROOT, gameId, `${category}.json`);
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it: { id?: string }) => it.id)
      .filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

function canonicalize(id: string): string {
  return RENAME_OVERRIDES[id] ?? id;
}

type GameReport = {
  gameId: string;
  total: number;
  covered: number;
  uncovered: { category: string; id: string; canonicalId: string }[];
};

function auditGame(gameId: string, manifest: Manifest): GameReport {
  let total = 0;
  let covered = 0;
  const uncovered: GameReport['uncovered'] = [];
  for (const cat of CATEGORIES) {
    const ids = readCatalogIds(gameId, cat);
    for (const id of ids) {
      total++;
      const canonicalId = canonicalize(id);
      if (manifest[cat]?.[canonicalId]) {
        covered++;
      } else {
        uncovered.push({ category: cat, id, canonicalId });
      }
    }
  }
  return { gameId, total, covered, uncovered };
}

function pct(n: number, d: number): string {
  if (d === 0) return '—';
  return `${Math.round((n / d) * 1000) / 10}%`;
}

function main() {
  const manifest = loadManifest();
  const games = listGameDirs();
  const reports = games.map(g => auditGame(g, manifest));

  const lines: string[] = [];
  lines.push('# Icon Coverage Audit — v0.9.2');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(
    'Per-game gap report against the flat manifest at `public/icons/manifest.json`. Catalog ids are canonicalized through `RENAME_OVERRIDES` before lookup. The uncovered list per game is the input to scoping for v0.9.4-v0.9.7 gap-fill releases.'
  );
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Game | Catalog | Covered | Uncovered | Coverage |');
  lines.push('|------|--------:|--------:|----------:|---------:|');
  for (const r of reports) {
    lines.push(
      `| ${r.gameId.toUpperCase()} | ${r.total} | ${r.covered} | ${r.uncovered.length} | ${pct(r.covered, r.total)} |`
    );
  }
  lines.push('');

  for (const r of reports) {
    lines.push(
      `## ${r.gameId.toUpperCase()} — ${r.uncovered.length} uncovered`
    );
    lines.push('');
    if (r.uncovered.length === 0) {
      lines.push('_All catalog items covered._');
      lines.push('');
      continue;
    }
    const byCat = new Map<string, GameReport['uncovered']>();
    for (const u of r.uncovered) {
      const list = byCat.get(u.category) ?? [];
      list.push(u);
      byCat.set(u.category, list);
    }
    for (const cat of CATEGORIES) {
      const list = byCat.get(cat);
      if (!list || list.length === 0) continue;
      lines.push(`### ${cat} (${list.length})`);
      lines.push('');
      for (const u of list) {
        const note =
          u.id !== u.canonicalId ? ` _(canonical: ${u.canonicalId})_` : '';
        lines.push(`- \`${u.id}\`${note}`);
      }
      lines.push('');
    }
  }

  writeFileSync(OUT_PATH, lines.join('\n'));
  console.log(`wrote  ${OUT_PATH}`);
  for (const r of reports) {
    console.log(
      `  ${r.gameId.toUpperCase().padEnd(6)} ${String(r.covered).padStart(4)}/${String(r.total).padStart(4)}  uncovered:${String(r.uncovered.length).padStart(4)}  (${pct(r.covered, r.total)})`
    );
  }
}

main();
