# Cutover Runbook — Going Public

The character creator currently has a client-side password gate (`dusty2026`) for
Andrew's preview phase. When Andrew confirms his Squarespace embed is live and
he's ready to make the page public, follow this runbook to remove the gate.

Estimated time: **5 minutes**, including verify.

---

## Pre-flight (do once, before any code changes)

Confirm with Andrew that he's:
- Embedded the iframe on his Squarespace page (or chosen the button-link path).
- Tested the wizard end-to-end in incognito with the password.
- Exported a PDF and visually verified it in Adobe Reader (not Preview, not
  the browser viewer — those have AcroForm rendering bugs).
- Ready to make the Squarespace page itself public to the world.

If any of those four are not yet true, **stop**. The password protects against
half-built pages getting indexed.

---

## Step 1 — Delete the gate from `src/App.vue`

**1a.** Remove the script-side state + handler (currently lines 18–31). Delete
the entire block:

```ts
// Password gate for preview deployments (client-side only, not real security)
const previewPassword = 'dusty2026'
const authenticated = ref(false)
const passwordInput = ref('')
const passwordError = ref(false)

function checkPassword() {
  if (passwordInput.value === previewPassword) {
    authenticated.value = true
    passwordError.value = false
  } else {
    passwordError.value = true
  }
}
```

**1b.** Remove the template-side gate (currently lines 128–152). Delete the
entire `<div v-if="!authenticated">…</div>` block, *including* the
`<!-- Password gate for preview -->` comment immediately above it.

**1c.** In the next sibling `<div>` (the character-sheet print view), change
`v-else-if="showSheet"` to `v-if="showSheet"`. The wizard `<div>` already uses
`v-else` and continues to work — no change needed there.

After these three edits, search the file for `authenticated`, `passwordInput`,
`passwordError`, `previewPassword`, and `checkPassword` and confirm zero
matches remain.

---

## Step 2 — Delete the env-var declaration from `src/env.d.ts`

Replace:

```ts
interface ImportMetaEnv {
  readonly VITE_PREVIEW_PASSWORD?: string
}
```

with:

```ts
interface ImportMetaEnv {}
```

The empty interface stays as a placeholder for future env vars. Don't delete
the surrounding `<reference types="vite/client" />` directive or the
`ImportMeta` declaration — those are Vite-required.

---

## Step 3 — Build + verify locally

```bash
npm test -- --run
npm run build
npm run preview
```

Open `http://localhost:4173` in a fresh tab. The wizard's Specialty step
should render immediately, with no password prompt. If you see "Enter access
code" you missed something in Step 1.

Then do a manual end-to-end run: build a character, export the PDF, and:

- **Programmatic field check** — `node scripts/inspect-pdf.mjs <path-to-PDF>`
  dumps every AcroForm field name and value. Quickest way to confirm the
  Inventory field merged user text + specialty items + bonus item, that the
  Skilled-1 column is populated, and no fields regressed.
- **Visual check in Adobe Reader** — Open the same PDF in Adobe Reader (not
  Preview, not the browser viewer — those have AcroForm rendering bugs).
  Scan for: inventory wrapping cleanly, talent grid readable, no overlap
  on Now/Total beyond the known InDesign issue, smart-punctuation rendering
  if the character includes any.

If `inspect-pdf.mjs` reports the right values but Adobe Reader shows
something off, the issue is in the InDesign template (not our code). Note
it in the post-launch follow-ups for Andrew.

---

## Step 4 — Commit + deploy

```bash
git checkout -b chore/remove-password-gate
git add src/App.vue src/env.d.ts
git commit -m "chore: remove preview password gate for public launch"
git push origin chore/remove-password-gate
```

Open the PR, merge to `main` (or whatever branch Vercel deploys to prod from),
and watch the Vercel deploy. Tail the deploy log until it shows green.

---

## Step 5 — Verify the live URL

```bash
# Should return 200 + content WITHOUT the access-code form
curl -s https://duster.occupiedhex.com | grep -ic "access code"
# Expected: 0
```

Also visit `https://duster.occupiedhex.com` in an incognito window — the
wizard should appear directly. No prompt, no gate.

If `grep` returns ≥1 or the gate still appears, see Rollback below. The most
common cause is a stale CDN cache; `curl -H 'Cache-Control: no-cache'` to
confirm.

---

## Rollback

```bash
git revert <merge-commit-sha>
git push origin main
```

Vercel auto-deploys the revert. The gate returns within ~1 minute. Tell
Andrew before reverting — his page will start showing the password prompt
again, which is confusing if he's not expecting it.

---

## After cutover — cleanup

Run `git log --oneline | head` and confirm:
- The cutover commit is present and merged.
- No lingering `feature/preview-password-*` branches.
- `docs/cutover-runbook.md` (this file) can stay; future engagements can copy
  the shape with a different password value and URL.

Update `docs/andrew-golive-checklist.md` to remove any "ask Watson to remove
the password" instruction — it's a one-time event and the checklist is going
into the cold-storage folder of past handoffs.
