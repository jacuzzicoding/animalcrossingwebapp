// Fetch ACGCN item icons from the Fandom AC wiki.
//
// Pipeline:
//   1. Read public/data/acgcn/{fish,bugs,fossils,art}.json.
//   2. For each item, resolve via scripts/lib/icon-resolver.ts.
//   3. Treat HTML-fallback hits (via=d:html) the same as misses — the override
//      map is the only legitimate fallback path. Anything that lands at d:html
//      gets logged to scripts/missing.txt and excluded from the binary commit.
//   4. Download every algorithmic/override hit to public/icons/acgcn/<cat>/<id>.png.
//   5. Sample-audit ~5% of the resolved icons (random spread across categories):
//      verify the resolved page title or image filename plausibly relates to the
//      item name. Any clear mismatch halts the run.
//   6. Print a summary; exit nonzero if missing.txt is non-empty so the caller
//      knows to extend OVERRIDES before opening a PR.
//
// Run: npx tsx scripts/fetch-icons.ts

import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { resolveIcon, sleep, DELAY_MS, UA, type ResolveInput, type ResolveResult } from './lib/icon-resolver.ts';

const GAME_ID = 'ACGCN';
const DATA_DIR = 'public/data/acgcn';
const ICON_DIR = 'public/icons/acgcn';
const MISSING_LOG = 'scripts/missing.txt';
const AUDIT_FRACTION = 0.05;

type Category = 'fish' | 'bugs' | 'fossils' | 'art';
const DISAMBIG: Record<Category, string | undefined> = {
  fish: 'fish',
  bugs: 'bug',
  fossils: 'fossil',
  art: undefined,
};
const CATEGORIES: Category[] = ['fish', 'bugs', 'fossils', 'art'];

type RawItem = { id: string; name: string };

function loadCategory(cat: Category): ResolveInput[] {
  const raw = readFileSync(resolvePath(DATA_DIR, `${cat}.json`), 'utf8');
  const items = JSON.parse(raw) as RawItem[];
  return items.map((it) => ({
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
  // Wikia URL shape: .../images/x/yz/<filename>.<ext>/revision/latest?cb=...
  const m = url.match(/\/images\/[^/]+\/[^/]+\/([^/]+)\/revision\//);
  return m?.[1] ?? '';
}

function tokensOf(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t && t.length >= 3 && !/^(nh|sh|gcn|ww|cf|nl|the|new|horizons|fossil|fish|bug|painting|sculpture|by|of|and|a)$/.test(t));
}

// Audit heuristic: at least one significant token of the item name must appear
// in either the resolved page title or the image filename. Catches obvious
// cross-category resolutions (a bug item resolving to an art image, etc.).
function auditPlausible(item: ResolveInput, r: ResolveResult): { ok: boolean; reason?: string } {
  const itemTokens = tokensOf(item.name);
  if (itemTokens.length === 0) return { ok: true }; // single short word — pass
  const titleTokens = new Set(tokensOf(r.titleResolved ?? ''));
  const fileTokens = new Set(tokensOf(urlFilename(r.imageUrl ?? '')));
  const hit = itemTokens.find((t) => titleTokens.has(t) || fileTokens.has(t));
  if (hit) return { ok: true };
  // For items hit via override, trust the curated title regardless.
  if (r.via === 'override') return { ok: true };
  return {
    ok: false,
    reason: `no shared significant token between item="${item.name}" and title="${r.titleResolved}" / file="${urlFilename(r.imageUrl ?? '')}"`,
  };
}

(async () => {
  // Prep dirs; wipe any prior icon files for this game so re-runs don't leave
  // stale extensions (e.g. both <id>.png and <id>.jpg) lying around.
  for (const cat of CATEGORIES) {
    const dir = resolvePath(ICON_DIR, cat);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) {
      if (/\.(png|jpe?g)$/i.test(f)) unlinkSync(resolvePath(dir, f));
    }
  }
  const manifestPath = resolvePath(ICON_DIR, 'manifest.json');
  if (existsSync(manifestPath)) unlinkSync(manifestPath);

  type Row = { item: ResolveInput; result: ResolveResult; status: 'hit' | 'miss-html' | 'miss' };
  const rows: Row[] = [];

  for (const cat of CATEGORIES) {
    const items = loadCategory(cat);
    console.log(`\n=== ${cat} (${items.length} items) ===`);
    for (const item of items) {
      const r = await resolveIcon(item);
      let status: Row['status'] = 'miss';
      if (r.found && r.via === 'd:html') status = 'miss-html';
      else if (r.found) status = 'hit';
      rows.push({ item, result: r, status });
      const tag =
        status === 'hit' ? 'OK  '
        : status === 'miss-html' ? 'SKIP' // resolved via HTML fallback — excluded per policy
        : 'MISS';
      console.log(
        `${tag}  ${item.id.padEnd(34)}  via=${r.via.padEnd(11)}  ${r.titleResolved ?? '-'}`,
      );
      await sleep(DELAY_MS);
    }
  }

  // Download hits only — preserve source extension (mixed png/jpg/jpeg on Fandom).
  console.log('\n=== Download phase ===');
  let bytesTotal = 0;
  const manifest: Record<string, Record<string, string>> = {};
  for (const cat of CATEGORIES) manifest[cat] = {};
  for (const row of rows) {
    if (row.status !== 'hit') continue;
    const ext = (urlFilename(row.result.imageUrl!).match(/\.(png|jpe?g)$/i)?.[1] ?? 'png').toLowerCase();
    const filename = `${row.item.id}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const dest = resolvePath(ICON_DIR, row.item.category, filename);
    try {
      const bytes = await downloadBinary(row.result.imageUrl!, dest);
      bytesTotal += bytes;
      manifest[row.item.category][row.item.id] = filename;
      await sleep(DELAY_MS);
    } catch (e: any) {
      console.log(`  download failed for ${row.item.id}: ${e.message}`);
      row.status = 'miss';
    }
  }
  writeFileSync(resolvePath(ICON_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Sample audit (~5% across all hits)
  const hits = rows.filter((r) => r.status === 'hit');
  const sampleSize = Math.max(1, Math.round(hits.length * AUDIT_FRACTION));
  const shuffled = [...hits].sort(() => Math.random() - 0.5);
  const audit = shuffled.slice(0, sampleSize);
  console.log(`\n=== Audit (${audit.length} of ${hits.length} hits) ===`);
  const auditFails: string[] = [];
  for (const row of audit) {
    const verdict = auditPlausible(row.item, row.result);
    const tag = verdict.ok ? 'OK  ' : 'FAIL';
    console.log(`${tag}  ${row.item.category}/${row.item.id} → "${row.result.titleResolved}"  ${urlFilename(row.result.imageUrl!)}`);
    if (!verdict.ok) auditFails.push(`${row.item.category}/${row.item.id}: ${verdict.reason}`);
  }

  // Missing log
  const misses = rows.filter((r) => r.status !== 'hit');
  if (misses.length) {
    const lines = misses.map((r) =>
      `${r.item.category}/${r.item.id}\tvia=${r.result.via}\tname="${r.item.name}"\tnotes=${r.result.notes.join(' ; ')}`,
    );
    writeFileSync(MISSING_LOG, lines.join('\n') + '\n');
  } else {
    writeFileSync(MISSING_LOG, '');
  }

  // Summary
  const totalMB = (bytesTotal / 1024 / 1024).toFixed(2);
  console.log(`\n=== Summary ===`);
  console.log(`Items scanned:   ${rows.length}`);
  console.log(`Downloaded:      ${hits.length}`);
  console.log(`Missing:         ${misses.length}  (see ${MISSING_LOG})`);
  console.log(`Bytes on disk:   ${bytesTotal} (${totalMB} MB)`);
  console.log(`Audit:           ${audit.length} sampled, ${auditFails.length} fail`);

  if (auditFails.length) {
    console.log('\nAudit failures:');
    for (const f of auditFails) console.log(`  - ${f}`);
    process.exit(2);
  }
  if (misses.length) process.exit(1);
  process.exit(0);
})();
