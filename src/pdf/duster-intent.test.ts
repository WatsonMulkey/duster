import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'node:fs'
import { dusterIntent } from './duster-intent'
import { dusterAliases } from './duster-aliases'
import type { FieldIntent } from './ttrpg-pdf-fill/engine'

describe('dusterIntent', () => {
  it('has exactly 81 entries', () => {
    expect(Object.keys(dusterIntent).length).toBe(81)
  })

  it('has zero calculated-stub entries', () => {
    const stubs = Object.entries(dusterIntent).filter(
      ([, v]) => v === 'calculated-stub',
    )
    expect(stubs).toEqual([])
  })

  it('has zero template-artifact entries', () => {
    const artifacts = Object.entries(dusterIntent).filter(
      ([, v]) => v === 'template-artifact',
    )
    expect(artifacts).toEqual([])
  })

  it('has exactly 39 app-fill and 42 player-fill', () => {
    const counts = Object.values(dusterIntent).reduce<
      Record<FieldIntent, number>
    >(
      (acc, v) => {
        acc[v] = (acc[v] ?? 0) + 1
        return acc
      },
      {
        'app-fill': 0,
        'player-fill': 0,
        'calculated-stub': 0,
        'template-artifact': 0,
      },
    )
    expect(counts['app-fill']).toBe(39)
    expect(counts['player-fill']).toBe(42)
  })

  it('covers every field in the real Mac_Sheet.pdf (with aliases applied)', async () => {
    const bytes = readFileSync('public/templates/character-sheet.pdf')
    const doc = await PDFDocument.load(bytes)
    const pdfFieldNames = doc
      .getForm()
      .getFields()
      .map((f) => f.getName())

    const intentKeys = new Set(
      Object.keys(dusterIntent).map((k) => dusterAliases[k] ?? k),
    )

    const missing = pdfFieldNames.filter((n) => !intentKeys.has(n))
    expect(missing).toEqual([])
  })

  it('has no INTENT keys that do not exist in the PDF', async () => {
    const bytes = readFileSync('public/templates/character-sheet.pdf')
    const doc = await PDFDocument.load(bytes)
    const pdfFieldNames = new Set(
      doc
        .getForm()
        .getFields()
        .map((f) => f.getName()),
    )

    const extra = Object.keys(dusterIntent)
      .map((k) => dusterAliases[k] ?? k)
      .filter((resolvedKey) => !pdfFieldNames.has(resolvedKey))
    expect(extra).toEqual([])
  })
})
