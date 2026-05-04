# Wiki-scraping pattern

Methodology for pulling item icons (and similar per-item assets) from a community wiki. Distilled from the v0.9.1 ACGCN scrape; intended to apply to every subsequent game's icon work (ACWW, ACCF, ACNL, ACNH) and to anything similarly shaped that comes after.

This doc is the *why*. The ACGCN-specific *how* lives in [`scripts/README.md`](../scripts/README.md). The full v0.9.1 scoping journal lives in [`docs/v0.9.1-icons-plan.md`](./v0.9.1-icons-plan.md) — read that for a worked example, including the dead ends.

---

## The shape of the problem

A community wiki has the assets we want. We have a list of in-game item names. The wiki was written by humans who didn't know about our list. Therefore:

- **Most items resolve trivially** by querying the wiki for a page at the in-game name. This is the happy path and it covers the vast majority of any real catalog.
- **A small tail does not.** The wiki uses different naming conventions for some items — abbreviations, dropped qualifiers, lowercase variants, generic species pages standing in for in-game-specific names, articles that exist but lack a structured lead image. This tail is irreducible: no clever query string makes it go away, because the mismatch is between two human-curated naming conventions.

The pattern below splits the problem along that fault line: an algorithmic resolver for the trivial majority, and a hand-curated overrides map for the tail.

---

## The principle

> **Algorithmic resolver for the easy items + a manually-maintained `OVERRIDES` map for the unresolvable tail. Every committed asset traces to one of those two paths — never to a guessed title.**

The algorithmic resolver is allowed to be clever, but only in ways that fail loudly. The overrides map is the only mechanism that's allowed to be ad hoc. This separation matters because:

1. The algorithmic side stays auditable. When a future game gets scraped, the same resolver runs end-to-end with the same logged behavior. Regressions are visible.
2. The overrides side is honest about what it is: ground truth that couldn't be derived. Each entry is a small piece of human knowledge about a specific wiki page. When a new game's tail surfaces a similar override, it's added as data, not as code.
3. There's no third path. The temptation to "just let the HTML fallback handle it" produces silent false positives — see [§ The honest-coverage rule](#the-honest-coverage-rule) for the worked example. Adding fancier resolver heuristics to chase the tail trades one false positive risk for a different one. Hand-curated overrides are the ceiling.

---

## The spike-before-scrape rule

Before scraping a new game's catalog, run a coverage spike against ~10 representative items. The spike is cheap (~1 minute) and saves committing 100+ wrong binaries.

### What goes in the sample

- **Coverage of every category** (1 art, 2 fossils, 3 fish, 3 bugs at minimum, plus sea creatures from ACNH onward).
- **At least one per-piece item** for fossils, to confirm whether the wiki indexes per-piece or only per-species.
- **At least one weird-name case per category.** Apostrophes, hyphens, dropped qualifiers, abbreviations, items whose in-game name is descriptive ("Pale Chub", "Tiger Swallowtail Butterfly", "Pop-Eyed Goldfish") — these are where wiki naming drift hides. The boring "Sea Bass" case will pass; that's not what's being measured.

### The 90% honest-coverage bar

If **honest** coverage (see next section) is ≥90%, the resolver is good enough to commit binaries. The remaining 1–2 items get hand-resolved into `OVERRIDES` after the full scrape surfaces them in `missing.txt`.

If honest coverage is <90%, **stop**. Don't tune the resolver in a third or fourth round trying to chase coverage — that's where false positives sneak in. Either:
- Look up the missing items manually right then and add overrides before the full scrape, or
- Surface the misses and propose a methodology change (different source, different naming convention).

---

## The honest-coverage rule

> **Reported counts lie. Audit the title→URL pairs.**

The script can say `9/10 OK` while one of those nine is actually wrong content. This happened in v2 of the ACGCN spike: `academic-painting` was reported as resolved, but the URL was `Flowery_Painting.jpg` — the HTML fallback had grabbed the first infobox image off a paintings-listing page. Structurally valid, semantically nonsense.

After every spike or scrape, **read the log**:

- Does the resolved page title share at least one significant token with the item name?
- Does the source image filename share at least one significant token with the item name?
- For items resolved via search or HTML fallback, does the path the resolver took make sense given what you know about the source?

A "yes" to all three is honest OK. A "no" anywhere is a false positive even if the script said OK.

The full scrape's audit step (random ~5% of hits, automatic) catches the worst of these but is not a substitute for reading the log.

---

## The algorithmic-ceiling signal

> **When honest coverage stops improving after a resolver iteration — or worse, regresses — the resolver has hit its ceiling. Stop tuning. Start adding overrides.**

The ACGCN spike journey (full detail in [`docs/v0.9.1-icons-plan.md`](./v0.9.1-icons-plan.md) §§8–10):

| Round | Honest coverage | What changed |
|-------|-----------------|--------------|
| v1 | 8/10 | bare name + per-category disambig |
| v2 | 8/10 (one false positive) | added `basedOn`, search, HTML fallback |
| v3 | 7/10 | promoted `basedOn` to canonical for art, tightened search, restricted HTML — coverage **regressed** |
| v4 | 10/10 honest | dropped `basedOn`-as-canonical, added a 2-entry `OVERRIDES` map |

The v3 regression was the signal. The change that was meant to fix `academic-painting` (promoting `basedOn` to canonical) broke `amazing-painting` instead — because the wiki indexes by in-game name, not by real-world artwork title. That's not a bug to refactor; it's structural information about the source. At that point the only sane move is to stop tuning and add overrides for the holdouts.

### Heuristics that proved unsafe and should not be retried

Recording these so a future me doesn't re-introduce them:

- **HTML infobox fallback against guessed titles.** Always trusts whatever the resolver landed on, even when search returned a listing page or a near-miss. Restricted to confirmed-real pages only.
- **Real-world artwork title as the canonical lookup for art.** The wiki documents in-game items, not paintings. The in-game name is canonical; the real-world title is decorative metadata.
- **Loose substring matching of search candidates.** Tightened to require *all* whitespace tokens of the query to appear in the candidate title. Without this, single-word matches drag in unrelated pages.

---

## Pattern shape

Every game's scrape script follows the same structure:

```
scripts/
  fetch-icons.ts            # game-specific entry point: GAME_ID, DATA_DIR, ICON_DIR
  spike-fandom-coverage.ts  # game-specific sample of ~10 items
  lib/
    icon-resolver.ts        # shared: resolution chain + OVERRIDES + audit helpers
public/icons/<gameId>/
  <category>/<id>.<ext>
  manifest.json             # { category: { id: filename } }
```

The shared resolver already exists at [`scripts/lib/icon-resolver.ts`](../scripts/lib/icon-resolver.ts) — extracted during the v0.9.1 ACGCN work. Adding a second game (ACWW) means:

1. Bump `GAME_ID` / paths in `fetch-icons.ts` (or split into per-game entry points if it's cleaner).
2. Build a 10-item ACWW sample for the spike. Pick weird-name cases by reading `public/data/acww/*.json` for the awkward ones.
3. Run the spike. If <90% honest, look up the missing titles before scraping.
4. Run the full scrape. Surface `missing.txt`. Add overrides under the `ACWW/...` key prefix.
5. Re-scrape. Confirm `missing.txt` empties out and the audit is clean.
6. Commit binaries + override additions, ship.

The first time a second game gets scraped, watch the `fetch-icons.ts` shape. If it grows enough per-game branching to feel awkward, split it into `fetch-icons-<game>.ts` — each game then supplies just its `GAME_ID`, paths, and a small list of category disambiguators. The shared resolver, the `OVERRIDES` map (one map across all games), and the audit logic stay in `lib/`.

---

## What stays out of the methodology

- **Image normalization** (resizing, padding to a uniform canvas, format transcoding). Worth doing eventually, but ships separately. Mixed-resolution icons are acceptable for the initial release of a game's icons; a normalization pass is a follow-up worth its own PR if at all.
- **Per-piece fossil disambiguation.** The Fandom wiki indexes fossils per species (one image for all three T. Rex pieces). Acceptable degradation for the algorithmic phase; per-piece variants are out-of-scope hand-art work.
- **Build-time scraping.** Never. Scrapers run locally, results commit as static binaries under `public/icons/`. CI doesn't hit external wikis.

---

## When to revisit this doc

- After scraping the second game (ACWW). Capture anything ACGCN didn't reveal — different-shaped naming drift, additional override value forms, scaling issues.
- If the source ever changes (Fandom shutters, the AC wiki migrates). The pattern is source-agnostic; the resolver chain is not.
- If a future game's catalog is large enough that ≥600 ms per-call delay starts to be a real cost. ACNH at ~330 items is still under 10 minutes; at the scale of "every villager + every furniture item" the delay budget needs revisiting.
