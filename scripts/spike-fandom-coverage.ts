// Coverage spike v4: re-runs the 10 representative ACGCN items through the
// shared resolver (scripts/lib/icon-resolver.ts) — `basedOn`-as-canonical is
// dropped; OVERRIDES map fires first.
//
// Run: npx tsx scripts/spike-fandom-coverage.ts

import {
  resolveIcon,
  sleep,
  DELAY_MS,
  type ResolveInput,
} from './lib/icon-resolver.ts';

const SAMPLES: ResolveInput[] = [
  {
    gameId: 'ACGCN',
    category: 'art',
    id: 'academic-painting',
    name: 'Academic Painting',
  },
  {
    gameId: 'ACGCN',
    category: 'fossils',
    id: 't-rex-skull',
    name: 'T. Rex',
    disambig: 'fossil',
  },
  {
    gameId: 'ACGCN',
    category: 'fossils',
    id: 'mammoth-skull',
    name: 'Mammoth',
    disambig: 'fossil',
  },
  {
    gameId: 'ACGCN',
    category: 'fish',
    id: 'pale-chub',
    name: 'Pale Chub',
    disambig: 'fish',
  },
  {
    gameId: 'ACGCN',
    category: 'fish',
    id: 'sea-bass',
    name: 'Sea Bass',
    disambig: 'fish',
  },
  {
    gameId: 'ACGCN',
    category: 'fish',
    id: 'koi',
    name: 'Koi',
    disambig: 'fish',
  },
  {
    gameId: 'ACGCN',
    category: 'bugs',
    id: 'tiger-swallowtail-butterfly',
    name: 'Tiger Swallowtail Butterfly',
    disambig: 'bug',
  },
  {
    gameId: 'ACGCN',
    category: 'bugs',
    id: 'common-butterfly',
    name: 'Common Butterfly',
    disambig: 'bug',
  },
  {
    gameId: 'ACGCN',
    category: 'bugs',
    id: 'brown-cicada',
    name: 'Brown Cicada',
    disambig: 'bug',
  },
  {
    gameId: 'ACGCN',
    category: 'art',
    id: 'amazing-painting',
    name: 'Amazing Painting',
  },
];

(async () => {
  const results = [] as Array<{
    s: ResolveInput;
    r: Awaited<ReturnType<typeof resolveIcon>>;
  }>;
  for (const s of SAMPLES) {
    const r = await resolveIcon(s);
    results.push({ s, r });
    console.log(
      `${r.found ? 'OK ' : 'MISS'}  ${s.category.padEnd(8)} ${s.id.padEnd(34)}  via=${r.via.padEnd(11)}  title=${(r.titleResolved ?? '-').padEnd(28)}  ${r.imageUrl ?? '(no image)'}`
    );
    for (const n of r.notes) console.log(`        · ${n}`);
    await sleep(DELAY_MS);
  }
  const hits = results.filter(({ r }) => r.found).length;
  const pct = Math.round((hits / results.length) * 100);
  console.log(`\nReported coverage: ${hits}/${results.length} (${pct}%)`);
  console.log('Audit the title→URL pairs above before trusting this number.');
  process.exit(hits / results.length >= 0.9 ? 0 : 1);
})();
