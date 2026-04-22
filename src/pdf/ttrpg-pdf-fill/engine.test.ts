import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import {
  fillCharacterSheet,
  NotYetImplementedError,
  EncodingError,
  UnknownFieldError,
} from './engine'
import type { FieldValue } from './engine'

// --- Test helpers ---

type FixtureField =
  | { kind: 'text'; name: string; multiline?: boolean }
  | { kind: 'checkbox'; name: string }

async function makeSyntheticPdf(fields: FixtureField[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([400, 400])
  const form = doc.getForm()
  let y = 350
  for (const f of fields) {
    if (f.kind === 'text') {
      const tf = form.createTextField(f.name)
      if (f.multiline) tf.enableMultiline()
      tf.addToPage(page, { x: 50, y, width: 200, height: 20 })
    } else {
      const cb = form.createCheckBox(f.name)
      cb.addToPage(page, { x: 50, y, width: 15, height: 15 })
    }
    y -= 30
  }
  return await doc.save()
}

async function readTextField(
  bytes: Uint8Array,
  fieldName: string,
): Promise<string> {
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  return form.getTextField(fieldName).getText() ?? ''
}

async function readCheckBox(
  bytes: Uint8Array,
  fieldName: string,
): Promise<boolean> {
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  return form.getCheckBox(fieldName).isChecked()
}

// --- Auto-wrap shim ---

describe('fillCharacterSheet — auto-wrap', () => {
  it('wraps plain string to text field', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: 'Caleb' }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe('Caleb')
  })

  it('wraps plain boolean true to checked checkbox', async () => {
    const template = await makeSyntheticPdf([{ kind: 'checkbox', name: 'keen' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ keen: true }),
      state: {},
    })
    expect(await readCheckBox(filled, 'keen')).toBe(true)
  })

  it('wraps plain boolean false to unchecked checkbox', async () => {
    const template = await makeSyntheticPdf([{ kind: 'checkbox', name: 'keen' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ keen: false }),
      state: {},
    })
    expect(await readCheckBox(filled, 'keen')).toBe(false)
  })

  it('skips undefined values (leaves field blank)', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'XP' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ XP: undefined }),
      state: {},
    })
    expect(await readTextField(filled, 'XP')).toBe('')
  })

  it('accepts pre-wrapped { kind: text, value }', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: { kind: 'text', value: 'wrapped' } }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe('wrapped')
  })
})

// --- Latin-1 sanitization ---

describe('fillCharacterSheet — smart punctuation normalization', () => {
  it('em-dash (U+2014) normalizes to hyphen', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: 'Name — with em dash' }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe('Name - with em dash')
  })

  it('curly apostrophe (U+2019) normalizes to straight apostrophe', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: "D’Artagnan" }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe("D'Artagnan")
  })

  it('curly double quotes (U+201C / U+201D) normalize to straight quotes', async () => {
    const template = await makeSyntheticPdf([
      { kind: 'text', name: 'Inventory', multiline: true },
    ])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ Inventory: 'He said “hello” and walked off.' }),
      state: {},
    })
    expect(await readTextField(filled, 'Inventory')).toBe(
      'He said "hello" and walked off.',
    )
  })

  it('ellipsis (U+2026) normalizes to three dots', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'F' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ F: 'wait…' }),
      state: {},
    })
    expect(await readTextField(filled, 'F')).toBe('wait...')
  })

  it('en-dash (U+2013) normalizes to hyphen', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'F' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ F: 'range 5–10' }),
      state: {},
    })
    expect(await readTextField(filled, 'F')).toBe('range 5-10')
  })

  it('still throws EncodingError for truly unsupported chars (e.g. CJK)', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    await expect(
      fillCharacterSheet({
        templateBytes: template,
        mapping: () => ({ NAME: '田中' }),
        state: {},
      }),
    ).rejects.toThrow(EncodingError)
  })

  it('still throws EncodingError for emoji', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    await expect(
      fillCharacterSheet({
        templateBytes: template,
        mapping: () => ({ NAME: 'Rocky 🥊' }),
        state: {},
      }),
    ).rejects.toThrow(EncodingError)
  })

  it('names the offending field in encoding errors', async () => {
    const template = await makeSyntheticPdf([
      { kind: 'text', name: 'INVENTORY' },
    ])
    try {
      await fillCharacterSheet({
        templateBytes: template,
        mapping: () => ({ INVENTORY: 'bad 漢字 char' }),
        state: {},
      })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(EncodingError)
      expect((e as EncodingError).field).toBe('INVENTORY')
      expect((e as Error).message).toContain('INVENTORY')
    }
  })

  it('accepts accented Latin-1 (U+00E9 é) unchanged', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: 'Pépé' }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe('Pépé')
  })

  it('accepts newlines and tabs in multiline content', async () => {
    const template = await makeSyntheticPdf([
      { kind: 'text', name: 'Inventory', multiline: true },
    ])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ Inventory: 'Line 1\nLine 2\tcol' }),
      state: {},
    })
    expect(await readTextField(filled, 'Inventory')).toContain('Line 1')
    expect(await readTextField(filled, 'Inventory')).toContain('Line 2')
  })
})

// --- fieldAliases ---

describe('fillCharacterSheet — fieldAliases', () => {
  it('resolves mapping key through alias to actual PDF field', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'Stess 1' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ 'Stress 1': 'X' }),
      state: {},
      fieldAliases: { 'Stress 1': 'Stess 1' },
    })
    expect(await readTextField(filled, 'Stess 1')).toBe('X')
  })

  it('does not affect keys that have no alias', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ NAME: 'direct' }),
      state: {},
      fieldAliases: { OTHER: 'Different' },
    })
    expect(await readTextField(filled, 'NAME')).toBe('direct')
  })
})

// --- Unknown field guard ---

describe('fillCharacterSheet — UnknownFieldError', () => {
  it('throws naming the original mapping key', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    try {
      await fillCharacterSheet({
        templateBytes: template,
        mapping: () => ({ Bogus: 'X' }),
        state: {},
      })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(UnknownFieldError)
      expect((e as Error).message).toContain('Bogus')
    }
  })

  it('notes the alias in the error when one was used', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'NAME' }])
    try {
      await fillCharacterSheet({
        templateBytes: template,
        mapping: () => ({ Original: 'X' }),
        state: {},
        fieldAliases: { Original: 'AliasedButMissing' },
      })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(UnknownFieldError)
      expect((e as Error).message).toContain('Original')
      expect((e as Error).message).toContain('AliasedButMissing')
    }
  })
})

// --- Radio/choice guards ---

describe('fillCharacterSheet — unsupported field kinds', () => {
  it('throws NotYetImplementedError for radio', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'F' }])
    await expect(
      fillCharacterSheet({
        templateBytes: template,
        mapping: () =>
          ({ F: { kind: 'radio', value: 'x' } }) as Record<string, FieldValue>,
        state: {},
      }),
    ).rejects.toThrow(NotYetImplementedError)
  })

  it('throws NotYetImplementedError for choice', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'F' }])
    await expect(
      fillCharacterSheet({
        templateBytes: template,
        mapping: () =>
          ({ F: { kind: 'choice', value: 'x' } }) as Record<string, FieldValue>,
        state: {},
      }),
    ).rejects.toThrow(NotYetImplementedError)
  })
})

// --- fieldOverrides ---

describe('fillCharacterSheet — fieldOverrides', () => {
  it('applies multiline: true', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'Inv' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ Inv: 'A\nB\nC' }),
      state: {},
      fieldOverrides: { Inv: { multiline: true } },
    })
    const doc = await PDFDocument.load(filled)
    const tf = doc.getForm().getTextField('Inv')
    expect(tf.isMultiline()).toBe(true)
    expect(tf.getText()).toContain('A')
    expect(tf.getText()).toContain('C')
  })

  it('applies alignment: center', async () => {
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'MENTAL' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ MENTAL: '+1' }),
      state: {},
      fieldOverrides: { MENTAL: { alignment: 'center' } },
    })
    const doc = await PDFDocument.load(filled)
    const tf = doc.getForm().getTextField('MENTAL')
    // pdf-lib TextAlignment: Left=0, Center=1, Right=2
    expect(tf.getAlignment()).toBe(1)
  })

  it('applies fontSize without throwing', async () => {
    // pdf-lib TextField has no getFontSize getter; trust setFontSize was called
    // by confirming the fill completes and value is present.
    const template = await makeSyntheticPdf([{ kind: 'text', name: 'F' }])
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ F: 'x' }),
      state: {},
      fieldOverrides: { F: { fontSize: 14 } },
    })
    expect(await readTextField(filled, 'F')).toBe('x')
  })
})

// --- Real-PDF integration test ---

describe('fillCharacterSheet — real Mac_Sheet.pdf', () => {
  it('fills identity fields on the production template', async () => {
    const template = new Uint8Array(
      readFileSync('public/templates/character-sheet.pdf'),
    )
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({
        NAME: 'Test Character',
        SPECIALTY: 'STITCH',
        LVL: '1',
        XP: '3',
        HAND: 'Right',
      }),
      state: {},
    })
    expect(await readTextField(filled, 'NAME')).toBe('Test Character')
    expect(await readTextField(filled, 'SPECIALTY')).toBe('STITCH')
    expect(await readTextField(filled, 'LVL')).toBe('1')
    expect(await readTextField(filled, 'XP')).toBe('3')
    expect(await readTextField(filled, 'HAND')).toBe('Right')
  })

  it('checks a real checkbox on the production template', async () => {
    // Note: field name is 'Check Box8' (no space between 'Box' and digit)
    const template = new Uint8Array(
      readFileSync('public/templates/character-sheet.pdf'),
    )
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ 'Check Box8': true }),
      state: {},
    })
    expect(await readCheckBox(filled, 'Check Box8')).toBe(true)
  })

  it('resolves Stess 1 typo via fieldAliases on production template', async () => {
    const template = new Uint8Array(
      readFileSync('public/templates/character-sheet.pdf'),
    )
    const filled = await fillCharacterSheet({
      templateBytes: template,
      mapping: () => ({ 'Stress 1': 'X' }),
      state: {},
      fieldAliases: { 'Stress 1': 'Stess 1' },
    })
    expect(await readTextField(filled, 'Stess 1')).toBe('X')
  })
})
