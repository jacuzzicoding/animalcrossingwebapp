// v0.9.6 spike: resolve a representative slice of ACNH missing items against
// the Fandom AC wiki. Resolution-only — does not download or commit binaries.
// Threshold per audit doc: ≥90% (a/b/c/override) on this 18-item slice.
//
// Run: npx tsx scripts/spike-acnh-icons.ts

import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import {
  resolveIcon,
  sleep,
  DELAY_MS,
  type ResolveInput,
  type ResolveResult,
} from './lib/icon-resolver.ts';
import { RENAME_OVERRIDES } from '../src/components/itemIconUtils.ts';

const GAME_ID = 'ACNH';
const DATA_DIR = 'public/data/acnh';

type Category = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
  sea_creatures: 'deep-sea creature',
};

// 18-item spike sourced from docs/v0.9.2-icon-coverage-audit.md section 2.
const SPIKE: { category: Category; id: string }[] = [
  { category: 'fish', id: 'betta' },
  { category: 'fish', id: 'golden-trout' },
  { category: 'fish', id: 'mitten-crab' },
  { category: 'fish', id: 'striped-marlin' },
  { category: 'fish', id: 'barreleye' },
  { category: 'bugs', id: 'paper-kite-butterfly' },
  { category: 'bugs', id: 'man-faced-stink-bug' },
  { category: 'bugs', id: 'giant-stag' },
  { category: 'bugs', id: 'horned-hercules' },
  { category: 'bugs', id: 'hermit-crab' },
  { category: 'fossils', id: 'ankylo-skull' },
  { category: 'fossils', id: 'left-megalo-side' },
  { category: 'fossils', id: 'coelacanth' },
  { category: 'art', id: 'informative-statue' },
  { category: 'art', id: 'sinking-painting' },
  { category: 'sea_creatures', id: 'umbrella-octopus' },
  { category: 'sea_creatures', id: 'gigas-giant-clam' },
  { category: 'sea_creatures', id: 'vampire-squid' },
];

type RawItem = { id: string; name: string };

function loadInput(target: { category: Category; id: string }): ResolveInput {
  const raw = readFileSync(
    resolvePath(DATA_DIR, `${target.category}.json`),
    'utf8'
  );
  const items = JSON.parse(raw) as RawItem[];
  const item = items.find(i => i.id === target.id);
  if (!item) throw new Error(`${target.category}/${target.id} not in catalog`);
  return {
    gameId: GAME_ID,
    category: target.category,
    id: item.id,
    name: item.name,
    disambig: DISAMBIG[target.category],
  };
}

function urlFilename(url: string | null): string {
  if (!url) return '-';
  const m = url.match(/\/images\/[^/]+\/[^/]+\/([^/]+)\/revision\//);
  return m?.[1] ?? url;
}

(async () => {
  const rows: { item: ResolveInput; canonicalId: string; r: ResolveResult }[] =
    [];
  for (const t of SPIKE) {
    const item = loadInput(t);
    const r = await resolveIcon(item);
    const canonicalId = RENAME_OVERRIDES[item.id] ?? item.id;
    rows.push({ item, canonicalId, r });
    const tag = r.found ? (r.via === 'd:html' ? 'HTML' : 'OK  ') : 'MISS';
    const idDisp =
      item.id === canonicalId ? item.id : `${item.id} → ${canonicalId}`;
    console.log(
      `${tag}  ${item.category.padEnd(14)}  ${idDisp.padEnd(34)}  name="${item.name}"`
    );
    console.log(
      `        via=${r.via.padEnd(11)}  title="${r.titleResolved ?? '-'}"`
    );
    console.log(`        file=${urlFilename(r.imageUrl)}`);
    for (const n of r.notes) console.log(`        note: ${n}`);
    await sleep(DELAY_MS);
  }

  const hits = rows.filter(r => r.r.found && r.r.via !== 'd:html').length;
  const html = rows.filter(r => r.r.found && r.r.via === 'd:html').length;
  const miss = rows.filter(r => !r.r.found).length;
  const pct = ((hits / rows.length) * 100).toFixed(1);
  console.log(`\n=== Spike summary ===`);
  console.log(`Total:    ${rows.length}`);
  console.log(`First-pass hits (a/b/c/override): ${hits}  (${pct}%)`);
  console.log(`HTML-fallback hits (d:html):      ${html}`);
  console.log(`Misses:                            ${miss}`);
})();
