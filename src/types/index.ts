export type EnergyGroup = 'Mental' | 'Physical' | 'Emotional'

export type Skill =
  | 'Focus' | 'Memory' | 'Tech'
  | 'Force' | 'Reflex' | 'Coordination'
  | 'Persuasion' | 'Deception' | 'Intuition'

export const ENERGY_SKILLS: Record<EnergyGroup, Skill[]> = {
  Mental: ['Focus', 'Memory', 'Tech'],
  Physical: ['Force', 'Reflex', 'Coordination'],
  Emotional: ['Persuasion', 'Deception', 'Intuition'],
}

export type MasteryTier = 'Novice' | 'Skilled' | 'Expert' | 'Master'

export type Hand = 'Right' | 'Left' | 'Both'

export interface Specialty {
  name: string
  description?: string
  talent: string
  statBoost: EnergyGroup
  keenSkillOptions: Skill[]
  gift1: Gift
  gift2: Gift | null
  startingTalents: string[]
}

export interface Gift {
  name: string
  description: string
}

export interface Talent {
  name: string
  novice: string
  skilled: string
  expert: string
  master: string
  prerequisite: string
}

export interface Weapon {
  name: string
  damageModifier: string
  maxRange: string
  notes: string
  dodgeMod: string
}

export interface StressLevel {
  level: number
  name: string
  description: string
}

export interface CharacterState {
  name: string
  specialty: string | null
  keenSkill: Skill | null
  selectedGiftIndex: 0 | 1
  startingTalent: string | null
  talents: (TalentSlot | null)[]
  weapons: WeaponSlot[]
  startingItems: StartingItem[]
  inventory: string
  hand: Hand
  level: number
}

export interface TalentSlot {
  name: string
  tier: MasteryTier
}

export interface WeaponSlot {
  name: string
}

export interface StartingItem {
  name: string
  tableNumber: number
  tableName: string
  roll: number
  /** Position in specialtyTables[specialty] — distinguishes repeat tables (e.g. Rambler = [3,3,4]). Optional for backward-compat. */
  slotIndex?: number
}
