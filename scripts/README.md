# scripts/

Local-only tooling for one-shot data work. Nothing here runs at build time.

## `fetch-icons.ts` — scrape item icons from the Fandom AC wiki

Reads `public/data/<gameId>/{fish,bugs,fossils,art}.json`, resolves each item against the Fandom AC wiki, downloads the lead image, and writes:

- `public/icons/<gameId>/<category>/<id>.<ext>` — one file per item, source extension preserved (Fandom serves a mix of `.png` / `.jpg` / `.jpeg`).
- `public/icons/<gameId>/manifest.json` — `{ category: { id: filename } }` lookup for the consuming UI.
- `scripts/missing.txt` — items that fell off the algorithmic chain. Empty file means a clean run.

**Currently wired for ACGCN.** Future games: extend `GAME_ID` / `DATA_DIR` / `ICON_DIR` and re-run.

```bash
npx tsx scripts/fetch-icons.ts
```

Polite delay: ≥600 ms between API calls. A full ACGCN run takes ~3 minutes.

## `spike-fandom-coverage.ts` — coverage probe

Runs the resolver against a 10-item representative sample (1 art, 2 fossils incl. one per-piece, 3 fish, 3 bugs, including weird-name cases) and exits 0 only if ≥90% of items returned a usable image URL. Use before adding a new game to flag wiki-naming drift cheaply.

```bash
npx tsx scripts/spike-fandom-coverage.ts
```

## `lib/icon-resolver.ts` — shared resolver

Both scripts call into a single resolver. Lookup precedence:

1. **`OVERRIDES` map** — `<gameId>/<category>/<id>` → exact Fandom page title (or `{ file: '<exact File:Foo.png>' }` for items whose article has no `pageimages.original`). Fires first. **The only legitimate fallback path** — algorithmic misses are promoted here, not papered over by HTML scraping of guessed titles.
2. `pageimages` on the item name.
3. `pageimages` on `"<name> (<category>)"` if a per-category disambiguator is wired.
4. `list=search` on the name; `pageimages` on hits whose title contains every whitespace token of the name (case-insensitive). Rejected candidates are surfaced in the resolver's notes for diagnosis.
5. HTML infobox fallback — runs **only** against a page that an earlier step proved to exist but which had no `pageimages.original`. Never against a guessed title. `fetch-icons.ts` treats hits via this path as misses (logged to `missing.txt`) so the override map remains the only legitimate fallback.

### Adding a new override

When the spike or a full run logs a holdout, look up the canonical Fandom title manually (a `list=search` for the in-game name usually surfaces it within the first few hits) and add an entry to `OVERRIDES`:

```ts
'ACWW/bugs/some-bug': 'Some Bug',
// or, when the page exists but has no lead image:
'ACWW/fossils/something': { file: 'Something.png' },
```

Re-run `fetch-icons.ts`. `missing.txt` should empty out.

## Why Fandom and not Nookipedia

Decided against Nookipedia for the v0.9.x icon work: it requires a free API key obtained out-of-band and there's no plan to maintain that credential. The Fandom MediaWiki API is keyless, attribution requirements are simple (CC BY-SA 3.0 with a link back), and a single source means a single attribution surface.

## Attribution

Item icons are sourced from the [Animal Crossing Fandom wiki](https://animalcrossing.fandom.com), used under CC BY-SA 3.0. Underlying IP is held by Nintendo. Full notice ships in `NOTICE` at the repo root and on the in-app `/credits` route (PR (c) of v0.9.1).
