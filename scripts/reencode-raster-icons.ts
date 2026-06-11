/**
 * reencode-raster-icons.ts
 *
 * One-off, idempotent downsampler for the raw wiki-scraped *raster* icons that
 * live directly under `public/icons/<category>/` as `.jpg` files (unlike the
 * hand-drawn pieces, these have no 2048 PNG source in `icon-sources/`, so the
 * `export-icons.ts` pipeline does not touch them).
 *
 * Several of these — notably the ACNH art scans — shipped at full wiki
 * resolution (e.g. `art/informative-statue.jpg` at 3.8 MB / 3665×4288) but are
 * only ever rendered into 48–192px slots. Decoding a ~20-megapixel JPEG to
 * paint a 48px thumbnail is real jank + memory pressure on phones.
 *
 * This script re-encodes them in place, capped at MAX_EDGE px on the long edge
 * with `fit: 'inside'` (never upscales), mozjpeg quality 80. Filenames and
 * extensions are unchanged, so `public/icons/manifest.json` (which stores the
 * extension as the value) stays valid and no app code changes.
 *
 * Idempotent: an image already within MAX_EDGE on both edges is skipped, so
 * re-running is a no-op.
 *
 * Run: `npm run icons:reencode [-- --dry-run]`
 * This script is NOT run in CI; Vercel builds use the committed assets.
 */
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const ICONS_ROOT = join(ROOT, 'public', 'icons');
// Render targets top out at 192px (expand-panel hero); 384 covers that at 2× DPR.
const MAX_EDGE = 384;
const JPEG_QUALITY = 80;
// Categories whose raster scans are oversized. Scoped deliberately — bugs/fish
// raster scans are already small. Re-run with more categories if that changes.
const CATEGORIES = ['art', 'fossils'];

const DRY_RUN = process.argv.includes('--dry-run');

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function processOne(
  category: string,
  filename: string
): Promise<{ srcBytes: number; outBytes: number; status: string }> {
  const path = join(ICONS_ROOT, category, filename);
  const srcBytes = statSync(path).size;
  const meta = await sharp(path).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  if (w <= MAX_EDGE && h <= MAX_EDGE) {
    return { srcBytes, outBytes: srcBytes, status: 'skipped' };
  }

  const out = await sharp(path)
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  if (!DRY_RUN) writeFileSync(path, out);
  return { srcBytes, outBytes: out.length, status: DRY_RUN ? 'dry' : 'wrote' };
}

async function main() {
  console.log(
    `${DRY_RUN ? '[dry-run] ' : ''}re-encoding raster icons in public/icons/ (cap ${MAX_EDGE}px, q${JPEG_QUALITY})`
  );
  let totalSrc = 0;
  let totalOut = 0;
  let processed = 0;
  for (const category of CATEGORIES) {
    const dir = join(ICONS_ROOT, category);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.jpg'))
      .sort();
    for (const file of files) {
      const r = await processOne(category, file);
      if (r.status === 'skipped') continue;
      processed += 1;
      totalSrc += r.srcBytes;
      totalOut += r.outBytes;
      const tag = r.status === 'wrote' ? '✓' : '·';
      console.log(
        `  ${tag} ${category}/${file}  ${fmtBytes(r.srcBytes)} → ${fmtBytes(r.outBytes)}`
      );
    }
  }
  console.log('');
  console.log(
    `${processed} re-encoded. Total ${fmtBytes(totalSrc)} → ${fmtBytes(totalOut)}` +
      (totalSrc
        ? ` (${(100 - (totalOut / totalSrc) * 100).toFixed(1)}% smaller)`
        : '')
  );
  if (DRY_RUN) console.log('(dry-run — no files written)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
