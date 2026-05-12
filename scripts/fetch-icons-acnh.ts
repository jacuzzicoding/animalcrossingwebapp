// Fetch ACNH item icons from the Fandom AC wiki.
//
// Processes only the 103 ACNH items currently missing from the flat icon
// manifest (audit: docs/v0.9.6-audit.md). Writes to
// public/icons/<category>/<canonicalId>.<ext> (flat, cross-game layout).
// Canonical ids come from RENAME_OVERRIDES in itemIconUtils.
// Does NOT wipe existing icons — add-only.
// After a successful run: npm run icons:manifest  to regenerate manifest.json.
//
// Run: npx tsx scripts/fetch-icons-acnh.ts

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

const GAME_ID = 'ACNH';
const DATA_DIR = 'public/data/acnh';
const ICON_DIR = 'public/icons';
const MISSING_LOG = 'scripts/missing-acnh.txt';
const AUDIT_FRACTION = 0.05;

type Category = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures';

const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
  sea_creatures: 'deep-sea creature',
};

// 103 ACNH ids uncovered in the flat manifest as of v0.9.5-beta.
// Sourced from `npm run audit:icons` 2026-05-12.
const MISSING_IDS: Record<Category, string[]> = {
  fish: [
    'ranchu-goldfish',
    'golden-trout',
    'mitten-crab',
    'betta',
    'rainbowfish',
    'mackerel',
    // 'striped-marlin' — genuine wiki gap (logged in KNOWN_GAPS).
    'ribbon-eel',
    'suckerfish',
    'barreleye',
  ],
  bugs: [
    'paper-kite-butterfly',
    'damselfly',
    'man-faced-stink-bug',
    'rosalia-batesi-beetle',
    'blue-weevil-beetle',
    'saw-stag',
    'miyama-stag',
    'giant-stag',
    'cyclommatus-stag',
    'golden-stag',
    'horned-dynastid',
    'horned-atlas',
    'horned-elephant',
    'horned-hercules',
    'hermit-crab',
    'wharf-roach',
    // 'palm-weevil', 'earwig' — genuine wiki gaps (logged in KNOWN_GAPS).
  ],
  fossils: [
    'acanthostega',
    'ankylo-skull',
    'ankylo-tail',
    'ankylo-torso',
    'brachio-chest',
    'brachio-pelvis',
    'brachio-skull',
    'brachio-tail',
    // 'coelacanth' — fossil shares the fish name; wiki has no fossil page and
    // the species "Coelacanth" article carries the fish asset only. Logged as
    // a genuine gap; emits monogram placeholder.
    'coprolite',
    'diplo-chest',
    'diplo-hip',
    'diplo-neck',
    'diplo-skull',
    'diplo-tail',
    'diplo-tail-tip',
    'diplo-torso',
    // elasmosaurus-* — no Fandom AC article for Elasmosaurus; genuine gap.
    // fish-fossil — no Fandom AC article; genuine gap.
    // ichthyo-* — Ichthyosaurus page exists but has no infobox image; gap.
    'left-megalo-side',
    'left-ptera-wing',
    'left-quetzal-wing',
    'ophthalmo-skull',
    'ophthalmo-torso',
    'pachy-skull',
    'pachy-tail',
    'plesio-body',
    'plesio-neck',
    'plesio-skull',
    'ptera-body',
    'quetzal-torso',
    'right-megalo-side',
    'right-ptera-wing',
    'right-quetzal-wing',
    'sabertooth-tail',
    'shark-tooth-pattern',
    // shastasaurus-* — no Fandom AC article for Shastasaurus; genuine gap.
    'silo-skull',
    'silo-tail',
    'spino-skull',
    'spino-tail',
    'spino-torso',
    'stego-skull',
    'stego-tail',
    'stego-torso',
    'styraco-skull',
    'styraco-tail',
    'styraco-torso',
    'tricera-skull',
    'tricera-tail',
    'tricera-torso',
  ],
  art: [
    'informative-statue',
    // 'renowned-statue' — genuine wiki gap (logged in KNOWN_GAPS).
    'rock-head-statue',
    'sinking-painting',
    // 'stunning-statue' — genuine wiki gap (logged in KNOWN_GAPS).
    'twinkling-painting',
    // 'nice-statue' — genuine wiki gap (logged in KNOWN_GAPS).
    'familiar-statue',
    'motherly-statue',
  ],
  sea_creatures: [
    'seaweed',
    'sea-pig',
    'slate-pencil-urchin',
    'gigas-giant-clam',
    'chambered-nautilus',
    'umbrella-octopus',
    'vampire-squid',
    'gazami-crab',
    'spider-crab',
    'sweet-shrimp',
  ],
};

// Items intentionally excluded from MISSING_IDS above — logged as known gaps
// so the missing log is honest about what we attempted vs. what was deferred.
const KNOWN_GAPS: { category: Category; id: string; reason: string }[] = [
  { category: 'fossils', id: 'coelacanth', reason: 'no Fandom AC fossil article; species page carries fish asset only' },
  { category: 'fossils', id: 'elasmosaurus-neck', reason: 'no Fandom AC article for Elasmosaurus' },
  { category: 'fossils', id: 'elasmosaurus-torso', reason: 'no Fandom AC article for Elasmosaurus' },
  { category: 'fossils', id: 'fish-fossil', reason: 'no Fandom AC article for Fish fossil' },
  { category: 'fossils', id: 'ichthyo-skull', reason: 'Ichthyosaurus page exists but has no infobox image' },
  { category: 'fossils', id: 'ichthyo-tail', reason: 'Ichthyosaurus page exists but has no infobox image' },
  { category: 'fossils', id: 'ichthyo-torso', reason: 'Ichthyosaurus page exists but has no infobox image' },
  { category: 'fossils', id: 'shastasaurus-neck', reason: 'no Fandom AC article for Shastasaurus' },
  { category: 'fossils', id: 'shastasaurus-torso', reason: 'no Fandom AC article for Shastasaurus' },
  { category: 'fish', id: 'striped-marlin', reason: 'no Fandom AC article; only Blue marlin exists' },
  { category: 'bugs', id: 'palm-weevil', reason: 'no Fandom AC article for Palm weevil' },
  { category: 'bugs', id: 'earwig', reason: 'no Fandom AC article for Earwig' },
  { category: 'art', id: 'renowned-statue', reason: 'no Fandom AC article for Renowned statue' },
  { category: 'art', id: 'stunning-statue', reason: 'no Fandom AC article for Stunning statue' },
  { category: 'art', id: 'nice-statue', reason: 'no Fandom AC article for Nice statue' },
];

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

  const hits = rows.filter(r => r.status !== 'miss');
  const risky = hits.filter(
    r =>
      r.result.via === 'c:search' ||
      r.result.via === 'd:html' ||
      r.result.via === 'a:sentence'
  );
  const sampleSize = Math.max(1, Math.round(hits.length * AUDIT_FRACTION));
  const shuffled = [...risky].sort(() => Math.random() - 0.5);
  const audit = shuffled.slice(
    0,
    Math.max(sampleSize, Math.min(risky.length, 4))
  );
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

  const misses = rows.filter(r => r.status === 'miss');
  const lines: string[] = [];
  for (const r of misses) {
    lines.push(
      `${r.item.category}/${r.item.id}\tvia=${r.result.via}\tname="${r.item.name}"\tnotes=${r.result.notes.join(' ; ')}`
    );
  }
  for (const g of KNOWN_GAPS) {
    lines.push(`${g.category}/${g.id}\tvia=known-gap\treason="${g.reason}"`);
  }
  if (lines.length) {
    writeFileSync(MISSING_LOG, lines.join('\n') + '\n');
    console.log(
      `\n=== Misses + known gaps: ${lines.length} (logged to ${MISSING_LOG}) ===`
    );
    for (const r of misses) {
      console.log(
        `  MISS  ${r.item.category}/${r.item.id}  name="${r.item.name}"`
      );
    }
    for (const g of KNOWN_GAPS) {
      console.log(`  GAP   ${g.category}/${g.id}  reason="${g.reason}"`);
    }
  } else if (existsSync(MISSING_LOG)) {
    writeFileSync(MISSING_LOG, '');
  }

  const totalMB = (bytesTotal / 1024 / 1024).toFixed(2);
  console.log(`\n=== Summary ===`);
  console.log(`Targets:       ${rows.length}`);
  console.log(`Downloaded:    ${hits.length}`);
  console.log(`Resolver miss: ${misses.length}`);
  console.log(`Known gaps:    ${KNOWN_GAPS.length}`);
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
