import type { FieldIntents } from './ttrpg-pdf-fill/engine'

/**
 * Classification for all 81 fields of Mac_Sheet.pdf.
 *
 * Derived from Google Sheet CSV exports (source of truth) 2026-04-22:
 *   - MAIN PAGE, Specialty, Gifts, Talents, Base Info_Specialty, List_Stress
 *   - 3 sample characters (Rambler L3, Brawler L3, Ren/Driver L4)
 *
 * Template SHA-256 (2026-04-22):
 *   8c6dc8b044b7373bc8bb90d8a3ecd35de8fe9e3da1f7f199391a923a9f2df5b0
 *
 * NOTE on field naming: PDF checkbox fields are "Check Box8" through
 * "Check Box16" — NO space between 'Box' and the digit. Easy to mis-read
 * from padded dumps.
 *
 * Aliased INTENT keys ('Stress 1' -> 'Stess 1' template typo) live in
 * duster-aliases.ts. The INTENT map uses the typo'd field names directly
 * (they're the PDF source of truth), so no alias is needed here for the
 * check to pass — but duster-aliases.ts exists so the mapping layer can
 * use the correctly-spelled key.
 *
 * See docs/superpowers/specs/2026-04-22-duster-fillable-pdf-export-design.md
 * for per-field rationale.
 */
export const dusterIntent: FieldIntents = {
  // --- Identity (5 app-fill) ---
  NAME: 'app-fill',
  SPECIALTY: 'app-fill',
  GIFT: 'app-fill',
  LVL: 'app-fill',
  HAND: 'app-fill',

  // --- XP + energy modifiers (4 app-fill) ---
  XP: 'app-fill',
  MENTAL: 'app-fill',
  PHYSICAL: 'app-fill',
  EMOTIONAL: 'app-fill',

  // --- Inventory + weapons (2 app-fill) ---
  Inventory: 'app-fill',
  Weapons: 'app-fill',

  // --- Current / Max HP (2 player-fill, pending Andrew template fix) ---
  // The InDesign template has static "NOW"/"TOTAL" text baked into the field
  // rectangles as page content, so writing any value produces visual overlap
  // (e.g. "12" + "NOW" reads as "12OW"). Leaving blank preserves the labels.
  // Flip both to 'app-fill' after Andrew moves the labels outside the fields.
  Now: 'player-fill',
  Total: 'player-fill',

  // --- Trackers (1 app-fill, 2 player-fill) ---
  LUCK: 'app-fill', // Starts at 0
  RESOURCE: 'player-fill',
  'GHOST HAND': 'player-fill',

  // --- Keen-skill checkboxes (9 app-fill) ---
  // Note: no space between "Box" and digit.
  'Check Box8': 'app-fill', // Focus
  'Check Box9': 'app-fill', // Memory
  'Check Box10': 'app-fill', // Tech
  'Check Box11': 'app-fill', // Force
  'Check Box12': 'app-fill', // Reflex
  'Check Box13': 'app-fill', // Coordination
  'Check Box14': 'app-fill', // Persuasion
  'Check Box15': 'app-fill', // Deception
  'Check Box16': 'app-fill', // Intuition

  // --- Talent grid: 16 app-fill ---
  'Name/Novice 1': 'app-fill',
  'Name/Novice 2': 'app-fill',
  'Name/Novice 3': 'app-fill',
  'Name/Novice 4': 'app-fill',
  'Skilled 1': 'app-fill',
  'Skilled 2': 'app-fill',
  'Skilled 3': 'app-fill',
  'Skilled 4': 'app-fill',
  'Expert 1': 'app-fill',
  'Expert 2': 'app-fill',
  'Expert 3': 'app-fill',
  'Expert 4': 'app-fill',
  'Master 1': 'app-fill',
  'Master 2': 'app-fill',
  'Master 3': 'app-fill',
  'Master 4': 'app-fill',

  // --- Body damage grid: 24 player-fill ---
  Head: 'player-fill',
  'L Arm': 'player-fill',
  'R Arm': 'player-fill',
  'L Leg': 'player-fill',
  'R Leg': 'player-fill',
  Torso: 'player-fill',
  'S 1': 'player-fill',
  'S 2': 'player-fill',
  'S 3': 'player-fill',
  'S 4': 'player-fill',
  'S 5': 'player-fill',
  'S 6': 'player-fill',
  'I 1': 'player-fill',
  'I 2': 'player-fill',
  'I 3': 'player-fill',
  'I 4': 'player-fill',
  'I 5': 'player-fill',
  'I 6': 'player-fill',
  'B 1': 'player-fill',
  'B 2': 'player-fill',
  'B 3': 'player-fill',
  'B 4': 'player-fill',
  'B 5': 'player-fill',
  'B 6': 'player-fill',

  // --- Tier advancement markers: 12 player-fill ---
  '1': 'player-fill',
  '2': 'player-fill',
  '3': 'player-fill',
  '4': 'player-fill',
  '1-1': 'player-fill',
  '2-1': 'player-fill',
  '3-1': 'player-fill',
  '4-1': 'player-fill',
  '1-2': 'player-fill',
  '2-2': 'player-fill',
  '3-2': 'player-fill',
  '4-2': 'player-fill',

  // --- Stress pip boxes: 4 player-fill ---
  // Note: "Stess 1" is a template typo (missing 'r'). The mapping uses
  // 'Stress 1' via fieldAliases, but INTENT must match the PDF literal.
  'Stess 1': 'player-fill',
  'Stress 2': 'player-fill',
  'Stress 3': 'player-fill',
  'Stress 4': 'player-fill',
}

// Sanity assertion: exactly 81 entries (matches the PDF field count)
const INTENT_COUNT = Object.keys(dusterIntent).length
if (INTENT_COUNT !== 81) {
  throw new Error(
    `dusterIntent has ${INTENT_COUNT} entries, expected 81. ` +
      `Did the PDF template change, or was a field added/removed?`,
  )
}
