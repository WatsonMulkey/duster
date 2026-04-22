# Duster PDF — pre-preview review

Hi Andrew — the fillable PDF export is wired up. When someone finishes the character creator, they now get an **Export Fillable PDF** button that pre-fills your `Mac_Sheet.pdf` design.

Before I share the preview widely, I'd love your 5-minute sanity check on these 8 items. Each has a proposed answer based on my read of your Google Sheet. Just thumbs-up if it looks right; correct me if not.

---

## 1. `Now` / `Total` fields at the top

**Proposal**: those are Current HP / Max HP, and we pre-fill both with **"12"** for a level-1 character.

Derived from your MAIN PAGE sheet which has `Current HP` and `Max HP` rows that match the positions of the Now/Total fields on the PDF.

**Confirm?**

---

## 2. `LUCK`

**Proposal**: new characters start with **LUCK = 0** (per MAIN PAGE row `Luck,0`).

**Confirm?** (If some specialties start with a different value, happy to fold that in.)

---

## 3. `RESOURCE` and `GHOST HAND`

**Proposal**: both stay **blank** at character creation. Player writes in during play if the mechanic applies.

Derived from: Rambler and Brawler samples showed both blank; Ren (a Driver) had `GHOST HAND = 1` — so it's a gameplay tracker that accumulates during play, not a starting value.

**Confirm?** (If there IS a starting value for specific specialties — Teke, Stitch, etc. — let me know what and I'll wire it up.)

---

## 4. Stress pip boxes (`Stess 1` / `Stress 2` / `Stress 3` / `Stress 4`)

**Proposal**: all 4 pips stay **blank** at character creation (stress starts at 0). Player checks one as stress accrues during play.

These fields are each ~40px wide — too narrow for the full level descriptions from your List_Stress sheet, so they look like pip trackers rather than description slots.

**Confirm?** (If you actually want the level-effect text pre-printed in them — "-1 Mental" etc. — tell me the short form you'd want.)

---

## 5. Skill-is-keen checkboxes

There are 9 checkboxes next to the 9 skill rows. Based on their vertical position on the sheet, here's how we're mapping them. The character's keen skill auto-checks the matching box; the other 8 stay empty.

| Check Box | Skill | Energy group |
|---|---|---|
| Check Box8 | Focus | Mental |
| Check Box9 | Memory | Mental |
| Check Box10 | Tech | Mental |
| Check Box11 | Force | Physical |
| Check Box12 | Reflex | Physical |
| Check Box13 | Coordination | Physical |
| Check Box14 | Persuasion | Emotional |
| Check Box15 | Deception | Emotional |
| Check Box16 | Intuition | Emotional |

**Confirm the order?** If any checkbox is actually a different skill, the fix is a 1-line swap.

---

## 6. Talent grid rendering

**Proposal**: matches how your current web app already renders talents.

- **Name/Novice column**: always shows the talent name + the novice tier description text.
- **Skilled column**: shows the skilled tier text **only** when the talent is held at Skilled or higher; blank otherwise.
- **Expert column**: shows expert tier text **only** when held at Expert or Master.
- **Master column**: shows master tier text **only** when held at Master.

So a level-1 character with all three talents at Novice tier will have filled Name/Novice columns, and the Skilled/Expert/Master columns will be empty.

**Confirm?**

---

## 7. `HAND` field

**Proposal**: spelled out — "Right", "Left", or "Both".

The character sheet Vue component uses abbreviated "R"/"L"/"B"; the Google Sheet shows spelled-out "Right" at E14. We went with spelled-out to match the Google Sheet.

**Confirm?** Or would you rather we use the abbreviated form on the PDF?

---

## 8. InDesign template fixes for your next pass

These are things I'd suggest you fix in the source `Mac_Sheet.pdf` when you next open InDesign. I've worked around them in code, but cleaner at the source.

1. **`Inventory`** and **`Weapons`** fields — currently single-line; should be multiline (players usually write several lines of notes).
2. **`MENTAL`**, **`PHYSICAL`**, **`EMOTIONAL`** fields — currently multiline + top-left aligned; should be single-line centered (they only ever hold "+1").
3. **`Stess 1`** typo — missing the `r` (should be `Stress 1`). We've got an alias in place so our code isn't affected, but cleanest to fix at source.
4. **`Check Box 9`** — appears pre-checked in the base template. Probably accidental. We overwrite it on every export anyway, but cleaner to uncheck in source.
5. **`Now` / `Total` labels** — the identifying text labels ("Now", "Total") sit **inside** the field rectangles rather than above/beside them. When we fill the fields with HP values, the labels get overwritten. Moving them outside the field rectangles (as separate text annotations) keeps them visible when the PDF is filled in.

---

## What happens next

- If everything above looks right → thumbs up and I'll finalize the launch.
- If anything needs correction → just tell me the specific item(s); most are 1–2 line fixes.
- If you want to iterate on the InDesign template (§ 8), send me an updated `Mac_Sheet.pdf` and I'll re-verify the build-check passes cleanly with the new version.
