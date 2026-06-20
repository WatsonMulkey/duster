import type { StartingItem } from '../types'

/** Roll a single d6 (1–6). Pure given an injectable rng, for testability. */
function rollD6(rng: () => number): number {
  return Math.floor(rng() * 6) + 1
}

/** Roll 2d6 and return the total (2–12). */
export function roll2d6(rng: () => number = Math.random): number {
  return rollD6(rng) + rollD6(rng)
}

/**
 * Base gear every Duster character starts with, regardless of specialty.
 *
 * Canonical wording from Andrew (Occupied Hex), 2026-06-19:
 *   "1 pack with a 100lb carrying capacity, one tinderbox, one canvas bedroll,
 *    one single-person tent, 2d6 bolts, 2 rations of food and two cans of H."
 *
 * Previously this lived only as placeholder text in InventoryStep, so it never
 * actually reached the sheet or the exported PDF. It now seeds the (single,
 * editable) Inventory box. "2d6 bolts" is dice notation — per Andrew we roll the
 * 2d6 and list the concrete total (e.g. "9 bolts"), so `boltCount` is that
 * rolled total. (This also supersedes the old "2d6 slugs" placeholder.)
 */
export function defaultKit(boltCount: number): string[] {
  return [
    '1 pack (100 lb carrying capacity)',
    '1 tinderbox',
    '1 canvas bedroll',
    '1 single-person tent',
    `${boltCount} bolts`,
    '2 rations of food',
    '2 cans of H',
  ]
}

/**
 * Composes the starting contents of the Inventory box: the base kit (with its
 * rolled bolt count), then the player's rolled specialty items, then the bonus
 * item (if any) — one per line. This is the seed only; the box is freely
 * editable afterward.
 */
export function buildInventorySeed(
  startingItems: StartingItem[],
  bonusItem: StartingItem | null,
  boltCount: number,
): string {
  return [
    ...defaultKit(boltCount),
    ...startingItems.map((i) => i.name),
    bonusItem?.name,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')
}
