# Decision Log

Reverse-chronological record of significant design and scope decisions. Newest first.

---

## 2026-05-03 — v0.9.0-beta locked decisions live in `docs/v0.9-plan.md`

**Decision:** The 10 locked design decisions for the v0.9 UI revamp (game immutability, Meadow-only theme, Settings = About + Danger only, sea creatures in StatsTab, `playerName` deprecation, ACNH-only hemisphere, native `confirm()`, `basedOn` art search, sea in GlobalSearchDropdown, scroll-to + highlight wiring) are recorded in `docs/v0.9-plan.md` section 4 rather than duplicated here.

**Why:** The plan doc is the canonical reference for v0.9 scope and is read alongside the design handoffs in `docs/design-handoffs/`. Splitting the decisions across two files would create two sources of truth. This log continues to capture decisions that don't sit inside an active plan doc (incident-driven, post-ship, scope tradeoffs).

**Pointer:** See `docs/v0.9-plan.md` § 4 "Locked Design Decisions" for the binding list.

---

## 2026-05-01 — Shadow size not surfaced in any UI — defer to v0.9 (Issue #59)

**Decision:** Defer adding shadow size display to v0.9. Do not add it to v0.8.2.

**Why:** During v0.8.2 release testing, Bea flagged that shadow size is absent from the UI. Investigation confirmed: `shadow` is present in the data (fish + sea creatures JSON) and in the `SeaCreature` type, but neither `CollectibleRow` nor `ItemExpandPanel` renders it. Adding the chip would be a net-new feature, not a bug fix — wrong scope for a release already in testing. Tracked as Issue #59.

**Relevant files:** `src/components/ItemExpandPanel.tsx` (add shadow chip here alongside habitat), `src/lib/types.ts` (add `shadow` field to `Fish` interface), `src/lib/utils.ts` (`rowSubtitle` returns `shadow` for sea_creatures but CollectibleRow never renders it for that category).

**Reversibility:** Straightforward addition in v0.9 — Issue #59 has the full implementation plan.

---

## 2026-05-01 — Issue #26 (art tab label) closed as cleanup, not a new fix

**Decision:** Close Issue #26 via PR #57 with a "cleanup" framing rather than claiming a new fix.

**Why:** During release testing, Bea couldn't reproduce the original #26 bug in v0.8.0 either, confirming the root repro was already fixed by PR #43's backdrop ghost-click fix (v0.8.0). PR #57 adds `setSelected(null)` to the tab-change `useEffect` as defensive state hygiene — it prevents an open art detail from lingering across tab switches — but it doesn't fix the originally reported symptom. Claiming "Fixed" would be misleading. The issue is closed because the symptom is gone, not because we fixed the described repro.

---

## 2026-05-01 — Ship Sea Creatures tab UI in v0.8.2 (supersedes 2026-04-23 deferral)

**Decision:** Ship the Sea Creatures tab in v0.8.2-alpha, not v0.9.

**Why:** v0.8.2 is a small incremental release explicitly scoped to deferred v0.8 work. The `feature/sea-creatures-tab` branch had a complete working implementation; the only work needed was conflict resolution against the v0.8.1 state (ItemExpandPanel, EditTownModal). With Bea working remotely and v0.9 gated on design collaboration, shipping sea creatures now was the right call — it's contained, well-tested, and the data has been live since v0.8.0.

**Supersedes:** 2026-04-23 entry below.

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

## 2026-04-23 — Ship Sea Creatures data without the UI tab in v0.8 *(superseded — tab shipped in v0.8.2, see 2026-05-01)*

**Decision:** Include Sea Creatures item data (40 ACNH entries, 35 ACNL entries) in the v0.8 release but hold the Sea Creatures tab UI for v0.9.

**Why:** Scope containment for v0.8. The data files (`public/data/acnh/sea_creatures.json`, `public/data/acnl/sea_creatures.json`) land cleanly without requiring any UI work — they simply aren't surfaced yet. Adding the tab UI would have extended the v0.8 scope and delayed release; the tab is straightforward to add in v0.9 once the data is confirmed correct.

**Alternatives considered:**
- **(a) Ship full Sea Creatures (data + UI tab) in v0.8** — deferred; would have pushed the release date and added risk to a version already touching React Router, hemispheres, and two new game datasets.
- **(b) Omit Sea Creatures data entirely from v0.8** — rejected; the data ships as inert JSON with no downside, and having it in the repo lets the tab UI be built and tested against real data in v0.9.

**Implementation:** Data shipped via PRs #34 (ACNL) and #35 (ACNH). UI shipped in v0.8.2 via PR #44 (Closes #56).

**Reversibility:** N/A — shipped.
