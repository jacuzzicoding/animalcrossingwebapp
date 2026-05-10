// Fetch ACNL item icons from the Fandom AC wiki.
//
// Processes only the 145 items currently missing from the flat icon manifest.
// Writes to public/icons/<category>/<canonicalId>.<ext> (flat, cross-game layout).
// Canonical ids come from RENAME_OVERRIDES in itemIconUtils — the same mapping
// the audit and runtime use — so the manifest lookup will match.
// Does NOT wipe existing icons — add-only.
// After a successful run: npm run icons:manifest  to regenerate manifest.json.
//
// Run: npx tsx scripts/fetch-icons-acnl.ts

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import {
  resolveIcon,
  sleep,
  DELAY_MS,
  UA,
  type ResolveInput,
  type ResolveResult,
} from './lib/icon-resolver.ts';
import { RENAME_OVERRIDES } from '../src/components/itemIconUtils.ts';

const GAME_ID = 'ACNL';
const DATA_DIR = 'public/data/acnl';
const ICON_DIR = 'public/icons';
const MISSING_LOG = 'scripts/missing-acnl.txt';
const AUDIT_FRACTION = 0.05;

type Category = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
  // Fandom disambiguates ACNL/ACNH sea creatures with "(deep-sea creature)";
  // see resolver comment for context.
  sea_creatures: 'deep-sea creature',
};

// 145 ACNL ids uncovered in the flat manifest as of v0.9.4-beta.
// Sourced from npm run audit:icons + scripts/dry-run-acnl-icons.ts.
const MISSING_IDS: Record<Category, string[]> = {
  fish: [
    'tadpole',
    'neon-tetra',
    'nibble-fish',
    'saddled-bichir',
    'soft-shelled-turtle',
    'snapping-turtle',
    'tilapia',
    'pike',
    'sturgeon',
    'sea-horse',
    'surgeonfish',
    'butterfly-fish',
    'napoleonfish',
    'blowfish',
    'anchovy',
    'moray-eel',
    'ray',
    'great-white-shark',
    'whale-shark',
    'saw-shark',
    'oarfish',
    'giant-trevally',
    'mahi-mahi',
  ],
  bugs: [
    'common-bluebottle',
    'great-purple-emperor',
    'rajah-brooke-birdwing',
    'queen-alexandra-birdwing',
    'atlas-moth',
    'madagascan-sunset-moth',
    'rice-grasshopper',
    'walking-stick',
    'walking-leaf',
    'wasp',
    'giant-cicada',
    'cicada-shell',
    'petaltail-dragonfly',
    'diving-beetle',
    'giant-water-bug',
    'stinkbug',
    'man-faced-stinkbug',
    'tiger-beetle',
    'violin-beetle',
    'citrus-longhorn-beetle',
    'miyama-stag-beetle',
    'giant-stag-beetle',
    'rainbow-stag-beetle',
    'cyclommatus-stag-beetle',
    'golden-stag-beetle',
    'giraffe-stag-beetle',
    'earth-boring-dung-beetle',
    'centipede',
  ],
  fossils: [
    'brachiosaurus-skull',
    'brachiosaurus-neck',
    'brachiosaurus-torso',
    'brachiosaurus-tail',
    'diplodocus-skull',
    'diplodocus-neck',
    'diplodocus-torso',
    'diplodocus-tail',
    'spinosaurus-skull',
    'spinosaurus-torso',
    'spinosaurus-tail',
    'parasaurolophus-skull',
    'parasaurolophus-torso',
    'parasaurolophus-tail',
    'ichthyosaurus-skull',
    'ichthyosaurus-torso',
    'ichthyosaurus-tail',
    'pterodactyl-skull',
    'pterodactyl-left-wing',
    'pterodactyl-right-wing',
    'megacero-skull',
    'megacero-torso',
    'megacero-tail',
    'archelon-skull',
    'archelon-tail',
    'quetzalcoatlus-skull',
    'quetzalcoatlus-left-wing',
    'quetzalcoatlus-right-wing',
    'deinony-skull',
    'deinony-torso',
    'deinony-tail',
    'dinopithecus-skull',
    'dinopithecus-torso',
    'dinopithecus-tail',
    'anomalocaris',
    'australopith',
    'dunkleosteus',
    'eusthenopteron',
    'juramaia',
    'myllokunmingia',
    'opabinia',
  ],
  art: [
    'ancient-statue',
    'beautiful-statue',
    'dynamic-painting',
    'gallant-statue',
    'graceful-painting',
    'jolly-painting',
    'moody-painting',
    'mystic-statue',
    'neutral-painting',
    'proper-painting',
    'robust-statue',
    'scenic-painting',
    'serene-painting',
    'tremendous-statue',
    'valiant-statue',
    'wild-painting-left-half',
    'wild-painting-right-half',
    'wistful-painting',
  ],
  sea_creatures: [
    'sea-star',
    'sea-anemone',
    'sea-slug',
    'octopus',
    'pearl-oyster',
    'scallop',
    'clam',
    'whelk',
    'mantis-shrimp',
    'lobster',
    'oyster',
    'turban-shell',
    'abalone',
    'mussel',
    'sea-urchin',
    'sea-cucumber',
    'sea-grapes',
    'sea-pineapple',
    'nautilus',
    'firefly-squid',
    'tiger-prawn',
    'sakura-shrimp',
    'snow-crab',
    'red-king-crab',
    'dungeness-crab',
    'spiny-lobster',
    'horseshoe-crab',
    'giant-isopod',
    'moon-jellyfish',
    'blue-jellyfish',
    'sea-angel',
    'venus-flower-basket',
    'flatworm',
    'spotted-garden-eel',
    'acorn-barnacle',
  ],
};

type RawItem = { id: string; name: string };

function loadTargets(cat: Category): ResolveInput[] {
  const raw = readFileSync(resolvePath(DATA_DIR, `${cat}.json`), 'utf8');
  const items = JSON.parse(raw) as RawItem[];
  const targetSet = new Set(MISSING_IDS[cat]);
  return items
    .filter(it => targetSet.has(it.id))
    .map(it => ({
      gameId: GAME_ID,
      category: cat,
      id: it.id,
      name: it.name,
      disambig: DISAMBIG[cat],
    }));
}

async function downloadBinary(url: string, dest: string): Promise<number> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.byteLength;
}

function urlFilename(url: string): string {
  const m = url.match(/\/images\/[^/]+\/[^/]+\/([^/]+)\/revision\//);
  return m?.[1] ?? '';
}

function tokensOf(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(
      t =>
        t &&
        t.length >= 3 &&
        !/^(nh|sh|gcn|ww|cf|nl|the|new|horizons|fossil|fish|bug|painting|sculpture|by|of|and|a)$/.test(
          t
        )
    );
}

function auditPlausible(
  item: ResolveInput,
  r: ResolveResult
): { ok: boolean; reason?: string } {
  if (r.via === 'override') return { ok: true };
  const itemTokens = tokensOf(item.name);
  if (itemTokens.length === 0) return { ok: true };
  const titleTokens = new Set(tokensOf(r.titleResolved ?? ''));
  const fileTokens = new Set(tokensOf(urlFilename(r.imageUrl ?? '')));
  const hit = itemTokens.find(t => titleTokens.has(t) || fileTokens.has(t));
  if (hit) return { ok: true };
  return {
    ok: false,
    reason: `no shared token: item="${item.name}" title="${r.titleResolved}" file="${urlFilename(r.imageUrl ?? '')}"`,
  };
}

(async () => {
  const CATEGORIES: Category[] = [
    'fish',
    'bugs',
    'fossils',
    'art',
    'sea_creatures',
  ];
  for (const cat of CATEGORIES) {
    mkdirSync(resolvePath(ICON_DIR, cat), { recursive: true });
  }

  type Row = {
    item: ResolveInput;
    result: ResolveResult;
    canonicalId: string;
    status: 'hit' | 'miss-html' | 'miss';
  };
  const rows: Row[] = [];

  for (const cat of CATEGORIES) {
    const items = loadTargets(cat);
    console.log(`\n=== ${cat} (${items.length} targets) ===`);
    for (const item of items) {
      const r = await resolveIcon(item);
      const canonicalId = RENAME_OVERRIDES[item.id] ?? item.id;
      let status: Row['status'] = 'miss';
      if (r.found && r.via === 'd:html') status = 'miss-html';
      else if (r.found) status = 'hit';
      rows.push({ item, result: r, canonicalId, status });
      const tag =
        status === 'hit' ? 'OK  ' : status === 'miss-html' ? 'HTML' : 'MISS';
      const idDisplay =
        item.id === canonicalId ? item.id : `${item.id} → ${canonicalId}`;
      console.log(
        `${tag}  ${idDisplay.padEnd(46)}  via=${r.via.padEnd(11)}  ${r.titleResolved ?? '-'}`
      );
      for (const n of r.notes) console.log(`      note: ${n}`);
      await sleep(DELAY_MS);
    }
  }

  // Download phase — both a:bare/b:disambig/c:search/override and d:html hits
  // produce real CDN URLs we can pull. Stream errors per-item; one 4xx/5xx
  // doesn't abort the run.
  console.log('\n=== Download phase ===');
  let bytesTotal = 0;
  for (const row of rows) {
    if (row.status === 'miss') continue;
    const url = row.result.imageUrl!;
    const fn = urlFilename(url);
    const ext = (fn.match(/\.(png|jpe?g)$/i)?.[1] ?? 'png').toLowerCase();
    const filename = `${row.canonicalId}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const dest = resolvePath(ICON_DIR, row.item.category, filename);
    try {
      const bytes = await downloadBinary(url, dest);
      bytesTotal += bytes;
      console.log(`  ${row.item.id} → ${filename} (${bytes} bytes)`);
      await sleep(DELAY_MS);
    } catch (e) {
      console.log(
        `  download failed for ${row.item.id}: ${(e as Error).message}`
      );
      row.status = 'miss';
    }
  }

  // Sample audit — focus on the riskier chain steps (c:search, d:html).
  const hits = rows.filter(r => r.status !== 'miss');
  const risky = hits.filter(
    r => r.result.via === 'c:search' || r.result.via === 'd:html'
  );
  const sampleSize = Math.max(1, Math.round(hits.length * AUDIT_FRACTION));
  const shuffled = [...risky].sort(() => Math.random() - 0.5);
  const audit = shuffled.slice(0, Math.max(sampleSize, Math.min(risky.length, 4)));
  console.log(
    `\n=== Audit (${audit.length} of ${risky.length} risky-chain hits, ${hits.length} total) ===`
  );
  const auditFails: string[] = [];
  for (const row of audit) {
    const verdict = auditPlausible(row.item, row.result);
    const tag = verdict.ok ? 'OK  ' : 'FAIL';
    console.log(
      `${tag}  ${row.item.category}/${row.item.id} via=${row.result.via} → "${row.result.titleResolved}"  ${urlFilename(row.result.imageUrl!)}`
    );
    if (!verdict.ok)
      auditFails.push(`${row.item.category}/${row.item.id}: ${verdict.reason}`);
  }

  // Missing log.
  const misses = rows.filter(r => r.status === 'miss');
  if (misses.length) {
    const lines = misses.map(
      r =>
        `${r.item.category}/${r.item.id}\tvia=${r.result.via}\tname="${r.item.name}"\tnotes=${r.result.notes.join(' ; ')}`
    );
    writeFileSync(MISSING_LOG, lines.join('\n') + '\n');
    console.log(
      `\n=== Misses: ${misses.length} (logged to ${MISSING_LOG}) ===`
    );
    for (const r of misses) {
      console.log(
        `  MISS  ${r.item.category}/${r.item.id}  name="${r.item.name}"`
      );
    }
  } else {
    if (existsSync(MISSING_LOG)) writeFileSync(MISSING_LOG, '');
  }

  const totalMB = (bytesTotal / 1024 / 1024).toFixed(2);
  console.log(`\n=== Summary ===`);
  console.log(`Targets:       ${rows.length}`);
  console.log(`Downloaded:    ${hits.length}`);
  console.log(`Missing:       ${misses.length}`);
  console.log(`Bytes on disk: ${bytesTotal} (${totalMB} MB)`);
  console.log(
    `Audit:         ${audit.length} sampled, ${auditFails.length} fail`
  );

  if (auditFails.length) {
    console.log('\nAudit failures:');
    for (const f of auditFails) console.log(`  - ${f}`);
    process.exit(2);
  }
})();
