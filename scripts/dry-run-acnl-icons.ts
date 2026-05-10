// v0.9.5 dry-run: resolves every ACNL item missing from the flat manifest
// against the Fandom AC wiki. Resolution-only — does NOT download binaries.
// Writes a tab-delimited report to scripts/resolve-report-acnl.txt for
// human eyeballing before the actual fetch run.
//
// Run: npx tsx scripts/dry-run-acnl-icons.ts

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve as resolvePath } from 'node:path';
import {
  resolveIcon,
  sleep,
  DELAY_MS,
  type ResolveInput,
  type ResolveResult,
} from './lib/icon-resolver.ts';
import { RENAME_OVERRIDES } from '../src/components/itemIconUtils.ts';

const GAME_ID = 'ACNL';
const DATA_DIR = 'public/data/acnl';
const ICONS_ROOT = 'public/icons';
const REPORT_PATH = 'scripts/resolve-report-acnl.txt';

type Category = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';
const CATEGORIES: Category[] = ['fish', 'bugs', 'fossils', 'art', 'sea_creatures'];

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
  // 2026-05-10 (v0.9.5): Fandom disambiguates ACNL/ACNH sea creatures with the
  // "(deep-sea creature)" suffix where they share a name with another category
  // (octopus, pearl oyster, lobster). Adding this as a step-(b) disambig lands
  // the parent article instead of the /Gallery subpage and pre-empts a
  // wrong-content hit on Lobster (fish).
  sea_creatures: 'deep-sea creature',
};

type RawItem = { id: string; name: string };

function loadManifest(): Record<string, Record<string, string>> {
  const p = join(ICONS_ROOT, 'manifest.json');
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function readCatalog(cat: Category): RawItem[] {
  const p = resolvePath(DATA_DIR, `${cat}.json`);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf-8')) as RawItem[];
}

function buildMissing(): { cat: Category; item: RawItem; canonicalId: string }[] {
  const manifest = loadManifest();
  const out: { cat: Category; item: RawItem; canonicalId: string }[] = [];
  for (const cat of CATEGORIES) {
    const cov = manifest[cat] ?? {};
    for (const item of readCatalog(cat)) {
      const canonicalId = RENAME_OVERRIDES[item.id] ?? item.id;
      if (!cov[canonicalId]) out.push({ cat, item, canonicalId });
    }
  }
  return out;
}

function urlFilename(url: string | null): string {
  if (!url) return '-';
  const m = url.match(/\/images\/[^/]+\/[^/]+\/([^/]+)\/revision\//);
  return m?.[1] ?? url;
}

function flagSuspicious(
  item: RawItem,
  canonicalId: string,
  r: ResolveResult
): string[] {
  const flags: string[] = [];
  if (!r.found) {
    flags.push('UNRESOLVED');
    return flags;
  }
  if (r.via === 'd:html') flags.push('html-fallback');
  const title = (r.titleResolved ?? '').toLowerCase();
  if (title.includes('/gallery')) flags.push('gallery-subpage');
  if (title.endsWith('/model') || title.includes('/model'))
    flags.push('model-subpage');
  // Token sanity: at least one >=4-char token from the in-game name should
  // appear in the resolved title or filename. Skip overrides — those are
  // intentionally curated.
  if (r.via !== 'override') {
    const nameTokens = item.name
      .toLowerCase()
      .split(/[\s'-]+/)
      .filter(t => t.length >= 4);
    const haystack =
      title + ' ' + urlFilename(r.imageUrl).toLowerCase().replace(/[._-]/g, ' ');
    if (nameTokens.length && !nameTokens.some(t => haystack.includes(t))) {
      flags.push('no-shared-token');
    }
  }
  return flags;
}

(async () => {
  const targets = buildMissing();
  console.log(`Resolving ${targets.length} ACNL targets...\n`);

  const lines: string[] = [];
  lines.push(
    [
      'category',
      'id',
      'canonicalId',
      'in-game-name',
      'via',
      'resolved-title',
      'image-filename',
      'flags',
    ].join('\t')
  );

  let resolvedCount = 0;
  let overrideCount = 0;
  let unresolvedCount = 0;
  const flagged: string[] = [];

  for (const { cat, item, canonicalId } of targets) {
    const input: ResolveInput = {
      gameId: GAME_ID,
      category: cat,
      id: item.id,
      name: item.name,
      disambig: DISAMBIG[cat],
    };
    let r: ResolveResult;
    try {
      r = await resolveIcon(input);
    } catch (e) {
      r = {
        found: false,
        via: 'none',
        titleResolved: null,
        imageUrl: null,
        notes: [`error: ${(e as Error).message}`],
      };
    }
    const flags = flagSuspicious(item, canonicalId, r);
    if (r.found) resolvedCount++;
    else unresolvedCount++;
    if (r.via === 'override') overrideCount++;

    const line = [
      cat,
      item.id,
      canonicalId,
      item.name,
      r.via,
      r.titleResolved ?? '-',
      urlFilename(r.imageUrl),
      flags.join(',') || '-',
    ].join('\t');
    lines.push(line);

    const tag = !r.found
      ? 'MISS'
      : flags.length
        ? 'FLAG'
        : r.via === 'override'
          ? 'OVR '
          : 'OK  ';
    console.log(
      `${tag}  ${cat.padEnd(14)}  ${item.id.padEnd(34)}  via=${r.via.padEnd(11)}  ${r.titleResolved ?? '-'}${flags.length ? '  [' + flags.join(',') + ']' : ''}`
    );
    if (flags.length || !r.found) flagged.push(line);

    await sleep(DELAY_MS);
  }

  writeFileSync(REPORT_PATH, lines.join('\n') + '\n');

  console.log(`\n=== Dry-run summary ===`);
  console.log(`Total targets:       ${targets.length}`);
  console.log(`Resolved:            ${resolvedCount}`);
  console.log(`  via override:      ${overrideCount}`);
  console.log(`Unresolved:          ${unresolvedCount}`);
  console.log(`Flagged for review:  ${flagged.length}`);
  console.log(`\nReport written to ${REPORT_PATH}`);
})();
