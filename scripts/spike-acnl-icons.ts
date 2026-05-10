// v0.9.5 spike: resolve a representative slice of ACNL missing items against
// the Fandom AC wiki. Resolution-only — does not download or commit binaries.
// The point is to expose ACNL-specific naming quirks before committing to the
// full ~145-item scrape.
//
// Run: npx tsx scripts/spike-acnl-icons.ts

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

const GAME_ID = 'ACNL';
const DATA_DIR = 'public/data/acnl';

type Category = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
  sea_creatures: undefined,
};

// 10-item representative slice spanning every ACNL category, weighted toward
// the awkward shapes (apostrophes, hyphens, Latin truncations, body parts,
// real-world art mismatches).
const SPIKE: { category: Category; id: string }[] = [
  { category: 'fish', id: 'nibble-fish' },
  { category: 'fish', id: 'great-white-shark' },
  { category: 'bugs', id: 'rajah-brooke-birdwing' },
  { category: 'bugs', id: 'miyama-stag-beetle' },
  { category: 'fossils', id: 'parasaurolophus-skull' },
  { category: 'fossils', id: 'megacero-skull' },
  { category: 'fossils', id: 'quetzalcoatlus-left-wing' },
  { category: 'art', id: 'dynamic-painting' },
  { category: 'art', id: 'gallant-statue' },
  { category: 'sea_creatures', id: 'venus-flower-basket' },
];

type RawItem = { id: string; name: string };

function loadInput(target: { category: Category; id: string }): ResolveInput {
  const raw = readFileSync(
    resolvePath(DATA_DIR, `${target.category}.json`),
    'utf8'
  );
  const items = JSON.parse(raw) as RawItem[];
  const item = items.find(i => i.id === target.id);
  if (!item)
    throw new Error(`${target.category}/${target.id} not in catalog`);
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
  console.log(`\n=== Spike summary ===`);
  console.log(`Total:    ${rows.length}`);
  console.log(`First-pass hits (a/b/c/override): ${hits}`);
  console.log(`HTML-fallback hits (d:html):      ${html}`);
  console.log(`Misses:                            ${miss}`);
})();
