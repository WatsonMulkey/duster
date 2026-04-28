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

/**
 * Starting-talent floor: every character is Skilled in their specialty's
 * starting talent. The wizard lets players pay XP to advance further (Expert,
 * Master), but they cannot drop below Skilled. Novice is reserved for
 * additional talent slots, which still use the full MasteryTier.
 */
export type StartingTalentTier = Exclude<MasteryTier, 'Novice'>

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
  /** Tier the starting talent has been advanced to. Default 'Skilled' (the floor). */
  startingTalentTier: StartingTalentTier
  talents: (TalentSlot | null)[]
  weapons: WeaponSlot[]
  startingItems: StartingItem[]
  /** Single random bonus item — every character gets one. Specialty-agnostic, no override, rolled once. */
  bonusItem: StartingItem | null
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
