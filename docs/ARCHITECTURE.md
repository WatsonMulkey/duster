# Duster — Architectural Brief

> Generated artifact (the Blueprinter). Every structural claim is cited to a
> real `path:line`. Where the prior design docs disagree with the code, this
> brief documents **what the code does** and flags the drift. The prior version
> of this file, if any, lives in git history.
>
> Survey baseline: `master` @ `13e7e63`, 2026-06-20. Test suite: **130 passing**
> (`npx vitest run`). Typecheck: **clean** (`npx vue-tsc -b`, exit 0).

---

## 1. System Overview

Duster is a browser-based **one-shot character creator** for *Duster*, a
post-apocalyptic western tabletop RPG by **Andrew / Occupied Hex**. It is a
client deliverable, shipped and in real player use.

The mental model: a player walks a **7-step wizard** that collects their choices
(specialty → keen skill → gift → starting talent → additional talents → starting
items → final details). The wizard drives a single reactive `CharacterState`
object whose derived values mirror the formulas of Andrew's original
Excel/Google-Sheet creator. On completion the app renders a **live HTML
character sheet** (`CharacterSheet.vue`) that the player can **print**
(`window.print()`) or **export as a fillable PDF** that fills the publisher's
InDesign-originated template (`public/templates/character-sheet.pdf`,
historically `Mac_Sheet.pdf`).

Scope is deliberately narrow and is enforced by the code, not just documented:
**no auth** (only a cosmetic client-side password gate), **no persistence**
(state lives in memory; reload = start over), **no leveling** (creation-only).
Users are Andrew's players plus Andrew himself for review.

It is deployed as a static SPA on Vercel (project `duster`, see
`.vercel/project.json:1`), reachable at `duster-seven.vercel.app` behind a
client-side password gate.

---

## 2. Stack & Runtime Topology

- **Language/UI:** Vue 3 `<script setup>` SFCs + TypeScript. (`package.json:14-31`)
- **Build:** Vite 8 (`vite.config.ts`), with the Tailwind v4 Vite plugin
  (`@tailwindcss/vite`) and `@vitejs/plugin-vue`. No `tailwind.config.js` —
  Tailwind v4 is configured via the plugin and CSS (`src/style.css`).
- **PDF:** `pdf-lib` (`package.json:15`) for form-field filling. Loaded
  **dynamically** at export time so it stays out of the main bundle
  (`src/composables/useExportPdf.ts:18-21`).
- **Test:** Vitest 4 + `@vue/test-utils` + `happy-dom`
  (`package.json:22-29`).
- **Runtime topology:** entirely client-side. `src/main.ts:5` mounts `App.vue`
  into `#app`. There is **no backend, no API, no database** — all game data is
  baked into the bundle as TS modules under `src/data/`. The PDF template is a
  static asset fetched at runtime (`useExportPdf.ts:5`, `:23`).
- **Deploy:** `npm run build` → `vue-tsc -b && vite build` (`package.json:8`)
  produces a static `dist/` deployed to Vercel. The INTENT build invariant
  (§7) runs at `buildStart` and will **fail the build** if the PDF mapping and
  template drift apart.

There are no environment variables. The only secret-like value is the preview
password, hard-coded in source (`src/App.vue:20`).

---

## 3. Module Map

### `src/App.vue` — wizard/state spine and shell

The single orchestrator. Owns:
- **Password gate** (`App.vue:19-32`, `:154-177`) — cosmetic; see §6.
- **Step state** `currentStep` and the 7-label `steps` array
  (`App.vue:50-61`). Note the labels: step index 5 is `'Starting Inventory'`
  and index 6 is `'Details'`, even though the components rendered are
  `StartingItemsStep` and `InventoryStep` respectively (`App.vue:290-307`).
- **`canProceed`** (`App.vue:63-77`) — per-step gating. Step 5 requires the
  number of selected starting items to exactly equal the specialty's expected
  table count (`specialtyTables[specialty].length`). Step 6 requires a
  non-empty name.
- **Auto-select watchers** (`App.vue:80-86`) — when a specialty offers only one
  gift or one starting talent, that single option is auto-selected so the player
  isn't shown a one-option "choice".
- **Inventory-seed watcher** (`App.vue:92-109`) — the crux of the current
  inventory model (§4 / §10). The first time the player reaches the Details
  step, the single editable Inventory box is seeded once via
  `buildInventorySeed(...)`; thereafter it is the player's to edit and is never
  silently clobbered. `resetInventory()` (`App.vue:106-109`) re-pulls on demand,
  re-rolling a fresh 2d6 bolt count each time.
- **Actions:** `nextStep`/`prevStep`/`printSheet`/`exportFillablePdf`/`startOver`
  and the prop/event wiring to every step component (`App.vue:111-149`,
  `:254-308`).

Depends on: `useCharacter`, all seven wizard step components, `CharacterSheet`,
`Toast`, `useExportPdf`, `useToast`, `data/startingItems` (for the
`specialtyTables` count check), `data/defaultKit`.

### `src/composables/useCharacter.ts` — reactive state + derived formulas

Holds the single `reactive<CharacterState>` (`useCharacter.ts:37-51`) and the
`computed`s that replace the spreadsheet's VLOOKUP/IFS/COUNTIF chains. Key
derivations:
- `currentSpecialty`, `statBoost`, `keenSkillOptions`, `giftOptions`,
  `selectedGift`, `startingTalentOptions` — the specialty cascade
  (`useCharacter.ts:55-84`).
- `giftOptions` collapses to a single-element array for TEKE/WITCHLIKE (whose
  `gift2 === null`) (`useCharacter.ts:68-73`).
- `energyModifiers` — `+1` to the stat-boost group, 0 elsewhere
  (`useCharacter.ts:88-98`).
- **XP ladders** (`useCharacter.ts:17-34`, `:108-125`):
  - `XP_COST_OTHER` (Novice 2 / Skilled 3 / Expert 4 / Master 6) for the three
    additional talent slots.
  - `XP_COST_STARTING` (Skilled 0 / Expert 1 / Master 3) — the discounted ladder
    for the *starting* talent, which begins free at Skilled.
  - `xpTotal = level * 3`; `xpSpent` = starting-talent cost + sum of the three
    slot costs; `xpRemaining = xpTotal - xpSpent`.
- `hp` is a constant `12` (`useCharacter.ts:138`) — always 12 for a level-1
  creation-only character.
- `setSpecialty` resets dependent state on specialty change
  (`useCharacter.ts:142-150`); `reset` zeroes everything (`:152-166`).

The composable also exports `isKeenSkill`, `getTalentData`, `getWeaponData`,
`allSpecialties`, `allTalents`, `allWeapons` (`useCharacter.ts:168-189`) — none
of which are consumed by any caller (see §10).

### `src/components/wizard/*` — the seven steps

| Step | Component | Player action | Props / emits of note |
|---|---|---|---|
| 0 | `SpecialtyStep.vue` | Pick 1 of 12 specialties | `selected` / `select(name)` |
| 1 | `KeenSkillStep.vue` | Pick 1 keen skill from specialty options | `options,selected` / `select(skill)` |
| 2 | `GiftStep.vue` | Pick 1 of 2 gifts (or view the single one) | `options,selectedIndex` / `select(index)` |
| 3 | `StartingTalentStep.vue` | Pick the specialty's starting talent | `options,selected` / `select(name)` |
| 4 | `TalentsStep.vue` | Set level, advance starting talent, add up to 3 talents | see below |
| 5 | `StartingItemsStep.vue` | Pick/roll one item per specialty loot table + bonus | see §4 |
| 6 | `InventoryStep.vue` | Name, dominant hand, edit the seeded Inventory box | `name,inventory,hand` / `update:*`,`reset` |

`TalentsStep.vue` is the heaviest step component (231 lines). It owns its **own**
copies of the XP-cost ladders (`TalentsStep.vue:11-27`), affordability gating
(`canAffordTier`, `canAffordStartingTier`, `canAffordNewTalent`), and the
available-talent filter built on `data/talent-prereqs` (`TalentsStep.vue:47-54`).

### `src/components/CharacterSheet.vue` — the live sheet renderer

A pure presentational component (`CharacterSheet.vue:5-22`) that reproduces the
Mac_Sheet layout in HTML/CSS at `8.5in × 11in` (`:51`). It is the **print
target**. Structure: header (name/specialty/XP/LVL/gift), a stats row beside a
4×6 **body grid** (`:139-155`), an energy/skills column beside the **single
INVENTORY box** (`:181-187`), and the **talent grid** (`:191-226`). The talent
grid composes `allTalentRows` = `[startingTalent, ...talentSlots]`
(`:42-47`) and reveals tier columns progressively by tier
(`:209-217`). See §10 for hard-coded placeholder values in this component.

### `src/composables/` — supporting composables

- `useExportPdf.ts` — orchestrates the PDF export flow (§5), with toast UX and a
  "Copy error details" recovery action (`:85-110`).
- `useToast.ts` — a module-level `toasts` ref + `showToast`/`dismissToast`;
  success toasts auto-dismiss after 4s (`useToast.ts:18`, `:24-26`).

### `src/data/` — baked game data (source of truth: Andrew's Google Sheet)

| Module | Contents | Consumed by |
|---|---|---|
| `specialties.ts` | 12 specialties w/ statBoost, keen options, 1–2 gifts, starting talents | useCharacter, mapping, SpecialtyStep |
| `talents.ts` | 51 talents × 4 tiers + prerequisite string | useCharacter, mapping, sheet, TalentsStep, StartingTalentStep |
| `weapons.ts` | 25 weapons w/ damage/range/dodge | **WeaponsStep only (orphaned, see §10)** |
| `startingItems.ts` | 6 loot tables + `specialtyTables` map + `getTable` | StartingItemsStep, App.vue count check |
| `defaultKit.ts` | base kit + `roll2d6`/`buildInventorySeed` for the Inventory seed | App.vue |
| `talent-prereqs.ts` | pure prereq parser/satisfier (extracted for unit test) | TalentsStep |
| `stress.ts` | 4 stress levels | **nothing at runtime (dead, see §10)** |

### `src/pdf/` — PDF subsystem

Two layers (detailed in §5):
- `ttrpg-pdf-fill/` — a **reusable, Duster-agnostic engine** (fill + a
  build-time INTENT invariant check). Public surface re-exported from
  `index.ts`.
- `duster-*.ts` — the Duster-specific configuration that feeds that engine:
  `duster-intent.ts`, `duster-mapping.ts`, `duster-aliases.ts`,
  `duster-overrides.ts`, `duster-samples.ts`.

---

## 4. Data Flow & State — where truth lives

There is **one** mutable store: the `reactive<CharacterState>` inside
`useCharacter()` (`useCharacter.ts:37-51`, shape at `types/index.ts:68-84`). It
is created once and threaded through `App.vue` to every step via props +
explicit `update:` events (Vue's one-way data flow; the composable's state is
the single source of truth). No Pinia/Vuex, no localStorage, no URL state —
reload discards everything, which is intentional for a one-shot tool.

### Starting items, bonus item, and the Inventory box

This is the subtlest part of the data model and the focus of the most recent
work (commits `1b89773`, `13e7e63`).

- **Starting items** (`startingItems.ts`): each specialty maps to an ordered
  list of loot-table IDs, e.g. `RAMBLER: [3,3,4]` (`startingItems.ts:83-96`).
  Repeats are significant — Rambler rolls table 3 **twice**. To keep two slots
  on the same table distinct, a `StartingItem` carries a `slotIndex`
  (`types/index.ts:100-101`); `StartingItemsStep` keys all selection logic on
  `slotIndex` (`StartingItemsStep.vue:62-79`).
- **Bonus item** (`bonusItem`): every character gets exactly one random
  specialty-agnostic bonus item, rolled once on mount and never re-rolled
  (`StartingItemsStep.vue:22-39`). It has no `slotIndex`.
- **The Inventory box is the single source of truth for the PDF.** On first
  arrival at the Details step, `App.vue:99-104` seeds `state.inventory` once via
  `buildInventorySeed(startingItems, bonusItem, roll2d6())`
  (`defaultKit.ts:44-56`): the base kit (with a rolled 2d6 bolt count), then the
  rolled specialty items, then the bonus — one per line. After seeding it is a
  free-text `<textarea>` the player edits (`InventoryStep.vue:66-72`).
  The PDF mapping passes `state.inventory` through **verbatim** and explicitly
  does **not** re-merge `startingItems`/`bonusItem` (which would double-list
  them) — `duster-mapping.ts:114-118`.

### Edge cases baked into the data

- **TEKE / WITCHLIKE single gift:** their `gift2 === null`
  (`specialties.ts:182`, `:195`), so `giftOptions` is length-1 and the gift is
  auto-selected (`App.vue:80-82`); the mapping resolves the gift name
  regardless of `selectedGiftIndex` (`duster-mapping.ts:44-51`).
- **HP and XP semantics on the sheet vs. PDF differ** (see §10): the live sheet
  shows `xpSpent/xpTotal`; the PDF writes `XP = level*3` (the *total*) into a
  single field (`duster-mapping.ts:106-107`).

---

## 5. The PDF Subsystem (External-ish integration: the InDesign template)

The "external contract" here is the publisher's PDF template — an InDesign
export the app does not control. The whole subsystem exists to fill that
template safely despite its quirks (typo'd field names, baked-in labels, fields
that should be multiline but aren't).

### Reusable engine — `src/pdf/ttrpg-pdf-fill/`

- **`engine.ts` — `fillCharacterSheet(opts)`** (`engine.ts:136-207`):
  1. Loads the template via `pdf-lib`, gets the form.
  2. Runs the supplied `mapping(state)` to produce a
     `Record<fieldKey, FieldValue>`.
  3. For each key: normalizes the value (`engine.ts:84-89`), resolves it through
     `fieldAliases` (`engine.ts:91-93`), looks up the field (throwing
     `UnknownFieldError` if absent — `engine.ts:152-161`), then sets text or
     checks/unchecks. **Radio and choice fields throw `NotYetImplementedError`**
     (`engine.ts:193-199`) — v1 supports only text + checkbox.
  4. **Strict WinAnsi guard** (`assertWinAnsi`, `engine.ts:115-132`): every text
     value is validated against the CP1252 repertoire, including the smart-
     punctuation codepoints in the `0x80–0x9F` gap (`engine.ts:108-113`). A
     non-WinAnsi char throws `EncodingError` rather than silently mojibake-ing
     into the PDF. This is the engine's most defensible safety feature.
  5. Embeds Helvetica and calls `form.updateFieldAppearances(helv)` so values
     actually render (`engine.ts:203-204`).
- **`vite-plugin.ts` — the INTENT build invariant** (`vite-plugin.ts:22-136`):
  a Vite plugin that runs at `buildStart`. It reads the *actual* template's
  field names, unions the mapping output across all sample states, resolves both
  through aliases, and enforces six invariants:
  1. Every PDF field must be classified in INTENT (else fail).
  2. Every INTENT key must exist in the PDF (else fail — catches typos).
  3. `app-fill` field with no produced value → fail.
  4. `player-fill` field that the mapping *does* produce → fail.
  5. `template-artifact` field that the mapping produces → fail.
  6. `calculated-stub` field that now produces a value → warn (suggest upgrade).
  There is an escape hatch (`config.skip` or `TTRPG_PDF_INTENT_SKIP=1`,
  `vite-plugin.ts:122-125`) for emergency releases.

### The INTENT classification system

Every one of the template's **81 fields** is given one of four intents
(`engine.ts:25-30`, classified in `duster-intent.ts:26-134`):
- **`app-fill`** — the app computes and writes it (identity, XP, energy mods,
  inventory/weapons, LUCK, 9 keen checkboxes, 16 talent-grid cells = 39 fields).
- **`player-fill`** — left blank for the player to fill on paper/Reader (the
  24-cell body damage grid, 12 tier markers, 4 stress pips, HP Now/Total,
  RESOURCE, GHOST HAND).
- **`template-artifact`** — an InDesign export bug; nothing should write to it.
- **`calculated-stub`** — known-future app-fill, currently unwritten (warn-only).

`duster-intent.ts:137-143` hard-asserts exactly **81** entries at import time, so
any template field add/remove breaks loudly.

### The field-alias typo layer — `duster-aliases.ts`

The InDesign template ships with a literal typo: the first stress field is named
`"Stess 1"` (missing the `r`). Rather than propagate the typo into mapping code,
`duster-aliases.ts:6-8` maps the clean key `'Stress 1' → 'Stess 1'`. Both the
engine (`engine.ts:149`) and the build check (`vite-plugin.ts:53-57`) resolve
through aliases, so authors write the correct spelling and the typo is confined
to one line. INTENT itself still uses the PDF literal `'Stess 1'`
(`duster-intent.ts:130`) so invariant 2 passes without an alias.

### `duster-mapping.ts` — the Duster `CharacterState → fields` function

Produces the 39 app-fill values (`duster-mapping.ts:96-153`). Notables: keen
skill → one of nine `Check Box8`…`Check Box16` checkboxes (note: **no space**
between `Box` and digit — `duster-mapping.ts:22-32`); energy modifiers emit
`'+1'` or empty string, deliberately **not** `'+0'`, to match the CSV samples
(`:53-61`); talent rows render `name\n<novice>` in column 1 and reveal later
tiers by the chosen tier (`computeTalentRow`, `:70-94`). `computeTalentRow` has a
defensive fallback: if a talent name can't be found in `talents`, it still emits
the bare name so nothing silently vanishes (`:76-79`).

### `duster-overrides.ts` — per-field rendering fixes

`pdf-lib` field-property overrides that work around template bugs: Inventory and
Weapons forced multiline; the three energy-modifier fields forced single-line +
centered; the four talent name/novice cells forced multiline
(`duster-overrides.ts:9-27`). Documented as a stopgap pending InDesign fixes.

### `duster-samples.ts` — fixtures that *are* the build contract

13 `CharacterState` fixtures (`duster-samples.ts:24-113`) chosen so their union
exercises every app-fill field: a happy path, the two single-gift specialties,
an empty-inventory case, and one per keen skill (to cover all nine checkboxes).
The INTENT plugin fails the build if these samples don't collectively produce
every declared `app-fill` field — so these fixtures are a load-bearing part of
the build, not just tests.

### Export flow (the second key journey: state → PDF)

`useExportPdf.ts`: on button click, `handleExport(state)` (`:73-114`)
dynamically imports the engine + `duster-*` config (keeping `pdf-lib` out of the
initial bundle — `:18-21`), fetches the template from
`/templates/character-sheet.pdf` (`:23`, erroring clearly if the asset is
missing — `:24-29`), calls `fillCharacterSheet`, then triggers a blob download
named `duster-<sanitized-name>.pdf` (`:78`, sanitizer at `:41-45`). Errors
surface as a toast with a "Copy error details" action that copies a JSON blob
including the failing field, stack, full state, and user-agent
(`:89-108`) — a genuinely useful client-support affordance.

---

## 6. Cross-Cutting Concerns

- **"Auth":** the password gate (`App.vue:19-32`) compares against a string
  literal `'dusty2026'` (`App.vue:20`) baked into the client bundle. It is
  explicitly labeled "client-side only, not real security" in the source. It
  keeps casual visitors out of a preview URL; it is not a security boundary and
  must not be treated as one.
- **Error handling:** the PDF engine uses a typed error hierarchy
  (`PdfFillError` and subclasses, `engine.ts:44-74`) and the export composable
  catches everything into a recoverable toast. The wizard itself has little
  defensive code because invalid states are largely prevented by `canProceed`
  gating and auto-selection.
- **Logging:** only `console.error('[ttrpg-pdf-fill]', err)` on export failure
  (`useExportPdf.ts:110`). No analytics, no telemetry (consistent with the ADR's
  "no analytics" note).
- **Config/env:** none. No `.env`, no runtime config; everything is compile-time
  constants.
- **Print/PDF parity:** two independent renderings of the same character exist —
  the HTML sheet (`CharacterSheet.vue`, for `window.print()`) and the filled
  PDF (`duster-mapping.ts`). They are **not** derived from a shared layer, so
  they can and do diverge (see §10).
- **Offline/PWA:** none. Plain SPA.

---

## 7. Build, Test & Deploy

- **Build:** `npm run build` = `vue-tsc -b && vite build` (`package.json:8`).
  The `vue-tsc` step typechecks (project refs `tsconfig.app.json` /
  `tsconfig.node.json`); the `vite build` step runs the **INTENT plugin at
  `buildStart`** (`vite.config.ts:18-24`), which will abort the build on any
  mapping/template drift. Verified clean: `npx vue-tsc -b` → exit 0.
- **Tests:** `npm test` = `vitest run`. **130 tests across 10 files, all
  passing** (verified). Coverage by area:
  - PDF engine (`engine.test.ts`) — builds synthetic in-memory PDFs and asserts
    text/checkbox fill, the WinAnsi guard, unknown-field and not-implemented
    errors.
  - INTENT plugin (`vite-plugin.test.ts`) — each of the six invariants against
    fixture PDFs.
  - Duster mapping + intent (`duster-mapping.test.ts`, `duster-intent.test.ts`)
    — identity/XP/energy/gift/talent mapping and the 81-field count.
  - Talent prereqs (`talent-prereqs.test.ts`) — the parser and the variant-2A
    availability rule, **including explicit assertions that `Mastery in …` and
    `+1 in …` prereqs are HIDDEN** (`talent-prereqs.test.ts:125-141`).
  - Starting items, default kit, inventory step, toast, export composable.
  - **Coverage gaps:** `App.vue` (the wizard spine, `canProceed`, the seed
    watcher) has no component test; `CharacterSheet.vue` has no render test;
    `useCharacter.ts` (the XP ladder math) is exercised only indirectly.
- **Deploy:** static `dist/` to Vercel project `duster`
  (`.vercel/project.json`). No `vercel.json`; default static build. PDF template
  and logo ship from `public/`.
- **The Figma-capture `index.html`:** the working tree carries an *uncommitted*
  modification to `index.html` (a Figma/Code-to-Canvas capture variant). The
  committed `index.html` is the normal Vite entry. This brief does not touch it.

---

## 8. Dependency Inventory

Runtime (`package.json:14-17`):
- **`vue` ^3.5.30** — the framework. Core.
- **`pdf-lib` ^1.17.1** — fills the PDF form template. The only non-trivial
  runtime dep; code-split out of the main bundle (`useExportPdf.ts:18`). Note
  `pdf-lib` 1.17.1 is the long-standing last release; fine, but unmaintained
  upstream — worth knowing for the future engineer.

Dev (`package.json:18-31`): `vite` 8 + `@vitejs/plugin-vue` 6, `tailwindcss` 4
+ `@tailwindcss/vite`, `typescript` 5.9 + `vue-tsc` + `@vue/tsconfig`,
`vitest` 4 + `@vitest/ui` + `@vue/test-utils` + `happy-dom`, `@types/node`.

Nothing looks vestigial in the manifest — the dependency list is unusually lean
for the surface area. (The vestigial code lives *inside* `src/`, not in deps;
see §10.)

---

## 9. Conventions & Idioms

- **Data flow:** state lives in one composable; components are dumb and
  communicate via `defineProps` + `defineEmits` with explicit `update:*` events.
  No two-way `v-model` on the shared state object.
- **Pure logic extracted for testing:** the prereq rules
  (`data/talent-prereqs.ts`) and the inventory seed (`data/defaultKit.ts`) are
  pure functions with injectable RNG (`rng: () => number = Math.random`) so they
  can be unit-tested deterministically. Match this pattern for new logic.
- **Game data shape:** specialty/talent/weapon names are **UPPERCASE** strings
  used as identity keys; lookups are `.find(x => x.name === name)` and
  comparisons are case-normalized at the boundary (`.toUpperCase()`).
- **PDF authoring rule:** author mapping/INTENT with clean field names; confine
  every template typo to `duster-aliases.ts`. Every PDF field must be classified
  in `duster-intent.ts` or the build fails — keep that file in sync with the
  template, and update the `=== 81` assertion if the template changes.
- **Strict encoding:** any string written to the PDF must be WinAnsi-safe; the
  engine enforces this. Don't pass raw user emoji/CJK into PDF fields.
- **Tailwind v4 via plugin**, utility-first, no separate config file.

---

## 10. Review Leads

For downstream tighten-up reviewers (efficiency-shark + senior-dev-skeptic).
Each lead is an observation with a citation — no recommendations.

1. **The ADR is badly stale and lives outside this repo.** The architecture
   decision record is `C:\Users\watso\Dev\docs\decisions\006-duster-architecture.md`
   (the *parent* monorepo, not `duster/docs/decisions/` which does not exist).
   Its status is **`Proposed`**, dated 2026-03-25 — not "Accepted". It predates
   the entire starting-items/inventory and dominant-hand work and contradicts
   the code on multiple points: it says "No starting item roll tables" (there
   are six, `startingItems.ts`), lists `talents[4]` (the array is 3 slots,
   `useCharacter.ts:44`), names files that don't exist (`gifts.ts`, `skills.ts`,
   `WizardNav.vue`) and a `WeaponsStep`/PDF-via-`window.print()` design the code
   has since superseded (PDF is now `pdf-lib`, not browser print). Treat the ADR
   as a historical artifact, not a spec.

2. **`WeaponsStep.vue` is fully orphaned dead code.** It exists
   (`src/components/wizard/WeaponsStep.vue`, 73 lines) and imports the 25-entry
   `weapons.ts`, but **nothing imports it** (zero hits for `WeaponsStep`). The
   wizard's step 5 is `StartingItemsStep`, not weapons. Consequently
   `state.weapons` is initialized to `[]` (`useCharacter.ts:46`) and **never
   populated by any UI** — yet it is still mapped to the PDF `Weapons` field
   (`duster-mapping.ts:119`, always empty), rendered into the sheet's
   `weaponSlots` prop (`CharacterSheet.vue:19`, unused in template), and the
   whole `weapons.ts` data module + `getWeaponData` exist only to serve this
   dead path.

3. **`src/data/stress.ts` is dead data.** `stressLevels` is exported and typed
   but imported by nothing at runtime (only `src/data/stress.ts:3` references
   it). The sheet draws four empty stress boxes by literal `v-for="i in 4"`
   (`CharacterSheet.vue:107`) and never uses the descriptions.

4. **The live HTML sheet hard-codes values the PDF computes — they disagree.**
   `CharacterSheet.vue` prints **LUCK = `4`** (`:115`) and **GHOST HAND = `4`**
   (`:119`) as literal text, while the PDF mapping writes **LUCK = `'0'`**
   (`duster-mapping.ts:127`) and leaves GHOST HAND player-fill. So the printed
   HTML sheet and the exported PDF show different luck values for the same
   character. (Same risk class: HP renders `12` in both Now and Total boxes on
   the sheet — `CharacterSheet.vue:98`,`:102` — but is left blank in the PDF by
   design, `duster-intent.ts:49-50`.)

5. **XP semantics differ between the two renderings.** The sheet shows
   `xpSpent/xpTotal` (`CharacterSheet.vue:73`); the PDF writes a single `XP =
   level*3` total (`duster-mapping.ts:106-107`). Both are intentional per their
   comments, but a reviewer should confirm Andrew expects "spent/total" on print
   and "total only" in the PDF — it's an easy place for a client complaint.

6. **The XP-cost ladders are duplicated across three files and can drift.** The
   same Novice/Skilled/Expert/Master cost table appears in
   `useCharacter.ts:17-22` (`XP_COST_OTHER`) and `TalentsStep.vue:11-16`
   (`XP_COST`), and the starting-talent ladder appears in `useCharacter.ts:30-34`
   and `TalentsStep.vue:23-27`. The component does its affordability math from
   its own copy while `useCharacter` computes `xpRemaining` from its copy; if one
   table is edited and the other isn't, the gating and the displayed remaining-XP
   silently disagree.

7. **Teke characters can never take their advanced Teke talents in this tool —
   by design, but it's a real content gap.** `parseMasteryPrereq` only matches
   `Mastery of the X talent.` (`talent-prereqs.ts:25-29`). The Teke talents
   PUSH/PULL, RAZE, RUIN use the phrasing `Mastery in Teke: Soul Seer.`
   (`talents.ts:290`,`:298`,`:306`), which returns `null` and is therefore
   filtered out of the dropdown (and `talent-prereqs.test.ts:125-132` *asserts*
   this hiding). So a Teke player cannot select those talents at creation. This
   is consistent and tested, but a reviewer should confirm with Andrew it's
   acceptable rather than an accidental exclusion.

8. **`canProceed` step 5 couples to data-shape, and the seed watcher is
   order-fragile.** The gate at `App.vue:70-73` recomputes "expected item count"
   from `specialtyTables[...].length` independently of how `StartingItemsStep`
   counts slots; the inventory seed fires only on the *first transition into*
   the Details step via `watch(currentStep, …)` (`App.vue:99-104`) guarded by a
   separate `inventorySeeded` boolean that `startOver` must remember to reset
   (`App.vue:138`). The seed correctness depends on `startingItems`/`bonusItem`
   already being final when that watcher fires; a reviewer should check whether
   any path (e.g. editing items after first reaching Details) can leave the box
   and the rolled items out of sync, since the box becomes authoritative the
   moment it's seeded.

9. **Unused composable surface.** `useCharacter` returns `isKeenSkill`,
   `getTalentData`, `getWeaponData`, `currentSpecialty`, `allSpecialties`,
   `allTalents`, `allWeapons` (`useCharacter.ts:168-189`); `App.vue`'s destructure
   (`:34-48`) consumes none of them, and no other caller exists. `ENERGY_SKILLS`
   (`types/index.ts:8-12`) is likewise exported but unreferenced. Low-stakes, but
   it's surface that looks load-bearing and isn't.
