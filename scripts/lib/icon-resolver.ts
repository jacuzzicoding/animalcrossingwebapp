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
  via:
    | 'override'
    | 'a:bare'
    | 'a:sentence'
    | 'b:disambig'
    | 'c:search'
    | 'd:html'
    | 'none';
  titleResolved: string | null;
  imageUrl: string | null;
  notes: string[];
};

// MediaWiki only auto-capitalizes the first character of a title. Fandom's AC
// wiki overwhelmingly uses sentence case for species and item articles
// ("Golden trout", "Hermit crab", "Sinking painting"), but in-game catalogs
// are Title Case. Some pages have a Title-Case redirect, many don't. After
// a:bare fails, retry with the rest of the title lowercased so a single probe
// catches the common case without forcing dozens of OVERRIDES per game.
function toSentenceCase(name: string): string {
  if (!name) return name;
  const head = name[0];
  const tail = name.slice(1).toLowerCase();
  return head + tail;
}

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

  // ACWW fossils — Ankylosaurus/Pachycephalosaurus use full -us form on the wiki
  // while ACWW in-game catalog truncates to Ankylosaur/Pachycephalosaur.
  'ACWW/fossils/ankylosaur-skull': 'Ankylosaurus',
  'ACWW/fossils/ankylosaur-torso': 'Ankylosaurus',
  'ACWW/fossils/ankylosaur-tail': 'Ankylosaurus',
  'ACWW/fossils/pachycephalosaur-skull': 'Pachycephalosaurus',
  'ACWW/fossils/pachycephalosaur-torso': 'Pachycephalosaurus',
  'ACWW/fossils/pachycephalosaur-tail': 'Pachycephalosaurus',
  // ACWW fossils — pages exist but have no pageimages.original; assets are
  // attached as File: directly on the article.
  'ACWW/fossils/fern-fossil': { file: 'Fern fossil.png' },
  'ACWW/fossils/shark-tooth': { file: 'Shark tooth.png' },
  'ACWW/fossils/peking-man': { file: 'Peking man.png' },

  // ACWW art — Fandom uses lowercase for subsequent words (same pattern as
  // ACGCN "Academic painting"). "Fine Painting" would miss; "Fine painting" hits.
  'ACWW/art/fine-painting': 'Fine painting',
  'ACWW/art/lovely-painting': 'Lovely painting',
  'ACWW/art/nice-painting': 'Nice painting',
  'ACWW/art/opulent-painting': 'Opulent painting',
  'ACWW/art/perfect-painting': 'Perfect painting',
  'ACWW/art/rare-painting': 'Rare painting',
  'ACWW/art/solemn-painting': 'Solemn painting',
  'ACWW/art/strange-painting': 'Strange painting',
  'ACWW/art/warm-painting': 'Warm painting',

  // ACNL fossils — in-game catalog truncates/anglicizes the Latin genus.
  // Megacero → Megaloceros (Irish elk). The c:search step otherwise lands on
  // "Megacerops" — a different mammal entirely.
  'ACNL/fossils/megacero-skull': 'Megaloceros',
  'ACNL/fossils/megacero-torso': 'Megaloceros',
  'ACNL/fossils/megacero-tail': 'Megaloceros',
  // Deinony-* → Deinonychus. Same -us-truncation pattern as ACWW
  // ankylosaur/pachycephalosaur.
  'ACNL/fossils/deinony-skull': 'Deinonychus',
  'ACNL/fossils/deinony-torso': 'Deinonychus',
  'ACNL/fossils/deinony-tail': 'Deinonychus',
  // Australopith → Australopithecus.
  'ACNL/fossils/australopith': 'Australopithecus',

  // ACNL fish — the bare "Great white shark" page exists but the algorithmic
  // chain landed on "Great white shark model" (a furniture page); pin the
  // species article.
  'ACNL/fish/great-white-shark': 'Great white shark',

  // ACNL bugs — anglicized / "beetle"-suffix-stripped wiki titles. The
  // Miyama/Giant/Rainbow stag set already worked via a:bare; these three
  // didn't because their in-game names include "beetle" but the wiki pages
  // drop it.
  'ACNL/bugs/cyclommatus-stag-beetle': 'Cyclommatus stag',
  'ACNL/bugs/golden-stag-beetle': 'Golden stag',
  'ACNL/bugs/giraffe-stag-beetle': 'Giraffe stag',
  // Wiki uses "stink bug" (two words); in-game catalog uses "stinkbug".
  'ACNL/bugs/man-faced-stinkbug': 'Man-faced stink bug',
  // Bare "Giant water bug" page exists; algorithmic chain otherwise lands on
  // "Giant water bug model" (furniture).
  'ACNL/bugs/giant-water-bug': 'Giant water bug',

  // ACNL art — split-panel paintings collapse to the single wiki article
  // (same shape as fossil pieces sharing one whole-species image).
  'ACNL/art/wild-painting-left-half': 'Wild painting',
  'ACNL/art/wild-painting-right-half': 'Wild painting',

  // ====================================================================
  // ACNH (v0.9.6-beta) — see docs/v0.9.2-icon-coverage-audit.md for the gap shape.
  // ====================================================================

  // Multi-part fossils → parent species article. Same pattern as ACWW
  // ankylosaur-* / ACNL megacero-*. ACNH catalog uses truncated forms
  // (ankylo, brachio, diplo, ichthyo, megalo, ophthalmo, pachy, plesio,
  // ptera, quetzal, shastasaurus, silo, spino, stego, styraco, tricera).
  'ACNH/fossils/ankylo-skull': 'Ankylosaurus',
  'ACNH/fossils/ankylo-tail': 'Ankylosaurus',
  'ACNH/fossils/ankylo-torso': 'Ankylosaurus',
  'ACNH/fossils/brachio-skull': 'Brachiosaurus',
  'ACNH/fossils/brachio-chest': 'Brachiosaurus',
  'ACNH/fossils/brachio-pelvis': 'Brachiosaurus',
  'ACNH/fossils/brachio-tail': 'Brachiosaurus',
  'ACNH/fossils/diplo-skull': 'Diplodocus',
  'ACNH/fossils/diplo-neck': 'Diplodocus',
  'ACNH/fossils/diplo-chest': 'Diplodocus',
  'ACNH/fossils/diplo-hip': 'Diplodocus',
  'ACNH/fossils/diplo-tail': 'Diplodocus',
  'ACNH/fossils/diplo-tail-tip': 'Diplodocus',
  'ACNH/fossils/diplo-torso': 'Diplodocus',
  // Ichthyosaurus page exists but carries no pageimages.original and no
  // portable-infobox image — genuine wiki gap; tracked in missing-acnh.txt.
  'ACNH/fossils/left-megalo-side': 'Megaloceros',
  'ACNH/fossils/right-megalo-side': 'Megaloceros',
  'ACNH/fossils/ophthalmo-skull': 'Ophthalmosaurus',
  'ACNH/fossils/ophthalmo-torso': 'Ophthalmosaurus',
  'ACNH/fossils/pachy-skull': 'Pachycephalosaurus',
  'ACNH/fossils/pachy-tail': 'Pachycephalosaurus',
  'ACNH/fossils/plesio-skull': 'Plesiosaurus',
  'ACNH/fossils/plesio-neck': 'Plesiosaurus',
  'ACNH/fossils/plesio-body': 'Plesiosaurus',
  'ACNH/fossils/ptera-body': 'Pteranodon',
  'ACNH/fossils/left-ptera-wing': 'Pteranodon',
  'ACNH/fossils/right-ptera-wing': 'Pteranodon',
  'ACNH/fossils/quetzal-torso': 'Quetzalcoatlus',
  'ACNH/fossils/left-quetzal-wing': 'Quetzalcoatlus',
  'ACNH/fossils/right-quetzal-wing': 'Quetzalcoatlus',
  // Shastasaurus has no Fandom AC article — genuine gap (logged).
  'ACNH/fossils/silo-skull': 'Silo',
  'ACNH/fossils/silo-tail': 'Silo',
  'ACNH/fossils/spino-skull': 'Spinosaurus',
  'ACNH/fossils/spino-tail': 'Spinosaurus',
  'ACNH/fossils/spino-torso': 'Spinosaurus',
  'ACNH/fossils/stego-skull': 'Stegosaurus',
  'ACNH/fossils/stego-tail': 'Stegosaurus',
  'ACNH/fossils/stego-torso': 'Stegosaurus',
  'ACNH/fossils/styraco-skull': 'Styracosaurus',
  'ACNH/fossils/styraco-tail': 'Styracosaurus',
  'ACNH/fossils/styraco-torso': 'Styracosaurus',
  'ACNH/fossils/tricera-skull': 'Triceratops',
  'ACNH/fossils/tricera-tail': 'Triceratops',
  'ACNH/fossils/tricera-torso': 'Triceratops',
  // Elasmosaurus has no Fandom AC article — genuine gap (logged).
  // Coelacanth (fossil) and Fish fossil have no Fandom AC article — genuine
  // gaps (logged); the fish "Coelacanth" page is a different asset and not
  // a valid stand-in for the fossil piece.
  'ACNH/fossils/shark-tooth-pattern': 'Shark-tooth pattern',
  // "Sabertooth tiger" is the wiki article for the multi-part sabertooth
  // skeleton; "sabertooth-tail" is the only piece missing here because
  // sabertooth-skull/torso already routed via ACNL canonicalization.
  'ACNH/fossils/sabertooth-tail': 'Sabertooth tiger',

  // ACNL sea creatures — wiki indexes as "Pearl oyster (deep-sea creature)"
  // (lowercase second word). MediaWiki only auto-capitalizes the first
  // character, so the b:disambig probe with the in-game-cased "Pearl Oyster"
  // misses; pin the lowercase title.
  'ACNL/sea_creatures/pearl-oyster': 'Pearl oyster (deep-sea creature)',
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

  // (a2) sentence-case name — handles the Title-Case-vs-sentence-case gap
  // that ACNH catalog names hit constantly (e.g. "Golden Trout" → "Golden
  // trout"). Skipped when it would duplicate the bare probe.
  const sentence = toSentenceCase(input.name);
  if (sentence !== input.name) {
    const a2 = await pageImage(sentence);
    await sleep(DELAY_MS);
    if (a2.kind === 'image') {
      return {
        found: true,
        via: 'a:sentence',
        titleResolved: a2.title,
        imageUrl: a2.imageUrl,
        notes,
      };
    }
    if (!safeHtmlTarget && a2.kind === 'no-image') safeHtmlTarget = a2.title;
  }

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
  // 2026-05-10 (v0.9.5 spike): MediaWiki search frequently ranks "<Title>/Gallery"
  // subpages above their parent article (seen on great-white-shark and
  // rajah-brooke-birdwing in the ACNL spike). Push subpage titles to the back
  // so the parent article wins when both exist; preserves the gallery as a
  // fallback if the parent has no pageimages.
  accepted.sort((x, y) => Number(x.includes('/')) - Number(y.includes('/')));
  // 2026-05-12 (v0.9.6 spike): ACNH furniture "<Species> model" pages routinely
  // outrank the species article in search (seen on golden-trout, paper-kite-
  // butterfly, man-faced-stink-bug). Push "* model" titles to the back so the
  // species article wins; preserves the furniture page as a last-ditch fallback.
  accepted.sort(
    (x, y) => Number(/\bmodel$/i.test(x)) - Number(/\bmodel$/i.test(y))
  );
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
