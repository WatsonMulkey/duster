<!--
============================================================================
WATSON — PRE-EMAIL CHECKLIST (delete this block before sending)
============================================================================
This is the NO-SUBDOMAIN variant of the client go-live checklist.
The WITH-SUBDOMAIN variant lives in docs/andrew-golive-checklist.md.

Pick this variant when:
  - Client doesn't want (or doesn't need) a custom-branded URL.
  - Client said "whatever is easiest" on subdomain — this is materially
    less work for both sides.
  - Time-to-launch matters more than URL aesthetics.

Pick the WITH-SUBDOMAIN variant when:
  - Client expects a branded URL (character.clientdomain.com).
  - Engagement spans a tool family and the subdomain becomes a parent URL.
  - Client has DNS access and wants the cleanliness of their own domain.

Placeholders to fill:
  {{DEPLOY_URL}}           e.g. duster-seven.vercel.app
                                (the Vercel-served URL, no protocol)
  {{PLAN_TIER}}            "Business" | "Personal" | "Commerce" | "Other"
  {{PAGE_LOCATION}}        e.g. "a new unlisted page (e.g.
                                 /duster-character-creator) linked as a
                                 button on your existing /duster-resources
                                 page"

Conditional editing:
  - {{PLAN_TIER}} in {Business, Commerce} → keep "Path A"; delete "Path B".
  - {{PLAN_TIER}} == Personal → keep "Path B"; delete "Path A".

The "Known limitations at launch" section is pre-filled with template-side
items confirmed by the 2026-04-27 pre-test. If the client's PDF-review
reply brought new items, append them under
{{ADDITIONAL_LIMITATIONS_FROM_REPLY}}. If everything's confirmed clean,
replace that placeholder with "(none)".
============================================================================
-->

# Duster Character Creator — Go-Live Checklist

Hey Andrew —

This is the end-to-end "make the character creator live on your Squarespace
site" walkthrough. Should take about 15 minutes. No code on your end, and
no DNS work — the creator is already live at its hosting URL; we just point
your page at it.

**At a glance:**
1. Add an unlisted page on Squarespace and embed the creator on it.
2. Add a button to your existing `/duster-resources` page that links to
   the new page.
3. Test in an incognito window with the password.
4. Tell Watson it looks good — he flips the switch and the page goes public.

If anything in this doc reads ambiguous, just reply with where you got stuck
and Watson will clarify or send a screenshot.

---

## Part 1 — Add the embed page

You're on the **{{PLAN_TIER}}** Squarespace plan. Use the matching path below.

### Path A — Inline embed (Business / Commerce plans)

Players never leave your site — the character creator appears right inside
your page.

1. In Squarespace, create **{{PAGE_LOCATION}}**. Mark the page **unlisted**
   (not in main navigation) for now — we'll keep it private until you've
   verified the test pass.
2. Open the new page in the editor. Click **+ Add Block** and choose **Code**.
3. Paste this snippet exactly:

   ```html
   <iframe
     src="https://{{DEPLOY_URL}}"
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

1. In Squarespace, open the page where you want the button — could be your
   existing `/duster-resources` page directly. No need for a separate
   embed page on this plan.
2. Click **+ Add Block** and choose **Button**.
3. Configure:
   - **Button text:** "Build a Duster Character" (or whatever wording fits)
   - **Link:** `https://{{DEPLOY_URL}}`
   - **Open in new tab:** ✓ on
4. Click **Apply**, then **Save**.

If you choose Path B, skip Part 2 below — the button IS the link.

---

## Part 2 — Add the button on your resources page

(Path A users only — Path B users already added the button in Part 1.)

1. Open your existing `/duster-resources` page in the Squarespace editor.
2. Add a new entry matching the style of the other tool buttons on the page.
3. Configure the button:
   - **Button text:** "Build a Duster Character" (or whatever wording fits)
   - **Link:** the unlisted page you created in Part 1
4. Save.

The button stays unlisted-page-linked until you make the new page public
(Part 4).

---

## Part 3 — Verify before you go public (≈ 10 min)

Before you make the embed page public, walk through one full character
end-to-end while the password gate is still up.

1. Open **`https://{{DEPLOY_URL}}`** in a private / incognito window.
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
7. Path A only: also load your unlisted Squarespace page in incognito and
   confirm the embed appears, sized correctly, no scrollbars unless expected.

If anything looks off, screenshot the issue + the character data and email
Watson. He'll fix-and-redeploy without you needing to touch code.

**One edge case to know about.** Cross-origin iframes can occasionally have
trouble triggering file downloads in some browsers. We've verified the
end-to-end flow in Chrome (which is what the vast majority of your players
will use), but if a player ever clicks **Export Fillable PDF** inside the
iframe and nothing happens, tell them to open `https://{{DEPLOY_URL}}` in a
new tab and try again — same wizard, same button, but no iframe in the way.

---

## Part 4 — Going public

When you're satisfied with the test pass, email Watson:

> "Looks good — please remove the password gate."

Watson will:
1. Remove the gate (5 min, follows `docs/cutover-runbook.md`).
2. Deploy.
3. Confirm `https://{{DEPLOY_URL}}` loads directly with no prompt.
4. Reply confirming the page is live.

Then you flip your unlisted Squarespace page to public (publish draft /
hide-from-navigation off / whatever your launch flow is) so the resource-page
button starts working for players. The whole public-launch round-trip is
usually under 30 minutes.

---

## After launch — what to expect

- **Updates from Watson.** If a player reports a bug or you want a tweak,
  Watson pushes the fix and it's live at `https://{{DEPLOY_URL}}` within a few
  minutes. You don't need to do anything — same URL, same iframe, just newer
  code behind it.
- **Player-reported issues.** Forward them to `watson@foil.engineering`. A
  screenshot + the rough character data they entered is enough to debug 95%
  of cases.
- **Adding more tools later.** If you build more Duster tools (an NPC
  generator, a loot roller, etc.) the same pattern works: a new unlisted page
  per tool, button on `/duster-resources` for each. Or, if you'd prefer one
  branded URL for all of them, that's the moment to add a custom subdomain
  (we can swap the embed src without you re-doing the page).

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

{{ADDITIONAL_LIMITATIONS_FROM_REPLY}}

---

## Quick reference

| Thing | Value |
|---|---|
| Hosting URL | `https://{{DEPLOY_URL}}` |
| Preview password (until cutover) | `dusty2026` |
| Public URL (post-launch) | same — `https://{{DEPLOY_URL}}` (no DNS change) |
| Bug reports | `watson@foil.engineering` |
| Update flow | Watson pushes; same URL stays live |

---

## Glossary (skip if you know these)

- **AcroForm**: the form-field layer of a PDF (text inputs, checkboxes). Adobe
  Reader and Adobe Acrobat render this correctly. Apple Preview, Chrome's PDF
  viewer, and most third-party readers don't fully support it — fields can
  appear blank or render incorrectly even when the underlying data is right.
- **Iframe**: a way to embed one webpage inside another. Players see the
  character creator inline on your page; behind the scenes their browser is
  loading it from `{{DEPLOY_URL}}`.
- **Unlisted page**: a Squarespace page that's published and reachable by URL
  but not in the site's main navigation. Players hit it only via the button
  you add to `/duster-resources`.
