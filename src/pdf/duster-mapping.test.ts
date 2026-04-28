import { describe, it, expect } from 'vitest'
import { dusterMapping } from './duster-mapping'
import { dusterSamples } from './duster-samples'
import { dusterIntent } from './duster-intent'
import { dusterAliases } from './duster-aliases'
import type { CharacterState, Skill } from '../types'

const happy = dusterSamples[0]!

describe('dusterMapping — identity', () => {
  it('fills NAME, SPECIALTY, LVL, HAND', () => {
    const out = dusterMapping(happy)
    expect(out.NAME).toBe('Test Happy')
    expect(out.SPECIALTY).toBe('STITCH')
    expect(out.LVL).toBe('1')
    expect(out.HAND).toBe('Right')
  })

  it('XP is level * 3 (total, not spent/remaining)', () => {
    expect(dusterMapping({ ...happy, level: 1 }).XP).toBe('3')
    expect(dusterMapping({ ...happy, level: 3 }).XP).toBe('9')
    expect(dusterMapping({ ...happy, level: 4 }).XP).toBe('12')
  })

  it('GIFT resolves for specialty with two gifts (index 0 and 1)', () => {
    const i0 = dusterMapping({ ...happy, selectedGiftIndex: 0 })
    const i1 = dusterMapping({ ...happy, selectedGiftIndex: 1 })
    expect(i0.GIFT).toBeTruthy()
    expect(i1.GIFT).toBeTruthy()
    expect(i0.GIFT).not.toBe(i1.GIFT)
  })

  it('GIFT resolves for 1-gift specialty (TEKE) regardless of index', () => {
    const teke = dusterSamples.find((s) => s.specialty === 'TEKE')!
    expect(dusterMapping(teke).GIFT).toBeTruthy()
    expect(dusterMapping({ ...teke, selectedGiftIndex: 1 }).GIFT).toBe(
      dusterMapping(teke).GIFT,
    )
  })
})

describe('dusterMapping — energy modifiers', () => {
  it('Stitch (Mental stat-boost): +1 Mental, blank Physical + Emotional', () => {
    // dusterSamples[0] is STITCH which has statBoost = Mental
    const out = dusterMapping(happy)
    expect(out.MENTAL).toBe('+1')
    expect(out.PHYSICAL).toBe('')
    expect(out.EMOTIONAL).toBe('')
  })

  it('Brawler (Physical stat-boost)', () => {
    const brawler = dusterSamples.find((s) => s.specialty === 'BRAWLER')!
    const out = dusterMapping(brawler)
    expect(out.PHYSICAL).toBe('+1')
    expect(out.MENTAL).toBe('')
    expect(out.EMOTIONAL).toBe('')
  })

  it('Witchlike (Emotional stat-boost)', () => {
    const witch = dusterSamples.find((s) => s.specialty === 'WITCHLIKE')!
    const out = dusterMapping(witch)
    expect(out.EMOTIONAL).toBe('+1')
    expect(out.MENTAL).toBe('')
    expect(out.PHYSICAL).toBe('')
  })
})

describe('dusterMapping — keen-skill checkboxes', () => {
  it.each<[Skill, string]>([
    ['Focus', 'Check Box8'],
    ['Memory', 'Check Box9'],
    ['Tech', 'Check Box10'],
    ['Force', 'Check Box11'],
    ['Reflex', 'Check Box12'],
    ['Coordination', 'Check Box13'],
    ['Persuasion', 'Check Box14'],
    ['Deception', 'Check Box15'],
    ['Intuition', 'Check Box16'],
  ])('keenSkill=%s checks %s and leaves others unchecked', (skill, expectedBox) => {
    const sample: CharacterState = { ...happy, keenSkill: skill }
    const out = dusterMapping(sample)
    expect(out[expectedBox]).toBe(true)
    // All 9 checkboxes should exist in output; exactly one is true
    const allBoxes = [
      'Check Box8',
      'Check Box9',
      'Check Box10',
      'Check Box11',
      'Check Box12',
      'Check Box13',
      'Check Box14',
      'Check Box15',
      'Check Box16',
    ]
    const trueCount = allBoxes.filter((b) => out[b] === true).length
    expect(trueCount).toBe(1)
  })
})

describe('dusterMapping — HP and LUCK', () => {
  it('Now and Total are NOT produced (player-fill pending template fix)', () => {
    const out = dusterMapping(happy)
    expect(out.Now).toBeUndefined()
    expect(out.Total).toBeUndefined()
  })

  it('LUCK = "0" for new characters', () => {
    const out = dusterMapping(happy)
    expect(out.LUCK).toBe('0')
  })
})

describe('dusterMapping — inventory + weapons', () => {
  it('inventory passes through user-typed text when no rolled items', () => {
    const out = dusterMapping(happy)
    expect(out.Inventory).toBe('1 medkit, 2 rations')
  })

  it('appends rolled startingItems on their own lines after user text', () => {
    const state: CharacterState = {
      ...happy,
      inventory: 'pack, bedroll',
      startingItems: [
        { name: '2 cans of clean H', tableNumber: 3, tableName: 'Consumables', roll: 1, slotIndex: 0 },
        { name: 'A machete (-1 dmg)', tableNumber: 5, tableName: 'Light Melee', roll: 4, slotIndex: 1 },
      ],
    }
    const out = dusterMapping(state)
    expect(out.Inventory).toBe('pack, bedroll\n2 cans of clean H\nA machete (-1 dmg)')
  })

  it('appends bonusItem to inventory', () => {
    const state: CharacterState = {
      ...happy,
      inventory: 'pack',
      bonusItem: { name: 'A spyglass', tableNumber: 2, tableName: 'Supplies', roll: 6 },
    }
    const out = dusterMapping(state)
    expect(out.Inventory).toBe('pack\nA spyglass')
  })

  it('combines user text + startingItems + bonusItem in that order', () => {
    const state: CharacterState = {
      ...happy,
      inventory: 'pack',
      startingItems: [
        { name: '2 doses of leaf', tableNumber: 3, tableName: 'Consumables', roll: 5, slotIndex: 0 },
      ],
      bonusItem: { name: 'A mangy old dog', tableNumber: 1, tableName: 'Trinkets', roll: 6 },
    }
    const out = dusterMapping(state)
    expect(out.Inventory).toBe('pack\n2 doses of leaf\nA mangy old dog')
  })

  it('omits empty user text (no leading blank line)', () => {
    const state: CharacterState = {
      ...happy,
      inventory: '',
      startingItems: [
        { name: '10 scrap metal', tableNumber: 2, tableName: 'Supplies', roll: 1, slotIndex: 0 },
      ],
      bonusItem: null,
    }
    const out = dusterMapping(state)
    expect(out.Inventory).toBe('10 scrap metal')
  })

  it('null bonusItem does not append "null" or extra newline', () => {
    const state: CharacterState = { ...happy, inventory: 'pack', bonusItem: null }
    const out = dusterMapping(state)
    expect(out.Inventory).toBe('pack')
    expect(out.Inventory).not.toContain('null')
  })

  it('weapons join with ", "', () => {
    const out = dusterMapping(happy)
    expect(out.Weapons).toBe('Machete, Iron pry bar')
  })

  it('empty weapons → empty string', () => {
    const empty = dusterSamples.find((s) => s.specialty === 'DRIFTER')!
    expect(dusterMapping(empty).Weapons).toBe('')
  })
})

describe('dusterMapping — talent grid', () => {
  it('Name/Novice 1 contains starting-talent name + novice description', () => {
    const out = dusterMapping(happy)
    const text = out['Name/Novice 1'] as string
    expect(text).toContain('GOOD MEDICINE')
    // Novice description from talents.ts for GOOD MEDICINE
    expect(text).toContain('Memory')
  })

  it('Skilled 1 populated by default (every character is at least Skilled in their starting talent)', () => {
    const out = dusterMapping(happy)
    expect(out['Skilled 1']).toBeTruthy()
    expect(out['Expert 1']).toBe('')
    expect(out['Master 1']).toBe('')
  })

  it('All tier columns populated when startingTalentTier is Master', () => {
    const out = dusterMapping({ ...happy, startingTalentTier: 'Master' })
    expect(out['Skilled 1']).toBeTruthy()
    expect(out['Expert 1']).toBeTruthy()
    expect(out['Master 1']).toBeTruthy()
  })

  it('Skilled 2 populated when talents[0] is at Skilled tier', () => {
    const state: CharacterState = {
      ...happy,
      talents: [{ name: 'MENDER', tier: 'Skilled' }, null, null],
    }
    const out = dusterMapping(state)
    expect(out['Skilled 2']).toBeTruthy()
    expect(out['Expert 2']).toBe('')
    expect(out['Master 2']).toBe('')
  })

  it('All tier columns populated when talent is Master', () => {
    const state: CharacterState = {
      ...happy,
      talents: [{ name: 'MENDER', tier: 'Master' }, null, null],
    }
    const out = dusterMapping(state)
    expect(out['Skilled 2']).toBeTruthy()
    expect(out['Expert 2']).toBeTruthy()
    expect(out['Master 2']).toBeTruthy()
  })

  it('Empty talent slot leaves Name/Novice column empty', () => {
    const state: CharacterState = {
      ...happy,
      talents: [null, null, null],
    }
    const out = dusterMapping(state)
    expect(out['Name/Novice 2']).toBe('')
    expect(out['Name/Novice 3']).toBe('')
    expect(out['Name/Novice 4']).toBe('')
  })
})

describe('dusterMapping — regression (no player-fill leak)', () => {
  it('does not produce values for any player-fill field', () => {
    // Cross-reference every sample's mapping output against dusterIntent
    // to ensure no player-fill field gets a value.
    for (const sample of dusterSamples) {
      const out = dusterMapping(sample)
      for (const [rawKey, value] of Object.entries(out)) {
        if (value === undefined) continue
        const resolved = dusterAliases[rawKey] ?? rawKey
        const intent = dusterIntent[resolved]
        if (intent === 'player-fill' || intent === 'template-artifact') {
          throw new Error(
            `Leak: sample "${sample.name}" produced a value for "${resolved}" ` +
              `(intent: ${intent})`,
          )
        }
      }
    }
  })

  it('produces a value for every app-fill field across all samples (union)', () => {
    // The union of all samples' outputs must cover every app-fill INTENT key
    const producedKeys = new Set<string>()
    for (const sample of dusterSamples) {
      const out = dusterMapping(sample)
      for (const [rawKey, value] of Object.entries(out)) {
        if (value === undefined) continue
        const resolved = dusterAliases[rawKey] ?? rawKey
        producedKeys.add(resolved)
      }
    }
    const missingAppFill = Object.entries(dusterIntent)
      .filter(([, intent]) => intent === 'app-fill')
      .map(([key]) => dusterAliases[key] ?? key)
      .filter((resolved) => !producedKeys.has(resolved))
    expect(missingAppFill).toEqual([])
  })
})
