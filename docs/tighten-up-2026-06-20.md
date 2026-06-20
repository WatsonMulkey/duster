# Duster — Tighten-Up Report (2026-06-20)

Post-project review per the `/blueprint` pipeline (ADR-026). Inputs: `docs/ARCHITECTURE.md` (blueprinter brief @ `90a79b4`) + parallel reviews by `efficiency-shark` and `senior-dev-skeptic`, both read-only and code-verified. **No code was modified by this pipeline** — outputs are this report + the brief + Linear tickets.

Survey HEAD: `master` @ `90a79b4` (code identical to the shipped `13e7e63` + the brief commit). 130 Vitest tests pass, `vue-tsc -b` clean.

## How to read this
- **Both agents agreed on most leads** — those carry two-perspective confidence.
- The skeptic found **two correctness bugs not in the blueprinter's leads** (#1 level-down, and the App.vue test-gap meta-finding); the shark independently confirmed the dead-code surface is larger and more entangled than it looks.
- Several findings are **judgment calls for Watson/Andrew**, not mechanical fixes (game-rule values, dropped-vs-deferred features). Those are flagged ⚖️.
- The shark/skeptic explicitly cleared a set of leads as **actually fine** — listed at the bottom so nobody "fixes" them.

## Ranked findings

| # | Finding | Files | Impact | Effort | Source | Ticket |
|---|---------|-------|--------|--------|--------|--------|
| 1 | Level-down strands character in negative-XP / overspent (illegal) state | `App.vue:69`, `useCharacter.ts:125`, `TalentsStep.vue:65-90,127-137` | **High** (correctness) | S–M | skeptic (new) | FOI-504 |
| 2 | Inventory box goes stale if starting items change after first Details visit | `App.vue:92,99-104,119-123,147-149`, `duster-mapping.ts:118` | **High** (correctness/UX) | S–M | shark F8 + skeptic #2 | FOI-505 |
| 3 | Sheet ↔ PDF disagree: LUCK 4 vs 0, GHOST HAND 4 vs blank, HP, XP semantics | `CharacterSheet.vue:73,115,119`, `duster-mapping.ts:106-107,126`, `duster-intent.ts:49-55` | **High** (client-facing) ⚖️ | S–M | shark F5/F6 + skeptic #3/#7 | FOI-506 |
| 4 | Teke advanced talents (PUSH/PULL/RAZE/RUIN) permanently unselectable; a test asserts the hiding | `talent-prereqs.ts:26-29`, `talents.ts:290,298,306,322`, `talent-prereqs.test.ts:125-132` | **Med-High** (content) ⚖️ | S (rules change) | shark F7 + skeptic #4 | FOI-507 |
| 5 | Orphaned weapons subsystem (whole dead feature wired into sheet + PDF) | `WeaponsStep.vue`, `data/weapons.ts`, `useCharacter.ts:46,133-135,188`, `CharacterSheet.vue:19,221`, `duster-mapping.ts:119`, `duster-intent.ts:42`, `duster-samples.ts:38` | **Med** (dead surface) ⚖️ | M | shark F1 + skeptic #5 | FOI-508 |
| 6 | XP-cost ladders duplicated across 3 sites (gating vs display drift landmine) | `useCharacter.ts:17-22,30-34`, `TalentsStep.vue:11-16,23-27` | **Med** (drift; amplifies #1) | S | shark F4 + skeptic #8 | FOI-509 |
| 7 | `data/stress.ts` is dead data (never imported/rendered) | `data/stress.ts`, `types/index.ts:62`, `CharacterSheet.vue:107` | Low | S | shark F2 + skeptic #9 | noted |
| 8 | Unused composable/type surface (`useCharacter` getters, `ENERGY_SKILLS`) | `useCharacter.ts:170-188`, `types/index.ts:8-12`, `CharacterSheet.vue:26-30` | Low | S | shark F3 + skeptic #10 | noted |
| 9 | `allTalentRows` is a non-reactive `const` (latent if sheet ever shown live) | `CharacterSheet.vue:42-47` | Low (latent) | S | skeptic #6 (new) | noted |
| 10 | ADR-006 stale, `Proposed`, lives in parent repo, contradicts code | `../docs/decisions/006-duster-architecture.md` | Low-Med (doc) | S | shark F9 + skeptic #11 | noted |

⚖️ = contains a judgment call for Watson/Andrew (game rule or dropped-vs-deferred feature) — see detail.

---

## Detail

### 1 — Level-down → negative XP / illegal character (FOI-504) · High · correctness
**Reachable path:** set Level 3 (9 XP) → buy 9 XP of talents → change Level back to 1 (3 XP). `xpRemaining = xpTotal - xpSpent` goes to **−6** (`useCharacter.ts:125`); affordability gates only block *new* purchases and never demote existing talents (`TalentsStep.vue:65-90`); step-4's gate is unconditional `return true` (`App.vue:69`); the "(left)" hint only shows when positive (`TalentsStep.vue:137`), so the negative case is **silent**. The over-budget character then prints `XP 9/3` on the sheet and `XP=3` in the PDF.
**Both views:** skeptic found and verified it; it lives in `App.vue`, which has **zero tests** (see meta-finding). Amplified by #6 (two XP tables).
**Direction (⚖️ UX):** gate step 4 on `xpRemaining >= 0`, or auto-demote on level-down, or show a visible "over budget" warning. Silently auto-demoting may frustrate; shipping an illegal sheet is worse. Add `App.vue` wizard tests covering this as acceptance.

### 2 — Stale Inventory box after re-editing starting items (FOI-505) · High · correctness/UX
**Reachable path:** reach Details (box seeds with item set A) → Back → re-roll/change items to set B in `StartingItemsStep` → return to Details. The seed watcher fires only on the *first* Details transition, guarded by `inventorySeeded` (`App.vue:99-104`), so the box keeps set A. The box is the **single source of truth** for the PDF (`duster-mapping.ts:118`) → the export silently ships the old gear. Only "Reset to starting gear" recovers it, and nothing prompts the player.
**Both views:** shark F8 and skeptic #2 independently traced the same path. Both stress the constraint: the "never silently clobber edits" intent (`App.vue:88-91`) is deliberate, so the fix must preserve manual edits while catching the stale-roll case.
**Direction (⚖️ UX, touches the most recent design):** track a "manually edited" dirty flag; if items change after seeding and the box is *not* dirty, re-seed; if it *is* dirty, show a subtle "items changed — Reset?" hint. Do **not** silently re-seed (destroys edits).

### 3 — Sheet ↔ PDF value divergence (FOI-506) · High · client-facing ⚖️
Same character, two printouts, **different values**:
- **LUCK:** sheet hard-codes literal `4` (`CharacterSheet.vue:115`); PDF writes `'0'` (`duster-mapping.ts:126`). Both can't be the rule.
- **GHOST HAND:** sheet literal `4` (`:119`); PDF player-fill/blank (`duster-intent.ts`).
- **HP:** sheet shows `12`/`12` (`:98,102`); PDF intentionally blank (template label overlap — `duster-intent.ts:49-50`, defensible).
- **XP semantics:** sheet `xpSpent/xpTotal` (`:73`); PDF total `level*3` (`duster-mapping.ts:106-107`).
The `4`s are magic literals with no source comment — they read like leftover mock data (classic AI residue), since every other sheet value is prop-bound.
**Direction (⚖️ needs Andrew):** which is canonical — LUCK 4 or 0? GHOST HAND 4 or blank? Then make both renderers read one source (ideally `useCharacter`). HP-blank-in-PDF and XP single-cell may be deliberate template constraints — confirm, then add cross-reference comments so a future "fix" doesn't break parity.

### 4 — Teke advanced talents permanently unselectable (FOI-507) · Med-High · content ⚖️
`parseMasteryPrereq` matches only `^Mastery of the (.+?) talent[.,]?` (`talent-prereqs.ts:26`). Teke PUSH/PULL/RAZE/RUIN use `'Mastery in Teke: Soul Seer.'` ("in", no "talent") → parser returns `null` → talent filtered out (`TalentsStep.vue:53`). `talent-prereqs.test.ts:125-132` **asserts** the hiding. A second silent case: `talents.ts:322` `'Mastery of the Blade Master and Sneak talents.'` — the `and` form is also unparseable by the `or`-only splitter (`:28`).
**Direction (⚖️ needs Andrew):** is hiding Teke advanced talents at creation correct (maybe leveling-only), or an accidental exclusion? If takeable: teach the parser `Mastery in <X>` + `<A> and <B> talents`, then flip the test. If intended: add a comment in `talents.ts` so nobody "fixes" the data and re-breaks the test.

### 5 — Orphaned weapons subsystem (FOI-508) · Med · dead surface ⚖️
`WeaponsStep.vue` (73 lines) has **zero importers** — the wizard's step 5 is `StartingItemsStep`, not weapons. `state.weapons` is initialized and reset but **never populated by any mounted UI** (`useCharacter.ts:46`). Yet it flows to the PDF `Weapons` field (always `''`, `duster-mapping.ts:119`) and the sheet's `weaponSlots` prop (`App.vue:221`) — which the template **never renders**. `WeaponsStep.vue:36` even still titles itself "Starting Inventory", colliding with the real step. The build's INTENT invariant only passes because the "Happy" sample hard-codes weapons (`duster-samples.ts:38`) — the fixture masks the deadness.
**Entanglement (effort = M, not S):** `Weapons` is classified `app-fill` (`duster-intent.ts:42`); the mapping produces it; a sample covers it; `duster-mapping.test.ts:148-155` asserts on it; the `=== 81` field count is fixed. Clean removal = delete the component + `weapons.ts` + `getWeaponData`/`allWeapons` + the `weapons` state field + `weaponSlots` prop + `Weapon`/`WeaponSlot` types, **and** reclassify the `Weapons` PDF field to `player-fill` (the honest choice — players write weapons on paper).
**Direction (⚖️ needs Watson/Andrew):** was weapon selection a dropped feature or deferred? If it may return, keep `weapons.ts` as data and delete only the dead wiring. If dropped, remove the whole path.

### 6 — XP-cost ladders duplicated across 3 sites (FOI-509) · Med · drift landmine
`XP_COST_OTHER` (`useCharacter.ts:17-22`) is byte-identical to `XP_COST` (`TalentsStep.vue:11-16`); `XP_COST_STARTING` is in both (`useCharacter.ts:30-34`, `TalentsStep.vue:23-27`). The component does affordability **gating** from its copy; the composable computes displayed **`xpRemaining`** from another. Edit one and forget the other → the buttons let you pick a tier the header says you can't afford (or vice-versa), with no test to catch it (the copies are identical today). Directly amplifies #1.
**Direction:** hoist both ladders to one module (`data/xp-costs.ts`) and import in both places. Pure consolidation, no behavior change.

### 7–10 — Lower tier (noted, do opportunistically)
- **7 · `stress.ts` dead data** — `stressLevels`/`StressLevel` imported by nothing; sheet draws stress via literal `v-for="i in 4"` (`CharacterSheet.vue:107`). Delete, or wire descriptions into a tooltip if Andrew wants them surfaced. S.
- **8 · Unused composable/type surface** — `useCharacter` returns `isKeenSkill`/`getTalentData`/`getWeaponData`/`allSpecialties`/`allTalents`/`allWeapons`/`currentSpecialty` consumed by no caller (`useCharacter.ts:170-188`); `ENERGY_SKILLS` (`types/index.ts:8-12`) unreferenced while `CharacterSheet.vue:26-30` re-declares the same grouping. Prune, or make `CharacterSheet` import `ENERGY_SKILLS` as the single source. `getWeaponData`/`allWeapons` should go with #5. S.
- **9 · `allTalentRows` non-reactive** — plain `const` snapshot at setup (`CharacterSheet.vue:42-47`); works today only because the sheet unmounts/remounts per generation. A future live-preview would render a stale talent grid. Change to `computed`. S, latent.
- **10 · ADR-006 stale** — `../docs/decisions/006-duster-architecture.md` (parent repo) is `Proposed`, dated 2026-03-25, and contradicts shipped code (claims "no roll tables", `talents[4]`, non-existent files, `window.print()` PDF). Mark Superseded-by-`docs/ARCHITECTURE.md`, correct the claims, and ideally relocate a corrected ADR into `duster/docs/decisions/`. Doc-only, S.

## Meta-finding — the test blind spot
`App.vue` (the wizard spine: `canProceed`, the seed watcher, level handling) has **no test** — zero `.test.ts` references `App.vue`/`inventorySeeded`/`seedInventory`. Both genuine correctness bugs (#1, #2) live in exactly this untested file. Recommend `App.vue` wizard tests as acceptance criteria on FOI-504 and FOI-505.

## Data-content flag for Andrew (not a code bug)
`startingItems.ts:75` — `'A scattergun (+X dmg)'`. The literal **`X`** is the only non-numeric damage value among all loot items (everything else is `+0`/`+1`/`-2`); looks like an unresolved placeholder that will print verbatim into a player's inventory. Quick confirm with Andrew.

## Cleared by review — actually FINE (do not "fix")
- **WinAnsi/encoding guard** — robust; the only non-WinAnsi codepoints are in JSDoc comments / wizard-only DOM, never reach the PDF; smart-quotes in `talents.ts` are covered by `WINANSI_EXTRA_CODEPOINTS` (`engine.ts:108-113`). The guard is the codebase's best defensive feature.
- **Bonus-item auto-roll** — `onMounted` is guarded by `props.bonusItem === null` (`StartingItemsStep.vue:35-39`); rolls exactly once, survives back-nav. No double-roll.
- **Password gate** — plain compare vs `'dusty2026'` (`App.vue:20`), labeled cosmetic; in-scope, not a security finding.
- **HP blank in PDF** — intentional and documented (template label overlap).
- **`StartingItem.slotIndex` repeat-table logic** — correct replace-or-insert keyed on slot (handles RAMBLER `[3,3,4]`).
- **`Specialty.talent`** — NOT dead; `SpecialtyStep.vue:44` renders it as the starting-talent label.
- **`computeTalentRow` / `talentLabel` defensive fallbacks** — unreachable but cheap and commented; leave.

## Minor (not ranked)
- `talents.find(t => t.name === name)` repeated 5× (`CharacterSheet.vue:33`, `StartingTalentStep.vue:15`, `TalentsStep.vue:57`, `useCharacter.ts:130`, `duster-mapping.ts:41`) — a shared `findTalent(name)` helper would dedupe; do it only if already touching these files.
