// Coverage spike: probe the Fandom AC wiki for 10 representative ACGCN items
// using a layered title-resolution chain plus an HTML-infobox fallback.
//
// Resolution chain per item:
//   (a) bare item name via pageimages
//   (b) "<name> (<category>)" disambig via pageimages
//   (c) art only: basedOn field, with " by ..." stripped, via pageimages
//   (d) MediaWiki list=search for the name; pageimages on the top hit if its
//       title loosely contains the item name (case-insensitive substring)
//   (e) HTML fallback: fetch the best-candidate page HTML and parse the first
//       infobox <img> src
//
// Redirects are followed automatically (redirects=1 on every query call).
// Run: npx tsx scripts/spike-fandom-coverage.ts

import { readFileSync } from 'node:fs';

const API = 'https://animalcrossing.fandom.com/api.php';
const ARTICLE_BASE = 'https://animalcrossing.fandom.com/wiki/';
const UA = 'animalcrossingwebapp-icon-spike/0.2 (https://animalcrossingwebapp.vercel.app)';
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
  via: string; // which step in the chain succeeded
  titleResolved: string | null;
  imageUrl: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Try pageimages for a title. Returns { title (post-redirect), imageUrl } or null.
async function pageImage(title: string): Promise<{ title: string; imageUrl: string } | null> {
  const json = await getJson({
    action: 'query',
    prop: 'pageimages',
    piprop: 'original',
    titles: title,
    redirects: '1',
  });
  const pages: any[] = json?.query?.pages ?? [];
  for (const p of pages) {
    if (p?.missing) return null;
    const src = p?.original?.source;
    if (typeof src === 'string') return { title: p.title ?? title, imageUrl: src };
  }
  return null;
}

// list=search for the item name; return the top hit's title (no filtering yet).
async function searchTopHit(query: string): Promise<string | null> {
  const json = await getJson({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
  });
  const hits: any[] = json?.query?.search ?? [];
  return hits[0]?.title ?? null;
}

// Loose match: case-insensitive substring either way.
function looseTitleMatch(itemName: string, candidate: string): boolean {
  const a = itemName.toLowerCase();
  const b = candidate.toLowerCase();
  return b.includes(a) || a.includes(b);
}

// Strip " by ..." from an art basedOn field.
function stripByClause(s: string): string {
  return s.replace(/\s+by\s+.+$/i, '').trim();
}

// HTML fallback: fetch the article HTML and pull the first infobox <img> src.
async function htmlInfoboxImage(title: string): Promise<string | null> {
  const url = `${ARTICLE_BASE}${encodeURIComponent(title.replace(/\s/g, '_'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const html = await res.text();
  // Try the standard portable-infobox first, then any image in the first infobox-ish block.
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

// Load art basedOn map once (only used for art items in step c).
const artMap: Record<string, string> = (() => {
  const raw = readFileSync('public/data/acgcn/art.json', 'utf8');
  const arr = JSON.parse(raw) as Array<{ id: string; basedOn?: string }>;
  return Object.fromEntries(arr.filter((x) => x.basedOn).map((x) => [x.id, x.basedOn!]));
})();

async function probe(s: Sample): Promise<Result> {
  // (a) bare name
  let hit = await pageImage(s.name);
  if (hit) return { id: s.id, found: true, via: 'a:bare', titleResolved: hit.title, imageUrl: hit.imageUrl };
  await sleep(DELAY_MS);

  // (b) name (category)
  if (s.disambig) {
    hit = await pageImage(`${s.name} (${s.disambig})`);
    if (hit) return { id: s.id, found: true, via: 'b:disambig', titleResolved: hit.title, imageUrl: hit.imageUrl };
    await sleep(DELAY_MS);
  }

  // (c) art only: basedOn, with " by ..." stripped
  if (s.category === 'art' && artMap[s.id]) {
    const stripped = stripByClause(artMap[s.id]);
    hit = await pageImage(stripped);
    if (hit) return { id: s.id, found: true, via: 'c:basedOn', titleResolved: hit.title, imageUrl: hit.imageUrl };
    await sleep(DELAY_MS);
  }

  // (d) search top hit
  const topTitle = await searchTopHit(s.name);
  await sleep(DELAY_MS);
  if (topTitle && looseTitleMatch(s.name, topTitle)) {
    hit = await pageImage(topTitle);
    if (hit) return { id: s.id, found: true, via: 'd:search', titleResolved: hit.title, imageUrl: hit.imageUrl };
    await sleep(DELAY_MS);
  }

  // (e) HTML infobox fallback against the best candidate we have
  const htmlCandidate = topTitle ?? s.name;
  const imgSrc = await htmlInfoboxImage(htmlCandidate);
  if (imgSrc) return { id: s.id, found: true, via: 'e:html', titleResolved: htmlCandidate, imageUrl: imgSrc };

  return { id: s.id, found: false, via: 'none', titleResolved: null, imageUrl: null };
}

(async () => {
  const results: Result[] = [];
  for (const s of SAMPLES) {
    const r = await probe(s);
    results.push(r);
    console.log(
      `${r.found ? 'OK ' : 'MISS'}  ${s.category.padEnd(8)} ${s.id.padEnd(34)}  via=${r.via.padEnd(11)}  ${
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
