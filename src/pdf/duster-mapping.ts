import type {
  CharacterState,
  EnergyGroup,
  MasteryTier,
  Skill,
} from '../types'
import { specialties } from '../data/specialties'
import { talents } from '../data/talents'
import type { FieldMapping, FieldValue } from './ttrpg-pdf-fill/engine'

/**
 * Maps a CharacterState to the 39 app-fill values in Mac_Sheet.pdf.
 *
 * See docs/superpowers/specs/2026-04-22-duster-fillable-pdf-export-design.md
 * § "Duster integration — INTENT map (final)" for per-field rationale.
 *
 * Uses fieldAliases from duster-aliases.ts for typo-layer concerns —
 * e.g., the mapping uses "Stress 1" as a key (readable) but the actual
 * PDF field is "Stess 1" (template typo).
 */

const KEEN_SKILL_CHECKBOX: Record<Skill, string> = {
  Focus: 'Check Box8', // No space between 'Box' and digit
  Memory: 'Check Box9',
  Tech: 'Check Box10',
  Force: 'Check Box11',
  Reflex: 'Check Box12',
  Coordination: 'Check Box13',
  Persuasion: 'Check Box14',
  Deception: 'Check Box15',
  Intuition: 'Check Box16',
}

function findSpecialty(name: string | null) {
  if (!name) return null
  return specialties.find((s) => s.name === name) ?? null
}

function findTalent(name: string | null) {
  if (!name) return null
  return talents.find((t) => t.name === name) ?? null
}

function computeGiftName(state: CharacterState): string {
  const spec = findSpecialty(state.specialty)
  if (!spec) return ''
  // TEKE/WITCHLIKE have only 1 gift (gift2 is null)
  if (spec.gift2 === null) return spec.gift1.name
  const gift = state.selectedGiftIndex === 1 ? spec.gift2 : spec.gift1
  return gift?.name ?? ''
}

function computeEnergyModifier(
  state: CharacterState,
  group: EnergyGroup,
): string {
  const spec = findSpecialty(state.specialty)
  if (!spec) return ''
  // '+1' for stat-boost group, EMPTY for others (matches CSV samples, NOT '+0')
  return spec.statBoost === group ? '+1' : ''
}

interface TalentRowText {
  novice: string
  skilled: string
  expert: string
  master: string
}

function computeTalentRow(
  name: string | null,
  tier: MasteryTier,
): TalentRowText {
  if (!name) return { novice: '', skilled: '', expert: '', master: '' }
  const t = findTalent(name)
  if (!t) {
    // Data lookup failed — fall back to just the name so nothing silently disappears
    return { novice: name, skilled: '', expert: '', master: '' }
  }

  // Name/Novice column = name + novice description (two-line rendering)
  const novice = `${name}\n${t.novice}`

  const showsSkilled: boolean = tier !== 'Novice'
  const showsExpert: boolean = tier === 'Expert' || tier === 'Master'
  const showsMaster: boolean = tier === 'Master'

  return {
    novice,
    skilled: showsSkilled ? t.skilled : '',
    expert: showsExpert ? t.expert : '',
    master: showsMaster ? t.master : '',
  }
}

export const dusterMapping: FieldMapping<CharacterState> = (state) => {
  const out: Record<string, FieldValue> = {}

  // Identity
  out.NAME = state.name
  out.SPECIALTY = state.specialty ?? ''
  out.GIFT = computeGiftName(state)
  out.LVL = state.level.toString()
  out.HAND = state.hand

  // XP total (level * 3) — confirmed from CSV samples
  out.XP = (state.level * 3).toString()

  // Energy modifiers (conditional — empty string for non-boost groups)
  out.MENTAL = computeEnergyModifier(state, 'Mental')
  out.PHYSICAL = computeEnergyModifier(state, 'Physical')
  out.EMOTIONAL = computeEnergyModifier(state, 'Emotional')

  // Inventory + weapons
  out.Inventory = state.inventory
  out.Weapons = state.weapons.map((w) => w.name).join(', ')

  // HP (Now / Total) left blank — Andrew's InDesign template has static
  // "NOW"/"TOTAL" labels inside the field rectangles that overlap any value
  // we write. Keep as player-fill until template is fixed.

  // LUCK starts at 0 per Google Sheet template
  out.LUCK = '0'

  // Keen-skill checkboxes (auto-check the one matching state.keenSkill)
  for (const skill of Object.keys(KEEN_SKILL_CHECKBOX) as Skill[]) {
    const boxName = KEEN_SKILL_CHECKBOX[skill]
    out[boxName] = state.keenSkill === skill
  }

  // Talent grid row 1 = starting talent (always Novice tier for new chars)
  const row1 = computeTalentRow(state.startingTalent, 'Novice')
  out['Name/Novice 1'] = row1.novice
  out['Skilled 1'] = row1.skilled
  out['Expert 1'] = row1.expert
  out['Master 1'] = row1.master

  // Talent grid rows 2-4 = state.talents[0..2]
  for (let i = 0; i < 3; i++) {
    const slot = state.talents[i]
    const row = computeTalentRow(slot?.name ?? null, slot?.tier ?? 'Novice')
    const rowNum = i + 2
    out[`Name/Novice ${rowNum}`] = row.novice
    out[`Skilled ${rowNum}`] = row.skilled
    out[`Expert ${rowNum}`] = row.expert
    out[`Master ${rowNum}`] = row.master
  }

  return out
}
