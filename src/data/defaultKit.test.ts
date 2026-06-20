import { describe, it, expect } from 'vitest'
import { roll2d6, defaultKit, buildInventorySeed } from './defaultKit'
import type { StartingItem } from '../types'

const item = (name: string): StartingItem => ({
  name,
  tableNumber: 1,
  tableName: 'X',
  roll: 1,
})

describe('roll2d6', () => {
  it('sums two d6 — floor at 2, ceiling at 12', () => {
    expect(roll2d6(() => 0)).toBe(2) // each d6 = 1
    expect(roll2d6(() => 0.999)).toBe(12) // each d6 = 6
  })

  it('stays within 2–12 across the unit interval', () => {
    for (const r of [0, 0.16, 0.34, 0.5, 0.67, 0.83, 0.999]) {
      const v = roll2d6(() => r)
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThanOrEqual(12)
    }
  })
})

describe('defaultKit', () => {
  it("is Andrew's base gear with a ROLLED bolt count, not the literal '2d6'", () => {
    // Andrew 2026-06-19: "2d6 bolts" is dice notation — roll it for the total.
    const kit = defaultKit(9)
    expect(kit).toHaveLength(7)
    expect(kit).toContain('9 bolts')
    expect(kit.join('\n')).not.toContain('2d6')
    expect(kit.join('\n')).not.toContain('slugs')
  })
})

describe('buildInventorySeed', () => {
  it('lists the kit (rolled bolts), then rolled items, then bonus — one per line', () => {
    const seed = buildInventorySeed([item('A machete (-1 dmg)')], item('A spyglass'), 7)
    const lines = seed.split('\n')
    expect(lines.slice(0, 7)).toEqual(defaultKit(7))
    expect(lines[4]).toBe('7 bolts')
    expect(lines[7]).toBe('A machete (-1 dmg)')
    expect(lines[8]).toBe('A spyglass')
  })

  it('omits a null bonus item (no "null" line)', () => {
    const seed = buildInventorySeed([item('10 scrap metal')], null, 5)
    expect(seed).not.toContain('null')
    expect(seed.endsWith('10 scrap metal')).toBe(true)
  })

  it('returns just the kit when nothing was rolled', () => {
    expect(buildInventorySeed([], null, 8)).toBe(defaultKit(8).join('\n'))
  })
})
