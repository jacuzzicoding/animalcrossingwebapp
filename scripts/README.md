# scripts/

Local-only tooling for one-shot data work. Nothing here runs at build time. The icon scrapers in particular are designed to be run by hand, audited, and committed — not invoked by CI.

For the methodology behind this folder (why a resolver chain + overrides map, how to spike a new game), see [`docs/wiki-scraping-pattern.md`](../docs/wiki-scraping-pattern.md).

---

## `generate-icon-manifest.ts` — re-emit `manifest.json` from on-disk icons

Walks `public/icons/<gameId>/{fish,bugs,fossils,art,sea_creatures}/` for every game directory present and writes `public/icons/<gameId>/manifest.json` shaped as `{ [category]: { [id]: filename } }`. The on-disk extension is preserved per file (Fandom serves a mix of `png`/`jpg`), and the consuming UI cannot guess the extension at render time without this lookup.

`fetch-icons.ts` writes the same manifest as part of a scrape, so re-running this script after a clean scrape is a no-op. Where it earns its keep:

- After a manual icon swap (e.g. replacing a single sprite with a higher-quality one).
- After committing icons fetched outside of `fetch-icons.ts`.
- As a quick cross-check that `manifest.json` matches what's actually on disk.

Catalog order (from `public/data/<gameId>/<category>.json`) is preserved when the matching data file exists; otherwise entries fall back to filesystem (sorted) order. This keeps the output identical to what `fetch-icons.ts` would have written for the same set of files.

### Run

```bash
npm run icons:manifest
```

No env vars, no CLI args. Re-run after every icon commit.

> The UI lights up automatically when a game's `manifest.json` lands. `<ItemIcon>` probes `/icons/<gameId>/manifest.json` lazily on first render and caches the tri-state result (`unknown` / `present` / `absent`); no companion code change in `src/` is needed to enable icons for a newly-scraped game.

---

## `fetch-icons.ts` — scrape item icons from the Fandom AC wiki

Reads `public/data/<gameId>/{fish,bugs,fossils,art}.json`, resolves each item against the Fandom AC wiki, downloads the lead image, and writes:

- `public/icons/<gameId>/<category>/<id>.<ext>` — one file per item, source extension preserved (Fandom serves a mix of `.png` / `.jpg` / `.jpeg`; renaming everything to `.png` would lie about the bytes).
- `public/icons/<gameId>/manifest.json` — `{ category: { id: filename } }` lookup for the consuming UI.
- `scripts/missing.txt` — items that fell off the algorithmic chain. **Empty means a clean run.** Non-empty means: look up the right title manually, add to `OVERRIDES`, re-run.

### Run

```bash
npm run fetch:icons
```

(`tsx` is pinned in `devDependencies` so the version is deterministic across machines. The script entry resolves to `tsx scripts/fetch-icons.ts`.)

No env vars. No CLI args. The currently-targeted game is set via the `GAME_ID` constant at the top of the script — change it (and the matching `DATA_DIR` / `ICON_DIR`) when scraping a new game. Polite delay is ≥600 ms between API calls; a full ACGCN run (~118 items) takes about 3 minutes.

The script wipes any prior icons under `public/icons/<gameId>/` at the start so re-runs don't leave stale extensions lying around (e.g. both `<id>.png` and `<id>.jpg` for the same item after an extension change).

### Expected output

```
=== fish (40 items) ===
OK    sea-bass                            via=a:bare       Sea bass
OK    brook-trout                         via=a:bare       Brook trout
...
=== bugs (40 items) ===
...
=== fossils (25 items) ===
...
=== art (13 items) ===
...

=== Download phase ===

=== Audit (6 of 118 hits) ===
OK    fish/large-bass → "Large bass"  Large_bass.png
...

=== Summary ===
Items scanned:   118
Downloaded:      118
Missing:         0  (see scripts/missing.txt)
Bytes on disk:   6492542 (6.19 MB)
Audit:           6 sampled, 0 fail
```

Exit codes: `0` on a clean run, `1` if `missing.txt` is non-empty, `2` if the audit caught a mismatch. CI doesn't run this — exit codes are for the humans (or me-three-months-from-now) reading the terminal.

### Pushing the binary commit

A full game's worth of icons easily blows past git's default `http.postBuffer`. If `git push` returns `RPC failed; HTTP 400`, raise it locally (one-time, repo-scoped):

```bash
git config http.postBuffer 524288000
```

---

## `spike-fandom-coverage.ts` — coverage probe before scraping a new game

Runs the resolver against a 10-item representative sample (1 art, 2 fossils including a per-piece one, 3 fish, 3 bugs — and at least one weird-name case per category). Exits `0` only if **honest** coverage hits the 90% bar.

### Run

```bash
npm run spike:icons
```

(Resolves to `tsx scripts/spike-fandom-coverage.ts` via the pinned `tsx` devDependency.)

### Why "honest"

The script reports a count, but counts lie — the v2 round of the ACGCN spike reported 9/10 because the HTML fallback returned *some* image, but the image it returned for `academic-painting` was actually `Flowery_Painting.jpg` (it had grabbed an unrelated thumbnail off a paintings-listing page). **Always audit the title→URL pairs in the log before trusting the percentage.** A pair where the resolved page title has no significant tokens in common with the item name is a false positive even if the script says OK.

If honest coverage is below 90%, the right move is *not* "tune the resolver harder" — it's "look up the missing items manually and add them to `OVERRIDES`." See the methodology doc for why.

---

## `lib/icon-resolver.ts` — shared resolver

Both scripts call into a single resolver. Lookup precedence per item:

| # | Step | Description |
|---|------|-------------|
| 0 | **`OVERRIDES` map** | `<gameId>/<category>/<id>` → exact Fandom page title (or `{ file: '<exact File:Foo.png>' }` for items whose article has no `pageimages.original`). Fires first. **The only legitimate fallback path.** |
| 1 | `pageimages` on item name | The bare in-game name. Resolves the vast majority of items. |
| 2 | `pageimages` on `"<name> (<category>)"` | Per-category disambiguator (`fish`, `bug`, `fossil`). Catches items like "Frog" that need disambiguation from non-AC pages. |
| 3 | `list=search` + all-tokens filter + `pageimages` | Top 5 search hits, accepted only if every whitespace token of the item name appears in the candidate title (case-insensitive). Rejected candidates are surfaced in the resolver's notes for diagnosis. |
| 4 | HTML infobox fallback | Runs **only** against a page that step 1, 2, or 3 proved to exist but which had no `pageimages.original`. Never against a guessed title. `fetch-icons.ts` treats step-4 hits as misses (logged to `missing.txt`) so the override map stays the only legitimate fallback for committed binaries. |

### Why HTML fallback is restricted

It used to fire on any page that search returned. During the v2 ACGCN spike that produced a false positive: searching "Academic Painting" returned a paintings-listing page; the HTML fallback grabbed the first infobox image on that page (`Flowery_Painting.jpg`) and reported success. The image was real, the URL was valid, the resolver said OK — but the painting was wrong. Restricting the fallback to confirmed-real pages eliminates that class of failure. If a step-4 hit is needed, it should be promoted to `OVERRIDES` after a manual check.

### Why `basedOn` is NOT promoted to canonical for art

Tried in spike v3. It regressed `amazing-painting` (which previously worked at the bare in-game name) without fixing `academic-painting`. The reason: **the Fandom AC wiki indexes by in-game name, not by real-world artwork title.** There's a page at "Amazing painting" but no page at "The Night Watch" (its `basedOn`). For art, treat the in-game name as canonical and reach for `OVERRIDES` for the holdouts.

---

## The `OVERRIDES` map

### Shape

```ts
export const OVERRIDES: Record<string, Override> = {
  '<gameId>/<category>/<id>': '<exact Fandom page title>',
  '<gameId>/<category>/<id>': { file: '<exact File:Foo.png>' },
};
```

Two value forms:
- **String** — page title. Resolver runs `pageimages` against it.
- **`{ file }`** — direct `File:` lookup. Use when the page exists but has no `pageimages.original` (the `Dinosaur egg` case in ACGCN).

### When to add an entry

Whenever `scripts/missing.txt` is non-empty after a full scrape. Each line in `missing.txt` names one item that needs an override. Don't try to absorb misses by tightening the resolver — wiki naming drift is a fact of the source, not a bug to fix.

### How to find the right title

Manually, via the same MediaWiki API the resolver uses. From a terminal:

```bash
UA='animalcrossingwebapp-icon-spike/0.4'
# 1. Search for the item
curl -s -A "$UA" \
  "https://animalcrossing.fandom.com/api.php?action=query&list=search&srsearch=$(printf 'Clouded yellow' | jq -sRr @uri)&srlimit=5&format=json&formatversion=2" \
  | python3 -m json.tool
# 2. Pick the most plausible candidate, then verify it has a usable image
curl -s -A "$UA" \
  "https://animalcrossing.fandom.com/api.php?action=query&prop=pageimages&piprop=original&titles=Yellow%20butterfly&redirects=1&format=json&formatversion=2" \
  | python3 -m json.tool
```

If the page exists but `original` is missing, list the attached files and pick the right one:

```bash
curl -s -A "$UA" \
  "https://animalcrossing.fandom.com/api.php?action=query&prop=images&titles=Dinosaur%20egg&imlimit=10&format=json&formatversion=2" \
  | python3 -m json.tool
# → look for a File:<item name>.png entry; use { file: 'Dinosaur egg.png' }
```

Add the resolved title to `OVERRIDES`, re-run `fetch-icons.ts`, and confirm `missing.txt` empties out.

### Current ACGCN entries (4)

- `ACGCN/art/academic-painting` → `Academic painting` — Fandom uses lowercase second word; MediaWiki only auto-capitalizes the first character.
- `ACGCN/bugs/tiger-swallowtail-butterfly` → `Tiger butterfly` — Fandom drops the "Swallowtail" qualifier.
- `ACGCN/bugs/clouded-yellow-butterfly` → `Yellow butterfly` — Fandom uses the generic species page.
- `ACGCN/fossils/dinosaur-egg` → `{ file: 'Dinosaur egg.png' }` — page exists, `pageimages.original` doesn't.

---

## The 5% sample audit

After every scrape, `fetch-icons.ts` randomly samples ~5% of the resolved icons (across all categories) and checks that at least one significant token from each item's name appears in either the resolved page title or the source image filename. Items resolved via the `OVERRIDES` map are trusted (the curated title is the audit). The audit is logged to stdout; any failure halts the run with exit code 2.

This catches the class of failure where an item resolves to a structurally-valid URL belonging to the wrong content (e.g. a fish item resolving to an art image because of a search collision). It's a sanity check, not a guarantee — the right-hand-side defense is honest reading of the resolution log.

---

## Why Fandom and not Nookipedia

Considered Nookipedia first (it has a documented REST API with structured fields). Decided against it: it requires a free API key obtained out-of-band (Discord request) and there's no plan to maintain that credential. The Fandom MediaWiki API is keyless, attribution requirements are simple (CC BY-SA 3.0 with a link back), and a single source means a single attribution surface.

## Attribution

Item icons are sourced from the [Animal Crossing Fandom wiki](https://animalcrossing.fandom.com), used under CC BY-SA 3.0. Underlying IP is held by Nintendo. Full notice ships in `NOTICE` at the repo root and on the in-app `/credits` route in PR (c) of v0.9.1.
