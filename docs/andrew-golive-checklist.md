<!--
============================================================================
WATSON — PRE-EMAIL CHECKLIST (delete this block before sending)
============================================================================
Order matters: do the FOIL-side prep (docs/foil-side-prep.md) FIRST so you
have {{VERCEL_CNAME_TARGET}} to fill in below. Then replace placeholders.

  {{SUBDOMAIN}}            e.g. character.occupiedhex.com
  {{SUBDOMAIN_PREFIX}}     e.g. character    (just the subdomain part)
  {{VERCEL_CNAME_TARGET}}  e.g. cname.vercel-dns.com   (from Vercel UI)
  {{DNS_HOST}}             "Squarespace Managed" | external registrar name
  {{PLAN_TIER}}            "Business" | "Personal" | "Commerce" | "Other"
  {{PAGE_LOCATION}}        e.g. "a new page called Character Creator"
                                or "the existing /play page"

Conditional editing:
  - {{DNS_HOST}} == Squarespace Managed → delete the "External registrar"
    sub-section in Part 1.
  - {{DNS_HOST}} != Squarespace Managed → delete the "Squarespace Managed"
    sub-section in Part 1; keep "External registrar" and add registrar-
    specific UI labels if you know them.
  - {{PLAN_TIER}} in {Business, Commerce} → delete "Path B".
  - {{PLAN_TIER}} == Personal → delete "Path A".

The "Known limitations at launch" section is pre-filled with template-side
items confirmed by the 2026-04-27 pre-test. If Andrew's PDF-review reply
brought new items, append them under {{ADDITIONAL_LIMITATIONS_FROM_ANDREW_REPLY}}.
If everything's confirmed clean, replace that placeholder with "(none)".
============================================================================
-->

# Duster Character Creator — Go-Live Checklist

Hey Andrew —

This is the end-to-end "make the character creator live on your Squarespace
site" walkthrough. Should take about 30 minutes, most of which is waiting on
DNS to propagate. No code on your end.

**At a glance:**
1. Add one DNS record so `{{SUBDOMAIN}}` points at the character creator.
2. Embed (or link to) the creator from your Squarespace page.
3. Test in an incognito window with the password.
4. Tell Watson it looks good — he flips the switch and the page goes public.

If anything in this doc reads ambiguous, just reply with where you got stuck
and Watson will clarify or send a screenshot.

---

## Part 1 — Add the DNS record (≈ 5 min + propagation)

This is what makes `{{SUBDOMAIN}}` resolve to the character creator. You add
*one* CNAME record in your DNS host's dashboard.

Your DNS is hosted at **{{DNS_HOST}}**.

### Squarespace Managed

1. From your Squarespace dashboard, go to **Settings → Domains →
   `occupiedhex.com`**.
2. Click **DNS Settings** (or **DNS Records** depending on your dashboard
   version).
3. Click **Add Record** and fill in:
   - **Type:** `CNAME`
   - **Host:** `{{SUBDOMAIN_PREFIX}}` *(just the part before `.occupiedhex.com`
     — e.g., if `{{SUBDOMAIN}}` is `character.occupiedhex.com`, enter
     `character`)*
   - **Data / Target / Value:** `{{VERCEL_CNAME_TARGET}}`
   - **TTL:** leave default (4 hrs is fine)
4. **Save**.

### External registrar (Namecheap / GoDaddy / etc.)

Equivalent steps in your registrar's DNS panel — find "DNS records" or
"Advanced DNS", add a `CNAME` with host `{{SUBDOMAIN_PREFIX}}` pointing to
`{{VERCEL_CNAME_TARGET}}`, save.

### Wait for it to take effect

DNS changes usually propagate in 5–30 minutes, occasionally up to an hour.
You'll know it's live when `https://{{SUBDOMAIN}}` loads the password gate.
Until then it'll show a "site can't be reached" or a Vercel 404.

You can check propagation with [dnschecker.org](https://dnschecker.org) —
paste `{{SUBDOMAIN}}` and select CNAME from the dropdown. When it lights up
green across most regions, you're good.

---

## Part 2 — Put it on your Squarespace page

You're on the **{{PLAN_TIER}}** Squarespace plan. Use the matching path below.

### Path A — Inline embed (Business / Commerce plans)

Players never leave your site — the character creator appears right inside
your page.

1. Open your Squarespace editor and navigate to **{{PAGE_LOCATION}}**.
2. Click **+ Add Block** (or edit an existing section) and choose **Code**.
3. Paste this snippet exactly:

   ```html
   <iframe
     src="https://{{SUBDOMAIN}}"
     style="width: 100%; height: 1100px; border: 0; border-radius: 8px;"
     title="Duster Character Creator"
     allow="clipboard-write"
   ></iframe>
   ```

4. Click **Apply**, then **Save**.

**Height tuning.** `1100px` works for most desktops. If you see scrollbars
inside the iframe at common screen sizes, bump to `1200px` or `1300px`. On
mobile, players will scroll inside the iframe naturally — no separate tuning
needed.

### Path B — External link button (Personal plan)

Personal plan doesn't have Code Blocks, so we use a styled button that takes
players to the creator in a new tab.

1. Open your Squarespace editor and navigate to **{{PAGE_LOCATION}}**.
2. Click **+ Add Block** and choose **Button**.
3. Configure:
   - **Button text:** "Build a Duster Character" (or whatever wording fits)
   - **Link:** `https://{{SUBDOMAIN}}`
   - **Open in new tab:** ✓ on
4. Click **Apply**, then **Save**.

---

## Part 3 — Verify before you go public (≈ 10 min)

Before you make the Squarespace page itself public, walk through one full
character end-to-end while the password gate is still up.

1. Open **`https://{{SUBDOMAIN}}`** in a private / incognito window.
2. Enter the password: `dusty2026`.
3. Build a test character all the way through:
   - Pick a specialty (try **STITCH** — it has good test coverage)
   - Fill in keen skill, gift, starting talent, talents, items, name
   - Note the bonus item that auto-rolls on the Starting Items step
4. Click **Generate Sheet** at the end, then **Export Fillable PDF**.
5. **Open the downloaded PDF in Adobe Reader.** Not Preview (Mac), not the
   browser PDF viewer. Both of those render PDF AcroForms incorrectly and
   will make you think there's a bug when there isn't.
6. Spot-check the PDF:
   - Name + specialty match what you typed
   - Starting talent shows in the talent grid at the **Skilled** tier
   - All the items you rolled (specialty + bonus) are in the **INVENTORY** box
   - Smart punctuation (curly quotes, em-dashes) renders correctly if any
     showed up in the talent text
7. If the iframe path: also load your Squarespace page in incognito and
   confirm the embed appears, sized correctly, no scrollbars unless expected.

If anything looks off, screenshot the issue + the character data and email
Watson. He'll fix-and-redeploy without you needing to touch code.

**One edge case to know about.** Cross-origin iframes can occasionally have
trouble triggering file downloads in some browsers. We've verified the
end-to-end flow in Chrome (which is what the vast majority of your players
will use), but if a player ever clicks **Export Fillable PDF** inside the
iframe and nothing happens, tell them to open `https://{{SUBDOMAIN}}` in a
new tab and try again — same wizard, same button, but no iframe in the way.

---

## Part 4 — Going public

When you're satisfied with the test pass, email Watson:

> "Looks good — please remove the password gate."

Watson will:
1. Remove the gate (5 min, follows `docs/cutover-runbook.md`).
2. Deploy.
3. Confirm `https://{{SUBDOMAIN}}` loads directly with no prompt.
4. Reply confirming the page is live.

Then you make the corresponding Squarespace page public on your end (publish
draft / hide-from-navigation off / whatever your launch flow is). The whole
public-launch round-trip is usually under 30 minutes.

---

## After launch — what to expect

- **Updates from Watson.** If a player reports a bug or you want a tweak,
  Watson pushes the fix and it's live at `https://{{SUBDOMAIN}}` within a few
  minutes. You don't need to do anything — same URL, same iframe, just newer
  code behind it.
- **Player-reported issues.** Forward them to `watson@foil.engineering`. A
  screenshot + the rough character data they entered is enough to debug 95%
  of cases.
- **Adding more tools later.** If you build more Duster tools (an NPC
  generator, a loot roller, etc.) we can use the same pattern: same DNS host,
  same Squarespace page, different URL or sub-route.

---

## Known limitations at launch

These items are visible on the exported PDF and are tracked but **not
blocking** the launch. Each is a small InDesign-side fix you can roll into
your next template pass; we'll reverify with the new template when you send
it.

- **`Now` / `Total` HP boxes show `12OW` / `12TAL` overlap.** The static
  "NOW" / "TOTAL" labels live *inside* the field rectangles instead of above
  them, so any value we write collides with the label glyphs. Right now we
  leave both fields blank and the labels read cleanly. Template fix: move
  the labels to separate text annotations above the boxes.
- **`GHOST HAND` shows `4` by default.** That's the InDesign template's
  default value, not something we're writing. Fine if `4` is universally
  correct at character creation; if not, clear the default in the template.
- **Stress field `Stess 1` is misspelled in the template** (missing `r`).
  Cosmetic — players won't see the field name, only its position. Code has
  an alias so it still fills correctly when needed.
- **Talent description text truncates** in the talent grid cells when the
  description runs long (e.g. some Slinger / Gambler talents). The full
  text is always visible in the web app; the PDF is intentionally a quick
  reference. Template fix options: larger cells, smaller font, or
  "Shrink Text on Overflow".
- **`MENTAL` / `PHYSICAL` / `EMOTIONAL` boxes** look slightly off-center —
  they're configured as multiline + top-left in the template but we write a
  single `+1`. We override at the code layer (single-line, centered) and it
  renders well in Adobe Reader; if you want to clean up at the template
  level, set those to single-line centered fields.

{{ADDITIONAL_LIMITATIONS_FROM_ANDREW_REPLY}}

---

## Quick reference

| Thing | Value |
|---|---|
| Public URL (post-launch) | `https://{{SUBDOMAIN}}` |
| Preview password (until cutover) | `dusty2026` |
| DNS record to add | `CNAME` `{{SUBDOMAIN_PREFIX}}` → `{{VERCEL_CNAME_TARGET}}` |
| Bug reports | `watson@foil.engineering` |
| Update flow | Watson pushes; same URL stays live |

---

## Glossary (skip if you know these)

- **CNAME**: a DNS record type that says "this subdomain is an alias for that
  other domain". Adding `character.occupiedhex.com` as a CNAME pointing at
  Vercel makes `https://character.occupiedhex.com` serve the character
  creator without you hosting anything yourself.
- **AcroForm**: the form-field layer of a PDF (text inputs, checkboxes). Adobe
  Reader and Adobe Acrobat render this correctly. Apple Preview, Chrome's PDF
  viewer, and most third-party readers don't fully support it — fields can
  appear blank or render incorrectly even when the underlying data is right.
- **Iframe**: a way to embed one webpage inside another. Players see the
  character creator inline on your page; behind the scenes their browser is
  loading it from `{{SUBDOMAIN}}`.
