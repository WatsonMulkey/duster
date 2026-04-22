import type { FieldOverrides } from './ttrpg-pdf-fill'

/**
 * Template bug workarounds for Mac_Sheet.pdf.
 *
 * These should be fixed in InDesign at source; overrides are a stopgap.
 * Full list in docs/andrew-pdf-review.md § 8 (InDesign template fixes).
 */
export const dusterOverrides: FieldOverrides = {
  // Inventory/Weapons: template has /Ff=<none>, should be multiline for
  // the multi-line content we write.
  Inventory: { multiline: true },
  Weapons: { multiline: true },

  // Energy modifiers: template has multiline + top-left aligned, should be
  // single-line centered for a small "+1" modifier.
  MENTAL: { multiline: false, alignment: 'center' },
  PHYSICAL: { multiline: false, alignment: 'center' },
  EMOTIONAL: { multiline: false, alignment: 'center' },

  // Talent grid rows: need multiline for 2-line "name + novice description"
  // rendering.
  'Name/Novice 1': { multiline: true },
  'Name/Novice 2': { multiline: true },
  'Name/Novice 3': { multiline: true },
  'Name/Novice 4': { multiline: true },
}
