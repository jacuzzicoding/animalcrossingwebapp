/**
 * export-icons.ts
 *
 * Local-only icon export pipeline. Walks 2048×2048 PNG sources committed
 * under `icon-sources/<category>/<id>.png` and writes optimized 512×512
 * deploy assets to `public/icons/<category>/<id>.png`.
 *
 * Recipe (reverse-engineered from the v0.9.2 ad-hoc optimization in commit
 * 09df4cc, which produced ~97% byte reduction on the first two hand-drawn
 * icons):
 *
 *   1. sharp.resize(512, 512, { fit: 'inside' }).png() — preserves alpha,
 *      RGBA buffer to stdin of pngquant.
 *   2. pngquant --quality=65-90 --speed=1 --strip --force - — palette
 *      quantization to 8-bit colormap PNG. Output is what gets committed.
 *
 * The 8-bit colormap signature on the existing committed sea-bass.png /
 * koi.png confirms the pngquant pass; the dimensions confirm the resize.
 *
 * Idempotence: per-file output is skipped when the destination exists and
 * its mtime is newer than the source's. Pass --force to re-export every
 * file. Pass --dry-run to compute and report sizes without writing.
 *
 * Adding a new icon:
 *   1. Paint at 2048×2048 in Procreate (or any editor), export PNG with
 *      transparency.
 *   2. Drop the file at `icon-sources/<category>/<id>.png` where <id> is
 *      the catalog id from `public/data/<gameId>/<category>.json`.
 *   3. `npm run icons:export` — emits the optimized 512 to public/icons/.
 *   4. `npm run icons:manifest` — refresh `public/icons/manifest.json`.
 *   5. Commit both the source and the deploy asset.
 *
 * This script is NOT run in CI. Vercel builds use the committed PNGs.
 *
 * Run: `npm run icons:export [-- --force | --dry-run]`
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import pngquantPath from 'pngquant-bin';

const ROOT = process.cwd();
const SOURCES_ROOT = join(ROOT, 'icon-sources');
const OUTPUT_ROOT = join(ROOT, 'public', 'icons');
const TARGET_SIZE = 512;
const PNGQUANT_ARGS = [
  '--quality=65-90',
  '--speed=1',
  '--strip',
  '--force',
  '-', // read from stdin, write to stdout
];

const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

type Result = {
  category: string;
  id: string;
  sourceBytes: number;
  outputBytes: number;
  status: 'wrote' | 'skipped' | 'dry';
};

function listCategories(): string[] {
  if (!existsSync(SOURCES_ROOT)) return [];
  return readdirSync(SOURCES_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

function listSources(category: string): string[] {
  const dir = join(SOURCES_ROOT, category);
  return readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort();
}

async function processOne(category: string, filename: string): Promise<Result> {
  const id = filename.replace(/\.png$/i, '');
  const sourcePath = join(SOURCES_ROOT, category, filename);
  const outDir = join(OUTPUT_ROOT, category);
  const outPath = join(outDir, filename);
  const sourceBytes = statSync(sourcePath).size;

  if (
    !FORCE &&
    !DRY_RUN &&
    existsSync(outPath) &&
    statSync(outPath).mtimeMs > statSync(sourcePath).mtimeMs
  ) {
    return {
      category,
      id,
      sourceBytes,
      outputBytes: statSync(outPath).size,
      status: 'skipped',
    };
  }

  const resized = await sharp(sourcePath)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'inside' })
    .png()
    .toBuffer();

  const quantized = execFileSync(pngquantPath, PNGQUANT_ARGS, {
    input: resized,
    maxBuffer: 64 * 1024 * 1024,
  });

  if (DRY_RUN) {
    return {
      category,
      id,
      sourceBytes,
      outputBytes: quantized.length,
      status: 'dry',
    };
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, quantized);
  return {
    category,
    id,
    sourceBytes,
    outputBytes: quantized.length,
    status: 'wrote',
  };
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtPct(out: number, src: number): string {
  if (src === 0) return '—';
  return `${(100 - (out / src) * 100).toFixed(1)}%`;
}

async function main() {
  if (!existsSync(SOURCES_ROOT)) {
    console.log(
      `(empty) icon-sources/ not present — nothing to export. Drop 2048×2048 PNGs at icon-sources/<category>/<id>.png and re-run.`
    );
    return;
  }

  const categories = listCategories();
  if (categories.length === 0) {
    console.log(
      `(empty) icon-sources/ has no category subdirs — nothing to export.`
    );
    return;
  }

  console.log(
    `${DRY_RUN ? '[dry-run] ' : ''}${FORCE ? '[force] ' : ''}exporting from icon-sources/ → public/icons/ (${TARGET_SIZE}×${TARGET_SIZE})`
  );

  const results: Result[] = [];
  for (const category of categories) {
    const files = listSources(category);
    for (const file of files) {
      const r = await processOne(category, file);
      results.push(r);
      const tag = r.status === 'wrote' ? '✓' : r.status === 'dry' ? '·' : '–';
      console.log(
        `  ${tag} ${category}/${r.id}  ${fmtBytes(r.sourceBytes)} → ${fmtBytes(r.outputBytes)}  (${fmtPct(r.outputBytes, r.sourceBytes)} smaller)${r.status === 'skipped' ? '  [skipped, output newer]' : ''}`
      );
    }
  }

  const touched = results.filter(r => r.status !== 'skipped');
  const totalSrc = touched.reduce((s, r) => s + r.sourceBytes, 0);
  const totalOut = touched.reduce((s, r) => s + r.outputBytes, 0);

  console.log('');
  console.log(
    `${results.length} icon(s); ${touched.length} processed, ${results.length - touched.length} skipped.`
  );
  if (touched.length > 0) {
    console.log(
      `Total ${fmtBytes(totalSrc)} → ${fmtBytes(totalOut)} (${fmtPct(totalOut, totalSrc)} reduction)`
    );
  }
  if (DRY_RUN) {
    console.log(`(dry-run — no files written)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
