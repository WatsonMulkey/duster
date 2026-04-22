import { reactive, computed } from 'vue'
import { specialties } from '../data/specialties'
import { talents } from '../data/talents'
import { weapons } from '../data/weapons'
import type {
  CharacterState,
  Specialty,
  Skill,
  EnergyGroup,
  Gift,
  MasteryTier,
  Talent,
  Weapon,
} from '../types'

const XP_COST_OTHER: Record<MasteryTier, number> = {
  Novice: 2,
  Skilled: 3,
  Expert: 4,
  Master: 6,
}

/**
 * Starting-talent XP cost ladder — discounted compared to additional talents.
 * Derived from Google Sheet formula: IFS(C34="Novice",0,"Skilled",1,"Expert",2,"Master",4).
 * A level-1 character (3 XP) can promote their starting talent to Skilled (1 XP)
 * or Expert (2 XP), but Master (4 XP) needs level 2+.
 */
const XP_COST_STARTING: Record<MasteryTier, number> = {
  Novice: 0,
  Skilled: 1,
  Expert: 2,
  Master: 4,
}

export function useCharacter() {
  const state = reactive<CharacterState>({
    name: '',
    specialty: null,
    keenSkill: null,
    selectedGiftIndex: 0,
    startingTalent: null,
    startingTalentTier: 'Novice',
    talents: [null, null, null],
    weapons: [],
    startingItems: [],
    inventory: '',
    hand: 'Right',
    level: 1,
  })

  // --- Derived from specialty selection (mirrors Excel VLOOKUP chain) ---

  const currentSpecialty = computed<Specialty | null>(() => {
    if (!state.specialty) return null
    return specialties.find((s) => s.name === state.specialty) ?? null
  })

  const statBoost = computed<EnergyGroup | null>(() => {
    return currentSpecialty.value?.statBoost ?? null
  })

  const keenSkillOptions = computed<Skill[]>(() => {
    return currentSpecialty.value?.keenSkillOptions ?? []
  })

  const giftOptions = computed<(Gift | null)[]>(() => {
    if (!currentSpecialty.value) return []
    const spec = currentSpecialty.value
    if (spec.gift2 === null) return [spec.gift1]
    return [spec.gift1, spec.gift2]
  })

  const selectedGift = computed<Gift | null>(() => {
    const opts = giftOptions.value
    if (opts.length === 0) return null
    if (opts.length === 1) return opts[0]
    return opts[state.selectedGiftIndex] ?? opts[0]
  })

  const startingTalentOptions = computed<string[]>(() => {
    return currentSpecialty.value?.startingTalents ?? []
  })

  // --- Energy modifiers (mirrors Excel IFS formulas for B17/B21/B25) ---

  const energyModifiers = computed<Record<EnergyGroup, number>>(() => {
    const mods: Record<EnergyGroup, number> = {
      Mental: 0,
      Physical: 0,
      Emotional: 0,
    }
    if (statBoost.value) {
      mods[statBoost.value] += 1
    }
    return mods
  })

  // --- Keen skill check (mirrors Excel COUNTIF against E4:E6) ---

  function isKeenSkill(skill: Skill): boolean {
    return state.keenSkill === skill
  }

  // --- XP calculations (mirrors Excel IFS in C56-C59 and B5) ---

  const xpTotal = computed(() => state.level * 3)

  const xpSpent = computed(() => {
    let spent = 0
    // Skill 1 = starting talent, using the discounted starting-talent ladder.
    if (state.startingTalent) {
      spent += XP_COST_STARTING[state.startingTalentTier]
    }
    // Skills 2-4 = the three additional talent slots, using the standard ladder.
    for (const slot of state.talents) {
      if (slot) {
        spent += XP_COST_OTHER[slot.tier]
      }
    }
    return spent
  })

  const xpRemaining = computed(() => xpTotal.value - xpSpent.value)

  // --- Talent lookup ---

  function getTalentData(name: string): Talent | undefined {
    return talents.find((t) => t.name === name)
  }

  function getWeaponData(name: string): Weapon | undefined {
    return weapons.find((w) => w.name === name)
  }

  // --- HP (always 12 for level 1 new characters) ---
  const hp = computed(() => 12)

  // --- Reset when specialty changes ---

  function setSpecialty(name: string) {
    state.specialty = name
    state.keenSkill = null
    state.selectedGiftIndex = 0
    state.startingTalent = null
    state.startingTalentTier = 'Novice'
    state.talents = [null, null, null]
    state.startingItems = []
  }

  function reset() {
    state.name = ''
    state.specialty = null
    state.keenSkill = null
    state.selectedGiftIndex = 0
    state.startingTalent = null
    state.startingTalentTier = 'Novice'
    state.talents = [null, null, null]
    state.weapons = []
    state.startingItems = []
    state.inventory = ''
    state.hand = 'Right'
    state.level = 1
  }

  return {
    state,
    currentSpecialty,
    statBoost,
    keenSkillOptions,
    giftOptions,
    selectedGift,
    startingTalentOptions,
    energyModifiers,
    isKeenSkill,
    xpTotal,
    xpSpent,
    xpRemaining,
    hp,
    getTalentData,
    getWeaponData,
    setSpecialty,
    reset,
    allSpecialties: specialties,
    allTalents: talents,
    allWeapons: weapons,
  }
}
