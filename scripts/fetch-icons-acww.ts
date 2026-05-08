// Fetch ACWW item icons from the Fandom AC wiki.
//
// Processes only the 84 items currently missing from the flat icon manifest.
// Writes to public/icons/<category>/<canonicalId>.<ext> (flat, cross-game layout).
// Canonical ids come from RENAME_OVERRIDES in itemIconUtils — the same mapping
// the audit and runtime use — so the manifest lookup will match.
// Does NOT wipe existing icons — add-only.
// After a successful run: npm run icons:manifest  to regenerate manifest.json.
//
// Run: npx tsx scripts/fetch-icons-acww.ts

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

const GAME_ID = 'ACWW';
const DATA_DIR = 'public/data/acww';
const ICON_DIR = 'public/icons';
const MISSING_LOG = 'scripts/missing-acww.txt';
const AUDIT_FRACTION = 0.05;

type Category = 'fish' | 'bugs' | 'fossils' | 'art';

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
};

// The 84 item ids currently uncovered in the manifest for ACWW.
// These are the raw ids from public/data/acww/<category>.json.
// Full ACWW missing-id list (84 items as of v0.9.3-beta audit).
// All items are now covered. This list is preserved for re-run documentation;
// to re-scrape everything, restore it in full and run npx tsx scripts/fetch-icons-acww.ts.
const MISSING_IDS: Record<Category, string[]> = {
  fish: [
    'yellow-perch', 'black-bass', 'char', 'king-salmon', 'dorado', 'gar',
    'sea-butterfly', 'seahorse', 'clownfish', 'zebra-turkeyfish', 'puffer-fish',
    'horse-mackerel', 'dab', 'olive-flounder', 'octopus', 'football-fish',
    'tuna', 'blue-marlin', 'ocean-sunfish', 'hammerhead-shark', 'shark',
  ],
  bugs: [
    'yellow-butterfly', 'tiger-butterfly', 'peacock-butterfly', 'monarch-butterfly',
    'emperor-butterfly', 'agrias-butterfly', 'birdwing-butterfly', 'moth',
    'oak-silk-moth', 'honeybee', 'orchid-mantis', 'lantern-fly', 'walkingstick',
    'fruit-beetle', 'scarab-beetle', 'dung-beetle', 'goliath-beetle', 'stag-beetle',
    'rainbow-stag', 'atlas-beetle', 'elephant-beetle', 'hercules-beetle',
    'flea', 'pillbug', 'fly', 'tarantula', 'scorpion',
  ],
  fossils: [
    'ankylosaur-skull', 'ankylosaur-torso', 'ankylosaur-tail',
    'dimetrodon-skull', 'dimetrodon-torso', 'dimetrodon-tail',
    'iguanodon-skull', 'iguanodon-torso', 'iguanodon-tail',
    'sabretooth-skull', 'sabretooth-torso',
    'pachycephalosaur-skull', 'pachycephalosaur-torso', 'pachycephalosaur-tail',
    'parasaur-skull', 'parasaur-torso', 'parasaur-tail',
    'seismosaur-skull', 'seismosaur-chest', 'seismosaur-hip', 'seismosaur-tail',
    'pteranodon-body',
    'dino-droppings', 'fern-fossil', 'archaeopteryx', 'peking-man', 'shark-tooth',
  ],
  art: [
    'fine-painting', 'lovely-painting', 'nice-painting', 'opulent-painting',
    'perfect-painting', 'rare-painting', 'solemn-painting', 'strange-painting',
    'warm-painting',
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
        !/^(nh|sh|gcn|ww|cf|nl|the|new|horizons|fossil|fish|bug|painting|sculpture|by|of|and|a)$/.test(t)
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
  const CATEGORIES: Category[] = ['fish', 'bugs', 'fossils', 'art'];
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
      const tag = status === 'hit' ? 'OK  ' : status === 'miss-html' ? 'SKIP' : 'MISS';
      const idDisplay = item.id === canonicalId ? item.id : `${item.id} → ${canonicalId}`;
      console.log(`${tag}  ${idDisplay.padEnd(46)}  via=${r.via.padEnd(11)}  ${r.titleResolved ?? '-'}`);
      for (const n of r.notes) console.log(`      note: ${n}`);
      await sleep(DELAY_MS);
    }
  }

  // Download hits — save under the canonical id.
  console.log('\n=== Download phase ===');
  let bytesTotal = 0;
  for (const row of rows) {
    if (row.status !== 'hit') continue;
    const fn = urlFilename(row.result.imageUrl!);
    const ext = (fn.match(/\.(png|jpe?g)$/i)?.[1] ?? 'png').toLowerCase();
    const filename = `${row.canonicalId}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const dest = resolvePath(ICON_DIR, row.item.category, filename);
    try {
      const bytes = await downloadBinary(row.result.imageUrl!, dest);
      bytesTotal += bytes;
      console.log(`  ${row.item.id} → ${filename} (${bytes} bytes)`);
      await sleep(DELAY_MS);
    } catch (e: any) {
      console.log(`  download failed for ${row.item.id}: ${(e as Error).message}`);
      row.status = 'miss';
    }
  }

  // Sample audit.
  const hits = rows.filter(r => r.status === 'hit');
  const sampleSize = Math.max(1, Math.round(hits.length * AUDIT_FRACTION));
  const shuffled = [...hits].sort(() => Math.random() - 0.5);
  const audit = shuffled.slice(0, sampleSize);
  console.log(`\n=== Audit (${audit.length} of ${hits.length} hits) ===`);
  const auditFails: string[] = [];
  for (const row of audit) {
    const verdict = auditPlausible(row.item, row.result);
    const tag = verdict.ok ? 'OK  ' : 'FAIL';
    console.log(
      `${tag}  ${row.item.category}/${row.item.id} → "${row.result.titleResolved}"  ${urlFilename(row.result.imageUrl!)}`
    );
    if (!verdict.ok) auditFails.push(`${row.item.category}/${row.item.id}: ${verdict.reason}`);
  }

  // Missing log.
  const misses = rows.filter(r => r.status !== 'hit');
  if (misses.length) {
    const lines = misses.map(
      r =>
        `${r.item.category}/${r.item.id}\tvia=${r.result.via}\tname="${r.item.name}"\tnotes=${r.result.notes.join(' ; ')}`
    );
    writeFileSync(MISSING_LOG, lines.join('\n') + '\n');
    console.log(`\n=== Misses: ${misses.length} (logged to ${MISSING_LOG}) ===`);
    for (const r of misses) {
      console.log(`  MISS  ${r.item.category}/${r.item.id}  name="${r.item.name}"`);
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
  console.log(`Audit:         ${audit.length} sampled, ${auditFails.length} fail`);

  if (auditFails.length) {
    console.log('\nAudit failures:');
    for (const f of auditFails) console.log(`  - ${f}`);
    process.exit(2);
  }
  if (misses.length) process.exit(1);
  process.exit(0);
})();
