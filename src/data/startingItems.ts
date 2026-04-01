export interface LootTable {
  id: number
  name: string
  items: string[]
}

export const lootTables: LootTable[] = [
  {
    id: 1,
    name: 'Trinkets',
    items: [
      'A pouch of radioactive dust',
      'A desiccated cat skull',
      'A piece of broken old granddad tech',
      'A necklace of wooden beads inscribed with runes',
      'A tattered book from the old days',
      'A mangy old dog',
    ],
  },
  {
    id: 2,
    name: 'Supplies',
    items: [
      '10 scrap metal',
      '100 feet of rope',
      'An iron lock and key',
      '10 slugs (bullets)',
      '1 widget (important crafting ingredient)',
      'A spyglass (+1 on Focus when searching at a distance)',
    ],
  },
  {
    id: 3,
    name: 'Consumables',
    items: [
      '2 cans of clean H',
      '2 doses of tonic',
      '2 doses of annadote',
      '2 cans of firewater',
      '2 doses of leaf',
      '1 can of push',
    ],
  },
  {
    id: 4,
    name: 'Heavy Melee',
    items: [
      'Iron knuckles (-2 dmg)',
      'A club with nails in it (-2 dmg)',
      'A staff with an iron emblem on the top (-2 dmg)',
      'An iron pry bar (-2 dmg) (+1 to Force rolls on jammed items)',
      'A 10-foot whip (-2 dmg)',
      'A wicked chunk of iron on a 10 foot chain (-1 damage)',
    ],
  },
  {
    id: 5,
    name: 'Light Melee',
    items: [
      'A simple shiv (-2 dmg)',
      'A folding knife (-1 dmg)',
      'A steel knife (-1 dmg)',
      'A machete (-1 dmg)',
      'Three throwing knives (-1 dmg)',
      'A steel bayonet (-1 dmg) (May be attached to long gun)',
    ],
  },
  {
    id: 6,
    name: 'Ranged',
    items: [
      'A 2-shot pocket gun (+0 dmg)',
      'A 3-shot revolver (+0 dmg)',
      'A sixgun (+0 dmg)',
      'A scattergun (+X dmg)',
      'A single shot long gun (+1 dmg)',
      'A bow with 5 arrows (+0 dmg)',
    ],
  },
]

/** Specialty name → array of table IDs to roll on */
export const specialtyTables: Record<string, number[]> = {
  BRAWLER: [3, 4],
  DRIFTER: [2, 5],
  DRIVER: [3, 6],
  HAWK: [2, 2, 3, 3, 3],
  IRONJACK: [1, 2, 2],
  OUTRIDER: [3, 4],
  RAMBLER: [3, 3, 4],
  SCAVVER: [1, 1, 2, 2, 3, 4],
  SLINGER: [2, 6],
  STITCH: [2, 3, 3],
  TEKE: [1, 2, 3],
  WITCHLIKE: [1, 2, 4],
}

export function getTable(id: number): LootTable {
  return lootTables.find((t) => t.id === id)!
}
