# Decision Log

Reverse-chronological record of significant design and scope decisions. Newest first.

---

## 2026-04-30 — Grey out edit/new-town buttons on museum category tabs

**Decision:** Grey out (disable, not hide) the edit (pencil) and new-town (+) buttons in `TownSwitcher` when the active tab is a museum category tab (Fish, Bugs, Fossils, Art, Sea Creatures).

**Why:** `EditTownModal` and `CreateTownModal` are mounted inside `ACCanvas`, which only renders on the Home, Search, Activity, and Analytics tabs. Clicking the buttons on a category tab silently does nothing — a broken-feeling affordance. Rather than lift the modals to a layout-level component (the architecturally correct fix), we ship a visibly-disabled state that signals intentional design. The v0.9 UI revamp will redo this entire layer, so investing in the architectural fix now would be discarded work.

**Alternatives considered:**
- **(a) Lift modals to layout level** — correct fix, ~1 hr of work, but will be redone in v0.9 anyway; deferred on effort/lifespan grounds.
- **(b) Hide the buttons entirely on blocked tabs** — rejected; users wouldn't know the feature exists. Greying out preserves discoverability while communicating unavailability.

**Implementation:** PR #50 (`fix/edit-town-modal`) — `MODAL_BLOCKED_TABS` constant in `TownSwitcher.tsx` gates the disabled state.

**Reversibility:** Easy — remove the `MODAL_BLOCKED_TABS` check in `TownSwitcher.tsx` and the buttons re-enable everywhere `ACCanvas` renders.

---

## 2026-04-23 — Ship Sea Creatures data without the UI tab in v0.8

**Decision:** Include Sea Creatures item data (40 ACNH entries, 35 ACNL entries) in the v0.8 release but hold the Sea Creatures tab UI for v0.9.

**Why:** Scope containment for v0.8. The data files (`public/data/acnh/sea_creatures.json`, `public/data/acnl/sea_creatures.json`) land cleanly without requiring any UI work — they simply aren't surfaced yet. Adding the tab UI would have extended the v0.8 scope and delayed release; the tab is straightforward to add in v0.9 once the data is confirmed correct.

**Alternatives considered:**
- **(a) Ship full Sea Creatures (data + UI tab) in v0.8** — deferred; would have pushed the release date and added risk to a version already touching React Router, hemispheres, and two new game datasets.
- **(b) Omit Sea Creatures data entirely from v0.8** — rejected; the data ships as inert JSON with no downside, and having it in the repo lets the tab UI be built and tested against real data in v0.9.

**Implementation:** Data shipped via PRs #34 (ACNL) and #35 (ACNH). UI work lives on `origin/feature/sea-creatures-tab` (open as of 2026-04-30) — that branch is the starting point for v0.9 pickup.

**Reversibility:** Pickup in v0.9 — `origin/feature/sea-creatures-tab` already has a working prototype; merge it when v0.9 work begins.
