Subject: Duster character creator — go-live setup

---

Hey Andrew —

Thanks for the answers. Skipping the custom subdomain since you're flexible
on it makes this materially simpler — the creator is already live at its
hosting URL (`duster-seven.vercel.app`), so we just need to point a page at
it. Should be ~15 minutes, no DNS work.

Below is the end-to-end. If anything's ambiguous, just reply with where you
got stuck.

## At a glance

1. Make an unlisted page on Squarespace and embed the creator on it.
2. Add a button on your existing `/duster-resources` page that links to the
   new page.
3. Test once in incognito with the password (`dusty2026`).
4. Tell me it looks good — I flip the password gate off and the page is
   public.

## Part 1 — The embed page

You're on Business plan, so we can use a Code Block to embed the creator
inline. Players never leave your site.

1. In Squarespace, create a new page (e.g. `/duster-character-creator`).
   Mark it **unlisted** for now (don't put it in main nav) — we'll keep it
   private until you've verified the test pass below.
2. Open the new page in the editor. Click **+ Add Block** → **Code**.
3. Paste this exactly:

   ```html
   <iframe
     src="https://duster-seven.vercel.app"
     style="width: 100%; height: 1100px; border: 0; border-radius: 8px;"
     title="Duster Character Creator"
     allow="clipboard-write"
   ></iframe>
   ```

4. **Apply** → **Save**.

If you see scrollbars inside the iframe at common screen sizes, bump the
`1100px` to `1200px` or `1300px`. Mobile players will scroll inside the
iframe naturally — no separate tuning needed.

## Part 2 — The button on /duster-resources

1. Open `/duster-resources` in the Squarespace editor.
2. Add a new entry matching the style of the other tool buttons.
3. Configure: text = "Build a Duster Character" (or your preferred wording);
   link = the unlisted page from Part 1.
4. Save.

The button stays unlisted-page-linked until you publish in Part 4, so it
won't go anywhere for visitors yet.

## Part 3 — Verify before going public (~10 min)

While the password gate is still up, walk through one full character.

1. Open `https://duster-seven.vercel.app` in an incognito window.
2. Enter password: `dusty2026`.
3. Build a test character end-to-end. Try **STITCH** — it has good test
   coverage. Pick a keen skill, gift, starting talent, talents, items, name.
   The Starting Items step now auto-rolls a bonus item for every character;
   you'll see a "Bonus Item" card appear when you land on that step.
4. Click **Generate Sheet** → **Export Fillable PDF**.
5. **Open the PDF in Adobe Reader.** Not Preview, not Chrome's PDF viewer —
   both render PDF AcroForms wrong and you'll think there's a bug when
   there isn't.
6. Spot-check:
   - Name + specialty match what you typed
   - Starting talent is in the talent grid at the **Skilled** tier (not
     Novice — that changed since your last review)
   - All rolled items (specialty + bonus) are in the **INVENTORY** box
7. Also load your unlisted Squarespace page in incognito and confirm the
   embed looks right — sized correctly, no unexpected scrollbars.

Heads up — small scope expansion since your 2026-04-22 PDF review: the
bonus item now prints into the Inventory box (it didn't before), and the
starting talent floor moved from Novice to Skilled. Both are visible at the
PDF level, so spot-checking those during this verify pass covers it. If
something's wrong I'd rather catch it now than after public launch.

If anything looks off, screenshot the issue + the character data and reply.
I'll fix-and-redeploy without you needing to touch code.

**Edge case worth knowing.** Cross-origin iframes occasionally have trouble
triggering file downloads in some browsers. We've verified end-to-end in
Chrome (which is what the vast majority of your players will use). If a
player ever clicks Export PDF inside the iframe and nothing happens, tell
them to open `https://duster-seven.vercel.app` directly in a new tab and
try again — same wizard, same button, no iframe in the way.

## Part 4 — Going public

When you're satisfied with the test pass, reply:

> Looks good — please remove the password gate.

I'll:
1. Remove the gate (5 min).
2. Deploy.
3. Confirm `https://duster-seven.vercel.app` loads directly with no prompt.
4. Reply confirming we're live.

Then you flip your unlisted Squarespace page to public, the button on
`/duster-resources` starts working, and players can hit it.

## After launch

- **Updates from me.** If a player reports a bug or you want a tweak, I push
  the fix and it's live within a few minutes. You don't need to do anything
  — same URL, same iframe, just newer code behind it.
- **Player-reported issues.** Forward to `watson@foil.engineering`. A
  screenshot + the rough character data they entered debugs 95% of cases.
- **More tools later.** If you build more Duster tools (NPC generator, loot
  roller, etc.) the same pattern works — new unlisted page per tool, button
  on `/duster-resources` for each. If at some point you'd prefer one branded
  URL across them all, that's the moment to add a custom subdomain — we can
  swap the embed src without you re-doing the page.

## Known limitations at launch

These are visible on the exported PDF and are tracked but **not blocking**.
Each is a small InDesign-side fix you can roll into your next template
pass; we'll reverify with the new template when you send it.

- **`Now` / `Total` HP boxes show `12OW` / `12TAL` overlap.** The "NOW" /
  "TOTAL" labels live *inside* the field rectangles in your template, so
  any value collides with the label glyphs. We leave both blank for now and
  the labels read cleanly. Template fix: move labels to separate text
  annotations above the boxes.
- **`GHOST HAND` shows `4` by default.** Template default value, not
  something we're writing. Fine if `4` is universally correct at character
  creation; if not, clear the default in the template.
- **Stress field `Stess 1` typo** (missing `r`). Cosmetic — players won't
  see the field name. Code has an alias.
- **Talent description text truncates** in long talent grid cells (e.g.
  some Slinger / Gambler talents). Full text is always visible in the web
  app; the PDF is a quick reference. Template fix: larger cells, smaller
  font, or "Shrink Text on Overflow".
- **`MENTAL` / `PHYSICAL` / `EMOTIONAL` boxes** look slightly off-center —
  multiline + top-left in the template but we write a single `+1`. We
  override at the code layer (single-line, centered) and it renders well
  in Adobe Reader; if you want to clean up at the template level, set
  those to single-line centered fields.

## Quick reference

| Thing | Value |
|---|---|
| Hosting URL | `https://duster-seven.vercel.app` |
| Preview password (until cutover) | `dusty2026` |
| Public URL (post-launch) | same — `https://duster-seven.vercel.app` |
| Bug reports | `watson@foil.engineering` |

— Watson
