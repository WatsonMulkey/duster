import type { CharacterState, Skill } from '../types'

/**
 * Fixture characters for build-time INTENT check (C1 contract).
 * Each covers a distinct branch of the mapping logic.
 *
 * The vite-plugin unions mapping output across all samples and checks it
 * against the INTENT map. Samples must collectively produce every app-fill
 * field at least once.
 */

const ALL_SKILLS: Skill[] = [
  'Focus',
  'Memory',
  'Tech',
  'Force',
  'Reflex',
  'Coordination',
  'Persuasion',
  'Deception',
  'Intuition',
]

export const dusterSamples: CharacterState[] = [
  // 1. Happy path — Stitch with Focus keen, 3 Novice talents, populated inventory
  {
    name: 'Test Happy',
    specialty: 'STITCH',
    keenSkill: 'Focus',
    selectedGiftIndex: 0,
    startingTalent: 'GOOD MEDICINE',
    talents: [
      { name: 'MENDER', tier: 'Novice' },
      { name: 'BLADE MASTER', tier: 'Novice' },
      { name: 'COOKIE', tier: 'Novice' },
    ],
    weapons: [{ name: 'Machete' }, { name: 'Iron pry bar' }],
    startingItems: [],
    inventory: '1 medkit, 2 rations',
    hand: 'Right',
    level: 1,
  },

  // 2. TEKE — only 1 gift (auto-selected)
  {
    name: 'Teke One',
    specialty: 'TEKE',
    keenSkill: 'Focus',
    selectedGiftIndex: 0,
    startingTalent: 'TEKE: SOUL SEER',
    talents: [null, null, null],
    weapons: [],
    startingItems: [],
    inventory: '',
    hand: 'Right',
    level: 1,
  },

  // 3. WITCHLIKE — only 1 gift
  {
    name: 'Witch One',
    specialty: 'WITCHLIKE',
    keenSkill: 'Intuition',
    selectedGiftIndex: 0,
    startingTalent: 'WITCHERY: BOONS',
    talents: [null, null, null],
    weapons: [],
    startingItems: [],
    inventory: '',
    hand: 'Left',
    level: 1,
  },

  // 4. Empty inventory + weapons
  {
    name: 'Empty',
    specialty: 'DRIFTER',
    keenSkill: 'Focus',
    selectedGiftIndex: 1,
    startingTalent: 'SALTED',
    talents: [null, null, null],
    weapons: [],
    startingItems: [],
    inventory: '',
    hand: 'Both',
    level: 1,
  },

  // 5-13. Each keen-skill variant (for Check Box8-16 coverage)
  ...ALL_SKILLS.map<CharacterState>((skill) => ({
    name: `Keen ${skill}`,
    specialty: 'BRAWLER',
    keenSkill: skill,
    selectedGiftIndex: 0,
    startingTalent: 'CLOSE COMBAT',
    talents: [null, null, null],
    weapons: [],
    startingItems: [],
    inventory: '',
    hand: 'Right',
    level: 1,
  })),
]
