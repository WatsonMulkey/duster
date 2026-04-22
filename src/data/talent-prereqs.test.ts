import { describe, it, expect } from 'vitest'
import type { Talent, TalentSlot } from '../types'
import {
  hasPrerequisite,
  parseMasteryPrereq,
  isPrereqSatisfied,
  isTalentAvailable,
} from './talent-prereqs'

const fakeTalent = (
  overrides: Partial<Talent> = {},
): Talent => ({
  name: 'TEST',
  novice: 'n',
  skilled: 's',
  expert: 'e',
  master: 'm',
  prerequisite: 'None.',
  ...overrides,
})

describe('hasPrerequisite', () => {
  it('false for empty prereq', () => {
    expect(hasPrerequisite(fakeTalent({ prerequisite: '' }))).toBe(false)
  })
  it('false for "None."', () => {
    expect(hasPrerequisite(fakeTalent({ prerequisite: 'None.' }))).toBe(false)
  })
  it('true for any non-empty non-None prereq', () => {
    expect(hasPrerequisite(fakeTalent({ prerequisite: 'Mastery of the X talent.' }))).toBe(true)
    expect(hasPrerequisite(fakeTalent({ prerequisite: 'Have a dog around.' }))).toBe(true)
  })
})

describe('parseMasteryPrereq', () => {
  it('parses "Mastery of the X talent."', () => {
    expect(parseMasteryPrereq('Mastery of the Mender talent.')).toEqual(['Mender'])
  })
  it('parses "Mastery of the X or Y talent."', () => {
    expect(parseMasteryPrereq('Mastery of the Shootist or Blade Master talent.')).toEqual([
      'Shootist',
      'Blade Master',
    ])
  })
  it('case-insensitive', () => {
    expect(parseMasteryPrereq('MASTERY OF THE MENDER TALENT.')).toEqual(['MENDER'])
  })
  it('returns null for narrative prereq', () => {
    expect(parseMasteryPrereq('Have a dog around.')).toBeNull()
    expect(parseMasteryPrereq('At least +1 in Mental.')).toBeNull()
    expect(parseMasteryPrereq('Mastery in Teke: Soul Seer.')).toBeNull()
  })
})

describe('isPrereqSatisfied', () => {
  const masterMender: TalentSlot = { name: 'MENDER', tier: 'Master' }
  const noviceMender: TalentSlot = { name: 'MENDER', tier: 'Novice' }
  const masterBlade: TalentSlot = { name: 'BLADE MASTER', tier: 'Master' }

  it('true when candidate is held at Master', () => {
    expect(
      isPrereqSatisfied('Mastery of the Mender talent.', [masterMender, null, null]),
    ).toBe(true)
  })

  it('false when candidate held at Novice (not Master)', () => {
    expect(
      isPrereqSatisfied('Mastery of the Mender talent.', [noviceMender, null, null]),
    ).toBe(false)
  })

  it('false when no candidate held', () => {
    expect(
      isPrereqSatisfied('Mastery of the Mender talent.', [null, null, null]),
    ).toBe(false)
  })

  it('handles "X or Y" with either at Master', () => {
    expect(
      isPrereqSatisfied('Mastery of the Shootist or Blade Master talent.', [masterBlade, null, null]),
    ).toBe(true)
  })

  it('narrative prereqs return false (strict)', () => {
    expect(isPrereqSatisfied('Have a dog around.', [null, null, null])).toBe(false)
    expect(isPrereqSatisfied('Mastery in Teke: Soul Seer.', [null, null, null])).toBe(false)
  })
})

describe('isTalentAvailable (FOI-205 variant 2A)', () => {
  const empty: (TalentSlot | null)[] = [null, null, null]

  it('talent with no prereq is available', () => {
    expect(isTalentAvailable(fakeTalent({ prerequisite: 'None.' }), empty)).toBe(true)
  })

  it('talent with mechanical-satisfied prereq is available', () => {
    const masterMender: TalentSlot = { name: 'MENDER', tier: 'Master' }
    expect(
      isTalentAvailable(
        fakeTalent({ prerequisite: 'Mastery of the Mender talent.' }),
        [masterMender, null, null],
      ),
    ).toBe(true)
  })

  it('talent with mechanical-unmet prereq is HIDDEN', () => {
    expect(
      isTalentAvailable(
        fakeTalent({ prerequisite: 'Mastery of the Mender talent.' }),
        empty,
      ),
    ).toBe(false)
  })

  it('talent with narrative prereq is HIDDEN (variant 2A key behavior)', () => {
    expect(
      isTalentAvailable(
        fakeTalent({ prerequisite: 'Have a dog around.' }),
        empty,
      ),
    ).toBe(false)
  })

  it('talent with "Mastery in" (not "of the") prereq is HIDDEN', () => {
    expect(
      isTalentAvailable(
        fakeTalent({ prerequisite: 'Mastery in Teke: Soul Seer.' }),
        empty,
      ),
    ).toBe(false)
  })

  it('talent with "+1 in X" prereq is HIDDEN (not currently parseable)', () => {
    expect(
      isTalentAvailable(
        fakeTalent({ prerequisite: 'At least +1 in Mental.' }),
        empty,
      ),
    ).toBe(false)
  })
})
