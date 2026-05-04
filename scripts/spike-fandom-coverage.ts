// Coverage spike: probe the Fandom AC wiki MediaWiki API for 10 representative
// ACGCN items. For each, ask for the page's lead image (pageimages.original) and
// fall back to disambiguated titles (e.g. "Sea Bass (fish)") if the bare name
// misses. Print a results table; nonzero exit if any item fails entirely.
//
// Run: npx tsx scripts/spike-fandom-coverage.ts

const API = 'https://animalcrossing.fandom.com/api.php';
const UA = 'animalcrossingwebapp-icon-spike/0.1 (https://animalcrossingwebapp.vercel.app)';
const DELAY_MS = 600;

type Sample = { category: string; id: string; name: string; disambig?: string };

const SAMPLES: Sample[] = [
  { category: 'art',     id: 'academic-painting',          name: 'Academic Painting' },
  { category: 'fossils', id: 't-rex-skull',                name: 'T. Rex',                 disambig: 'fossil' },
  { category: 'fossils', id: 'mammoth-skull',              name: 'Mammoth',                disambig: 'fossil' },
  { category: 'fish',    id: 'pale-chub',                  name: 'Pale Chub',              disambig: 'fish' },
  { category: 'fish',    id: 'sea-bass',                   name: 'Sea Bass',               disambig: 'fish' },
  { category: 'fish',    id: 'koi',                        name: 'Koi',                    disambig: 'fish' },
  { category: 'bugs',    id: 'tiger-swallowtail-butterfly',name: 'Tiger Swallowtail Butterfly', disambig: 'bug' },
  { category: 'bugs',    id: 'common-butterfly',           name: 'Common Butterfly',       disambig: 'bug' },
  { category: 'bugs',    id: 'brown-cicada',               name: 'Brown Cicada',           disambig: 'bug' },
  { category: 'art',     id: 'amazing-painting',           name: 'Amazing Painting' },
];

type Result = { id: string; titleTried: string; found: boolean; imageUrl: string | null };

async function fetchLeadImage(title: string): Promise<string | null> {
  const url = `${API}?${new URLSearchParams({
    action: 'query',
    prop: 'pageimages',
    piprop: 'original',
    titles: title,
    redirects: '1',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) return null;
  const json: any = await res.json();
  const pages: any[] = json?.query?.pages ?? [];
  for (const p of pages) {
    if (p?.missing) return null;
    const src = p?.original?.source;
    if (typeof src === 'string') return src;
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function probe(s: Sample): Promise<Result> {
  const candidates = [s.name, s.disambig ? `${s.name} (${s.disambig})` : null].filter(
    (x): x is string => Boolean(x),
  );
  for (const title of candidates) {
    const url = await fetchLeadImage(title);
    if (url) return { id: s.id, titleTried: title, found: true, imageUrl: url };
    await sleep(DELAY_MS);
  }
  return { id: s.id, titleTried: candidates[candidates.length - 1], found: false, imageUrl: null };
}

(async () => {
  const results: Result[] = [];
  for (const s of SAMPLES) {
    const r = await probe(s);
    results.push(r);
    console.log(
      `${r.found ? 'OK ' : 'MISS'}  ${s.category.padEnd(8)} ${s.id.padEnd(34)}  ${
        r.imageUrl ?? '(no image)'
      }`,
    );
    await sleep(DELAY_MS);
  }
  const hits = results.filter((r) => r.found).length;
  const pct = Math.round((hits / results.length) * 100);
  console.log(`\nCoverage: ${hits}/${results.length} (${pct}%)`);
  process.exit(hits / results.length >= 0.9 ? 0 : 1);
})();
