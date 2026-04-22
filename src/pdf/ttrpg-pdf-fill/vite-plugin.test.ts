import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMappingCheck, createMappingCheckPlugin } from './vite-plugin'
import type { FieldIntents } from './engine'

// --- Test helpers ---

async function makeFixturePdf(fields: string[]): Promise<string> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([400, 400])
  const form = doc.getForm()
  let y = 350
  for (const name of fields) {
    const tf = form.createTextField(name)
    tf.addToPage(page, { x: 50, y, width: 200, height: 20 })
    y -= 30
  }
  const bytes = await doc.save()
  const dir = mkdtempSync(join(tmpdir(), 'ttrpg-pdf-'))
  const path = join(dir, 'fixture.pdf')
  writeFileSync(path, bytes)
  return path
}

// --- Invariant 1: unclassified PDF field ---

describe('runMappingCheck — invariant 1 (PDF field not in INTENT)', () => {
  it('fails when PDF has a field not listed in INTENT', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'UNKNOWN_FIELD'])
    const intent: FieldIntents = { NAME: 'app-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/UNKNOWN_FIELD/)
    expect(result.failures.join('\n')).toMatch(/not classified in INTENT/)
  })
})

// --- Invariant 2: INTENT key not in PDF ---

describe('runMappingCheck — invariant 2 (INTENT key not in PDF)', () => {
  it('fails when INTENT lists a field that is not in the PDF', async () => {
    const templatePath = await makeFixturePdf(['NAME'])
    const intent: FieldIntents = { NAME: 'app-fill', GHOST: 'app-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', GHOST: 'Y' }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/GHOST/)
  })
})

// --- Invariant 3: app-fill not produced ---

describe('runMappingCheck — invariant 3 (app-fill not produced)', () => {
  it('fails when an app-fill field is not produced by any sample', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'XP'])
    const intent: FieldIntents = { NAME: 'app-fill', XP: 'app-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/XP/)
    expect(result.failures.join('\n')).toMatch(/no sample/)
  })

  it('undefined values do NOT count as produced', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'XP'])
    const intent: FieldIntents = { NAME: 'app-fill', XP: 'app-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', XP: undefined }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/XP/)
  })
})

// --- Invariant 4: player-fill leak ---

describe('runMappingCheck — invariant 4 (player-fill leak)', () => {
  it('fails when a player-fill field is produced by a sample', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Head'])
    const intent: FieldIntents = { NAME: 'app-fill', Head: 'player-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', Head: '12' }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/Head/)
    expect(result.failures.join('\n')).toMatch(/player-fill/)
  })
})

// --- Invariant 5: template-artifact leak ---

describe('runMappingCheck — invariant 5 (template-artifact leak)', () => {
  it('fails when a template-artifact is produced by a sample', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Artifact'])
    const intent: FieldIntents = {
      NAME: 'app-fill',
      Artifact: 'template-artifact',
    }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', Artifact: 'oops' }),
      samples: [{}],
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/Artifact/)
  })
})

// --- Invariant 6: calculated-stub upgrade warn ---

describe('runMappingCheck — invariant 6 (calculated-stub upgrade warn)', () => {
  it('warns (does not fail) when calculated-stub is produced', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Maybe'])
    const intent: FieldIntents = { NAME: 'app-fill', Maybe: 'calculated-stub' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', Maybe: 'now-I-know' }),
      samples: [{}],
    })
    expect(result.ok).toBe(true)
    expect(result.warnings.join('\n')).toMatch(/Maybe/)
    expect(result.warnings.join('\n')).toMatch(/upgrading intent/)
  })

  it('calculated-stub not produced → silent (no warn, no fail)', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Maybe'])
    const intent: FieldIntents = { NAME: 'app-fill', Maybe: 'calculated-stub' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
    })
    expect(result.ok).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })
})

// --- Happy path + field aliases ---

describe('runMappingCheck — happy path', () => {
  it('passes when INTENT is complete and mapping is correct', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'XP', 'Head'])
    const intent: FieldIntents = {
      NAME: 'app-fill',
      XP: 'app-fill',
      Head: 'player-fill',
    }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X', XP: '3' }),
      samples: [{}],
    })
    expect(result.ok).toBe(true)
    expect(result.failures).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})

describe('runMappingCheck — fieldAliases', () => {
  it('resolves INTENT keys through aliases', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Stess 1'])
    const intent: FieldIntents = {
      NAME: 'app-fill',
      'Stress 1': 'player-fill', // author-friendly key
    }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
      fieldAliases: { 'Stress 1': 'Stess 1' },
    })
    expect(result.ok).toBe(true)
  })

  it('resolves mapping keys through aliases when checking leaks', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Stess 1'])
    const intent: FieldIntents = {
      NAME: 'app-fill',
      'Stress 1': 'player-fill',
    }
    const result = await runMappingCheck({
      templatePath,
      intent,
      // Mapping produces the aliased key; should be flagged as leak
      mapping: () => ({ NAME: 'X', 'Stress 1': 'leak' }),
      samples: [{}],
      fieldAliases: { 'Stress 1': 'Stess 1' },
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join('\n')).toMatch(/Stess 1/)
  })
})

describe('runMappingCheck — multi-sample union', () => {
  it('unions produced keys across samples', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'GIFT'])
    const intent: FieldIntents = { NAME: 'app-fill', GIFT: 'app-fill' }
    const result = await runMappingCheck({
      templatePath,
      intent,
      mapping: (s: { which: 'name-only' | 'gift-only' }) =>
        s.which === 'name-only' ? { NAME: 'X' } : { GIFT: 'Y' },
      samples: [{ which: 'name-only' }, { which: 'gift-only' }],
    })
    // Each sample misses one field individually, but union covers both
    expect(result.ok).toBe(true)
  })
})

// --- createMappingCheckPlugin buildStart integration ---

describe('createMappingCheckPlugin — buildStart hook', () => {
  it('calls this.error on failure', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'UNCLASSIFIED'])
    const plugin = createMappingCheckPlugin({
      templatePath,
      intent: { NAME: 'app-fill' },
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
    })
    const ctx = {
      error: (msg: string) => {
        throw new Error(msg)
      },
      warn: (_msg: string) => {},
    }
    const buildStart = plugin.buildStart as unknown as (
      this: typeof ctx,
    ) => Promise<void>
    await expect(buildStart.call(ctx)).rejects.toThrow(/UNCLASSIFIED/)
  })

  it('calls this.warn on happy path with calculated-stub upgrade', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'Maybe'])
    const plugin = createMappingCheckPlugin({
      templatePath,
      intent: { NAME: 'app-fill', Maybe: 'calculated-stub' },
      mapping: () => ({ NAME: 'X', Maybe: 'upgrade-me' }),
      samples: [{}],
    })
    const warnings: string[] = []
    const ctx = {
      error: (_msg: string) => {
        throw new Error('should not be called')
      },
      warn: (msg: string) => warnings.push(msg),
    }
    const buildStart = plugin.buildStart as unknown as (
      this: typeof ctx,
    ) => Promise<void>
    await buildStart.call(ctx)
    expect(warnings.join('\n')).toMatch(/Maybe/)
  })

  it('respects TTRPG_PDF_INTENT_SKIP env var', async () => {
    const prev = process.env.TTRPG_PDF_INTENT_SKIP
    process.env.TTRPG_PDF_INTENT_SKIP = '1'
    try {
      const templatePath = await makeFixturePdf(['NAME', 'UNCLASSIFIED'])
      const plugin = createMappingCheckPlugin({
        templatePath,
        intent: { NAME: 'app-fill' },
        mapping: () => ({ NAME: 'X' }),
        samples: [{}],
      })
      const warnings: string[] = []
      const ctx = {
        error: (_msg: string) => {
          throw new Error('should not be called')
        },
        warn: (m: string) => warnings.push(m),
      }
      const buildStart = plugin.buildStart as unknown as (
        this: typeof ctx,
      ) => Promise<void>
      await buildStart.call(ctx)
      expect(warnings.join('\n')).toMatch(/skipped/)
    } finally {
      if (prev === undefined) delete process.env.TTRPG_PDF_INTENT_SKIP
      else process.env.TTRPG_PDF_INTENT_SKIP = prev
    }
  })

  it('respects config.skip flag', async () => {
    const templatePath = await makeFixturePdf(['NAME', 'UNCLASSIFIED'])
    const plugin = createMappingCheckPlugin({
      templatePath,
      intent: { NAME: 'app-fill' },
      mapping: () => ({ NAME: 'X' }),
      samples: [{}],
      skip: true,
    })
    const warnings: string[] = []
    const ctx = {
      error: (_msg: string) => {
        throw new Error('should not be called')
      },
      warn: (m: string) => warnings.push(m),
    }
    const buildStart = plugin.buildStart as unknown as (
      this: typeof ctx,
    ) => Promise<void>
    await buildStart.call(ctx)
    expect(warnings.join('\n')).toMatch(/skipped/)
  })
})
