import type { Talent, TalentSlot } from '../types'

/**
 * Talent-prereq logic extracted from TalentsStep.vue for unit testing.
 *
 * A talent is "available" iff:
 *   - it has no prereq (empty or "None."), OR
 *   - its prereq is parseable AND mechanically satisfied by the player's current talents.
 *
 * Anything else — narrative prereqs ("Have a dog around."), quest rewards,
 * unparseable patterns ("Mastery IN Teke: Soul Seer." with "in" not "of the"),
 * or parseable-but-unmet — is considered UNAVAILABLE and hidden from the dropdown.
 *
 * This is variant 2A from FOI-205: strict "show only what's takeable".
 */

export function hasPrerequisite(t: Talent): boolean {
  return !!t.prerequisite && t.prerequisite !== 'None.'
}

/**
 * Parses "Mastery of the X talent." and "Mastery of the X or Y talent." (case-insensitive).
 * Returns candidate talent names, or null for narrative/unparseable prereqs.
 */
export function parseMasteryPrereq(prereq: string): string[] | null {
  const m = prereq.match(/^Mastery of the (.+?) talent[.,]?/i)
  if (!m) return null
  return m[1].split(/\s+or\s+/i).map((s) => s.trim())
}

/**
 * True iff the prereq is parseable AND one of the candidate talents is held at Master tier.
 * False for narrative / unparseable prereqs.
 */
export function isPrereqSatisfied(
  prereq: string,
  slots: (TalentSlot | null)[],
): boolean {
  const candidates = parseMasteryPrereq(prereq)
  if (!candidates) return false
  const mastered = new Set(
    slots
      .filter((s): s is TalentSlot => !!s && s.tier === 'Master')
      .map((s) => s.name.toUpperCase()),
  )
  return candidates.some((name) => mastered.has(name.toUpperCase()))
}

/**
 * FOI-205 variant 2A: a talent is available iff it has no prereq OR its prereq
 * is mechanically satisfied. Narrative prereqs are hidden entirely (no 🔒 display).
 */
export function isTalentAvailable(
  t: Talent,
  slots: (TalentSlot | null)[],
): boolean {
  if (!hasPrerequisite(t)) return true
  return isPrereqSatisfied(t.prerequisite!, slots)
}
