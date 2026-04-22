/**
 * Typo layer: lets mapping code reference correctly-spelled keys while the
 * actual PDF has the typo. When Andrew fixes the template, the alias can be
 * removed AND the dusterIntent 'Stess 1' key updated to 'Stress 1'.
 */
export const dusterAliases: Record<string, string> = {
  'Stress 1': 'Stess 1', // Template typo (missing 'r')
}
