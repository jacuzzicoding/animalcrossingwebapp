// Coverage spike v3: probe the Fandom AC wiki for representative ACGCN items
// using a stricter resolution chain. Honest coverage is what matters — every
// returned URL is auditable from the log (page title that produced it is shown
// alongside the URL).
//
// Per-item canonical lookup string:
//   - art with basedOn → strip " by ..." from basedOn (source of truth)
//   - everything else → item name
//
// Resolution chain (each step uses the canonical lookup string):
//   (a) pageimages(lookup)
//   (b) pageimages("<lookup> (<category>)") if a disambig is configured
//   (c) list=search(lookup) → top hit; accept only if ALL whitespace tokens of
//       the lookup string appear in the candidate title (case-insensitive);
//       then pageimages on that title. Rejected candidates are logged.
//   (d) HTML infobox fallback — fires ONLY when (a) or (b) found a real page
//       that simply has no pageimages.original. Never against guessed titles.
//
// Run: npx tsx scripts/spike-fandom-coverage.ts

import { readFileSync } from 'node:fs';

const API = 'https://animalcrossing.fandom.com/api.php';
const ARTICLE_BASE = 'https://animalcrossing.fandom.com/wiki/';
const UA = 'animalcrossingwebapp-icon-spike/0.3 (https://animalcrossingwebapp.vercel.app)';
const DELAY_MS = 600;

type Sample = { category: string; id: string; name: string; disambig?: string };

const SAMPLES: Sample[] = [
  { category: 'art',     id: 'academic-painting',           name: 'Academic Painting' },
  { category: 'fossils', id: 't-rex-skull',                 name: 'T. Rex',                      disambig: 'fossil' },
  { category: 'fossils', id: 'mammoth-skull',               name: 'Mammoth',                     disambig: 'fossil' },
  { category: 'fish',    id: 'pale-chub',                   name: 'Pale Chub',                   disambig: 'fish' },
  { category: 'fish',    id: 'sea-bass',                    name: 'Sea Bass',                    disambig: 'fish' },
  { category: 'fish',    id: 'koi',                         name: 'Koi',                         disambig: 'fish' },
  { category: 'bugs',    id: 'tiger-swallowtail-butterfly', name: 'Tiger Swallowtail Butterfly', disambig: 'bug' },
  { category: 'bugs',    id: 'common-butterfly',            name: 'Common Butterfly',            disambig: 'bug' },
  { category: 'bugs',    id: 'brown-cicada',                name: 'Brown Cicada',                disambig: 'bug' },
  { category: 'art',     id: 'amazing-painting',            name: 'Amazing Painting' },
];

type Result = {
  id: string;
  found: boolean;
  via: string;
  titleResolved: string | null;
  imageUrl: string | null;
  notes: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

type PageProbe =
  | { kind: 'image'; title: string; imageUrl: string }
  | { kind: 'no-image'; title: string }
  | { kind: 'missing' };

async function pageImage(title: string): Promise<PageProbe> {
  const json = await getJson({
    action: 'query',
    prop: 'pageimages',
    piprop: 'original',
    titles: title,
    redirects: '1',
  });
  const pages: any[] = json?.query?.pages ?? [];
  for (const p of pages) {
    if (p?.missing) return { kind: 'missing' };
    const src = p?.original?.source;
    if (typeof src === 'string') return { kind: 'image', title: p.title ?? title, imageUrl: src };
    return { kind: 'no-image', title: p.title ?? title };
  }
  return { kind: 'missing' };
}

async function searchTopHits(query: string, limit = 5): Promise<string[]> {
  const json = await getJson({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
  });
  const hits: any[] = json?.query?.search ?? [];
  return hits.map((h) => h?.title).filter((t): t is string => typeof t === 'string');
}

function allTokensPresent(lookup: string, candidate: string): boolean {
  const tokens = lookup.toLowerCase().split(/\s+/).filter(Boolean);
  const c = candidate.toLowerCase();
  return tokens.every((t) => c.includes(t));
}

function stripByClause(s: string): string {
  return s.replace(/\s+by\s+.+$/i, '').trim();
}

async function htmlInfoboxImage(title: string): Promise<string | null> {
  const url = `${ARTICLE_BASE}${encodeURIComponent(title.replace(/\s/g, '_'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const html = await res.text();
  const patterns: RegExp[] = [
    /class="pi-image-thumbnail"[^>]*src="([^"]+)"/i,
    /<aside[^>]*class="[^"]*portable-infobox[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i,
    /<table[^>]*class="[^"]*infobox[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

const artMap: Record<string, string> = (() => {
  const raw = readFileSync('public/data/acgcn/art.json', 'utf8');
  const arr = JSON.parse(raw) as Array<{ id: string; basedOn?: string }>;
  return Object.fromEntries(arr.filter((x) => x.basedOn).map((x) => [x.id, x.basedOn!]));
})();

function canonicalLookup(s: Sample): string {
  if (s.category === 'art' && artMap[s.id]) {
    const stripped = stripByClause(artMap[s.id]);
    if (stripped) return stripped;
  }
  return s.name;
}

async function probe(s: Sample): Promise<Result> {
  const notes: string[] = [];
  const lookup = canonicalLookup(s);
  if (lookup !== s.name) notes.push(`lookup="${lookup}" (from basedOn)`);

  // (a) bare lookup
  const a = await pageImage(lookup);
  await sleep(DELAY_MS);
  if (a.kind === 'image') {
    return { id: s.id, found: true, via: 'a:bare', titleResolved: a.title, imageUrl: a.imageUrl, notes };
  }
  let safeHtmlTarget: string | null = a.kind === 'no-image' ? a.title : null;

  // (b) lookup (category)
  if (s.disambig) {
    const b = await pageImage(`${lookup} (${s.disambig})`);
    await sleep(DELAY_MS);
    if (b.kind === 'image') {
      return { id: s.id, found: true, via: 'b:disambig', titleResolved: b.title, imageUrl: b.imageUrl, notes };
    }
    if (!safeHtmlTarget && b.kind === 'no-image') safeHtmlTarget = b.title;
  }

  // (c) search → all-tokens loose match → pageimages
  const hits = await searchTopHits(lookup, 5);
  await sleep(DELAY_MS);
  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const h of hits) {
    if (allTokensPresent(lookup, h)) accepted.push(h);
    else rejected.push(h);
  }
  if (rejected.length) notes.push(`search rejected: [${rejected.join(' | ')}]`);
  if (accepted.length) notes.push(`search accepted: [${accepted.join(' | ')}]`);
  for (const cand of accepted) {
    const c = await pageImage(cand);
    await sleep(DELAY_MS);
    if (c.kind === 'image') {
      return { id: s.id, found: true, via: 'c:search', titleResolved: c.title, imageUrl: c.imageUrl, notes };
    }
    if (!safeHtmlTarget && c.kind === 'no-image') safeHtmlTarget = c.title;
  }

  // (d) HTML fallback ONLY against a confirmed real page (never a guessed title)
  if (safeHtmlTarget) {
    const img = await htmlInfoboxImage(safeHtmlTarget);
    if (img) {
      return { id: s.id, found: true, via: 'd:html', titleResolved: safeHtmlTarget, imageUrl: img, notes };
    }
    notes.push(`html fallback on "${safeHtmlTarget}" found no infobox image`);
  } else {
    notes.push('html fallback skipped (no confirmed page to scrape)');
  }

  return { id: s.id, found: false, via: 'none', titleResolved: null, imageUrl: null, notes };
}

(async () => {
  const results: Result[] = [];
  for (const s of SAMPLES) {
    const r = await probe(s);
    results.push(r);
    console.log(
      `${r.found ? 'OK ' : 'MISS'}  ${s.category.padEnd(8)} ${s.id.padEnd(34)}  via=${r.via.padEnd(11)}  title=${(r.titleResolved ?? '-').padEnd(28)}  ${r.imageUrl ?? '(no image)'}`,
    );
    for (const n of r.notes) console.log(`        · ${n}`);
    await sleep(DELAY_MS);
  }
  const hits = results.filter((r) => r.found).length;
  const pct = Math.round((hits / results.length) * 100);
  console.log(`\nReported coverage: ${hits}/${results.length} (${pct}%)`);
  console.log('Audit the title→URL pairs above before trusting this number.');
  process.exit(hits / results.length >= 0.9 ? 0 : 1);
})();
