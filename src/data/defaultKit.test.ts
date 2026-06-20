import { describe, it, expect } from 'vitest'
import { DEFAULT_KIT, buildInventorySeed } from './defaultKit'
import type { StartingItem } from '../types'

const item = (name: string): StartingItem => ({
  name,
  tableNumber: 1,
  tableName: 'X',
  roll: 1,
})

describe('DEFAULT_KIT', () => {
  it("is Andrew's canonical base gear — 2d6 bolts, not slugs", () => {
    // Andrew/Occupied Hex 2026-06-19: every character starts with this kit.
    expect(DEFAULT_KIT).toContain('2d6 bolts')
    expect(DEFAULT_KIT.join('\n')).not.toContain('slugs')
    expect(DEFAULT_KIT).toHaveLength(7)
  })
})

describe('buildInventorySeed', () => {
  it('lists the default kit, then rolled items, then bonus — one per line', () => {
    const seed = buildInventorySeed([item('A machete (-1 dmg)')], item('A spyglass'))
    const lines = seed.split('\n')
    expect(lines.slice(0, 7)).toEqual([...DEFAULT_KIT])
    expect(lines[7]).toBe('A machete (-1 dmg)')
    expect(lines[8]).toBe('A spyglass')
  })

  it('omits a null bonus item (no "null" line)', () => {
    const seed = buildInventorySeed([item('10 scrap metal')], null)
    expect(seed).not.toContain('null')
    expect(seed.endsWith('10 scrap metal')).toBe(true)
  })

  it('returns just the kit when nothing was rolled', () => {
    expect(buildInventorySeed([], null)).toBe(DEFAULT_KIT.join('\n'))
  })
})
