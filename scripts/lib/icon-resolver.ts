// Shared icon-resolver for the Fandom AC wiki.
//
// Lookup precedence:
//   0. OVERRIDES map  — `<gameId>/<category>/<id>` → exact wiki page title.
//      Fires first. The only legitimate fallback path; algorithmic misses must
//      be promoted here, not papered over by HTML scraping of guessed titles.
//   1. pageimages(name)
//   2. pageimages("<name> (<category-disambig>)")
//   3. list=search(name); pageimages on top hits whose title contains every
//      whitespace token of the name (case-insensitive). Rejected candidates
//      are surfaced in the result for diagnosis.
//   4. HTML infobox fallback — fires ONLY against a page that an earlier step
//      proved to exist but which had no `pageimages.original`. Never against a
//      guessed title.

const API = 'https://animalcrossing.fandom.com/api.php';
const ARTICLE_BASE = 'https://animalcrossing.fandom.com/wiki/';
export const UA =
  'animalcrossingwebapp-icon-resolver/0.1 (https://animalcrossingwebapp.vercel.app)';
export const DELAY_MS = 600;

export type ResolveInput = {
  gameId: string;
  category: string;
  id: string;
  name: string;
  disambig?: string;
};

export type ResolveResult = {
  found: boolean;
  via: 'override' | 'a:bare' | 'b:disambig' | 'c:search' | 'd:html' | 'none';
  titleResolved: string | null;
  imageUrl: string | null;
  notes: string[];
};

// Manually-curated overrides for items the algorithmic chain can't resolve.
// Key shape: "<gameId>/<category>/<id>". Value forms:
//   - string                — exact Fandom page title; resolved via pageimages
//   - { file: 'Foo.png' }   — direct File: lookup; used when a page exists but
//                             carries no pageimages.original (e.g. Dinosaur egg)
export type Override = string | { file: string };
export const OVERRIDES: Record<string, Override> = {
  // ACGCN — Fandom uses "Academic painting" (lowercase second word). MediaWiki
  // only auto-capitalizes the first character of a title, so "Academic
  // Painting" misses without a redirect.
  'ACGCN/art/academic-painting': 'Academic painting',
  // ACGCN — Fandom indexes this species as "Tiger butterfly", dropping the
  // "Swallowtail" qualifier the in-game catalog uses.
  'ACGCN/bugs/tiger-swallowtail-butterfly': 'Tiger butterfly',
  // ACGCN — Fandom uses the generic "Yellow butterfly" page; "Clouded Yellow"
  // is the in-game name only and doesn't have its own article.
  'ACGCN/bugs/clouded-yellow-butterfly': 'Yellow butterfly',
  // ACGCN — page exists but lacks pageimages.original; the asset lives at
  // File:Dinosaur egg.png attached to the article.
  'ACGCN/fossils/dinosaur-egg': { file: 'Dinosaur egg.png' },
};

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getJson(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
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
    if (typeof src === 'string')
      return { kind: 'image', title: p.title ?? title, imageUrl: src };
    return { kind: 'no-image', title: p.title ?? title };
  }
  return { kind: 'missing' };
}

async function fileImageUrl(filename: string): Promise<string | null> {
  const json = await getJson({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
  });
  const pages: any[] = json?.query?.pages ?? [];
  for (const p of pages) {
    const url = p?.imageinfo?.[0]?.url;
    if (typeof url === 'string') return url;
  }
  return null;
}

async function searchTopHits(query: string, limit = 5): Promise<string[]> {
  const json = await getJson({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
  });
  const hits: any[] = json?.query?.search ?? [];
  return hits
    .map(h => h?.title)
    .filter((t): t is string => typeof t === 'string');
}

function allTokensPresent(query: string, candidate: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const c = candidate.toLowerCase();
  return tokens.every(t => c.includes(t));
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

export async function resolveIcon(input: ResolveInput): Promise<ResolveResult> {
  const notes: string[] = [];
  const overrideKey = `${input.gameId}/${input.category}/${input.id}`;
  const overrideTitle = OVERRIDES[overrideKey];

  // (0) override
  if (overrideTitle) {
    if (typeof overrideTitle === 'string') {
      const r = await pageImage(overrideTitle);
      await sleep(DELAY_MS);
      if (r.kind === 'image') {
        return {
          found: true,
          via: 'override',
          titleResolved: r.title,
          imageUrl: r.imageUrl,
          notes: [`override="${overrideTitle}"`],
        };
      }
      notes.push(
        `override "${overrideTitle}" did not yield an image (kind=${r.kind})`
      );
    } else {
      const url = await fileImageUrl(overrideTitle.file);
      await sleep(DELAY_MS);
      if (url) {
        return {
          found: true,
          via: 'override',
          titleResolved: `File:${overrideTitle.file}`,
          imageUrl: url,
          notes: [`override file="${overrideTitle.file}"`],
        };
      }
      notes.push(`override file "${overrideTitle.file}" did not resolve`);
    }
  }

  // (a) bare name
  const a = await pageImage(input.name);
  await sleep(DELAY_MS);
  if (a.kind === 'image') {
    return {
      found: true,
      via: 'a:bare',
      titleResolved: a.title,
      imageUrl: a.imageUrl,
      notes,
    };
  }
  let safeHtmlTarget: string | null = a.kind === 'no-image' ? a.title : null;

  // (b) name (category)
  if (input.disambig) {
    const b = await pageImage(`${input.name} (${input.disambig})`);
    await sleep(DELAY_MS);
    if (b.kind === 'image') {
      return {
        found: true,
        via: 'b:disambig',
        titleResolved: b.title,
        imageUrl: b.imageUrl,
        notes,
      };
    }
    if (!safeHtmlTarget && b.kind === 'no-image') safeHtmlTarget = b.title;
  }

  // (c) search → all-tokens loose match → pageimages
  const hits = await searchTopHits(input.name, 5);
  await sleep(DELAY_MS);
  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const h of hits)
    (allTokensPresent(input.name, h) ? accepted : rejected).push(h);
  if (rejected.length) notes.push(`search rejected: [${rejected.join(' | ')}]`);
  if (accepted.length) notes.push(`search accepted: [${accepted.join(' | ')}]`);
  for (const cand of accepted) {
    const c = await pageImage(cand);
    await sleep(DELAY_MS);
    if (c.kind === 'image') {
      return {
        found: true,
        via: 'c:search',
        titleResolved: c.title,
        imageUrl: c.imageUrl,
        notes,
      };
    }
    if (!safeHtmlTarget && c.kind === 'no-image') safeHtmlTarget = c.title;
  }

  // (d) HTML fallback only against a confirmed real page
  if (safeHtmlTarget) {
    const img = await htmlInfoboxImage(safeHtmlTarget);
    if (img) {
      return {
        found: true,
        via: 'd:html',
        titleResolved: safeHtmlTarget,
        imageUrl: img,
        notes,
      };
    }
    notes.push(`html fallback on "${safeHtmlTarget}" found no infobox image`);
  } else {
    notes.push('html fallback skipped (no confirmed page to scrape)');
  }

  return {
    found: false,
    via: 'none',
    titleResolved: null,
    imageUrl: null,
    notes,
  };
}
