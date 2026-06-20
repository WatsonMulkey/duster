import type { StartingItem } from '../types'

/**
 * Base gear every Duster character starts with, regardless of specialty.
 *
 * Canonical wording from Andrew (Occupied Hex), 2026-06-19:
 *   "1 pack with a 100lb carrying capacity, one tinderbox, one canvas bedroll,
 *    one single-person tent, 2d6 bolts, 2 rations of food and two cans of H."
 *
 * Previously this lived only as placeholder text in InventoryStep, so it never
 * actually reached the sheet or the exported PDF. It now seeds the (single,
 * editable) Inventory box. Note "2d6 bolts" supersedes the old "2d6 slugs"
 * placeholder per Andrew's correction.
 */
export const DEFAULT_KIT: readonly string[] = [
  '1 pack (100 lb carrying capacity)',
  '1 tinderbox',
  '1 canvas bedroll',
  '1 single-person tent',
  '2d6 bolts',
  '2 rations of food',
  '2 cans of H',
]

/**
 * Composes the starting contents of the Inventory box: the base kit, then the
 * player's rolled specialty items, then the bonus item (if any) — one per line.
 * This is the seed only; the box is freely editable afterward.
 */
export function buildInventorySeed(
  startingItems: StartingItem[],
  bonusItem: StartingItem | null,
): string {
  return [
    ...DEFAULT_KIT,
    ...startingItems.map((i) => i.name),
    bonusItem?.name,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')
}
