import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import type { FieldIntents, FieldMapping } from './engine'

export interface MappingCheckConfig<State> {
  templatePath: string
  intent: FieldIntents
  mapping: FieldMapping<State>
  samples: State[]
  fieldAliases?: Record<string, string>
  /** Skip the check entirely — emergency releases only */
  skip?: boolean
}

export interface CheckResult {
  ok: boolean
  failures: string[]
  warnings: string[]
}

export async function runMappingCheck<State>(
  config: MappingCheckConfig<State>,
): Promise<CheckResult> {
  const { templatePath, intent, mapping, samples, fieldAliases } = config
  const failures: string[] = []
  const warnings: string[] = []

  // 1. Load the PDF and extract field names
  const bytes = readFileSync(templatePath)
  const doc = await PDFDocument.load(bytes)
  const pdfFieldNames = new Set(
    doc
      .getForm()
      .getFields()
      .map((f) => f.getName()),
  )

  // 2. Compute the union of mapping output keys across all samples.
  //    Apply fieldAliases so we compare against what the PDF actually has.
  const producedKeys = new Set<string>()
  for (const sample of samples) {
    const output = mapping(sample)
    for (const [rawKey, value] of Object.entries(output)) {
      if (value === undefined) continue
      const resolved = fieldAliases?.[rawKey] ?? rawKey
      producedKeys.add(resolved)
    }
  }

  // 3. Resolve INTENT keys through aliases too — so the user can author INTENT
  //    with clean key names and let aliases handle the typo layer.
  const resolvedIntent = new Map<string, FieldIntents[string]>()
  for (const [rawKey, value] of Object.entries(intent)) {
    const resolved = fieldAliases?.[rawKey] ?? rawKey
    resolvedIntent.set(resolved, value)
  }
  const intentKeys = new Set(resolvedIntent.keys())

  // --- Invariant 1: every PDF field must be classified in INTENT
  for (const pdfField of pdfFieldNames) {
    if (!intentKeys.has(pdfField)) {
      failures.push(
        `PDF field "${pdfField}" is not classified in INTENT. ` +
          `Add it as 'app-fill' / 'player-fill' / 'calculated-stub' / 'template-artifact'.`,
      )
    }
  }

  // --- Invariant 2: every INTENT key must exist in PDF
  for (const intentKey of intentKeys) {
    if (!pdfFieldNames.has(intentKey)) {
      failures.push(
        `INTENT key "${intentKey}" is not present in the PDF. ` +
          `Typo? Add to fieldAliases or remove from INTENT.`,
      )
    }
  }

  // --- Invariants 3-6: per-field behavior
  for (const [intentKey, fieldIntent] of resolvedIntent) {
    const produced = producedKeys.has(intentKey)

    if (fieldIntent === 'app-fill' && !produced) {
      failures.push(
        `Field "${intentKey}" is declared 'app-fill' but no sample's mapping produces a value. ` +
          `Extend the mapping or change the intent.`,
      )
    }
    if (fieldIntent === 'player-fill' && produced) {
      failures.push(
        `Field "${intentKey}" is declared 'player-fill' but the mapping produces a value. ` +
          `Remove from mapping or change intent to 'app-fill'.`,
      )
    }
    if (fieldIntent === 'template-artifact' && produced) {
      failures.push(
        `Field "${intentKey}" is declared 'template-artifact' (InDesign bug) but the mapping ` +
          `produces a value. Fix the template or change intent.`,
      )
    }
    if (fieldIntent === 'calculated-stub' && produced) {
      warnings.push(
        `Field "${intentKey}" is declared 'calculated-stub' but the mapping now produces a value — ` +
          `consider upgrading intent to 'app-fill'.`,
      )
    }
  }

  return { ok: failures.length === 0, failures, warnings }
}

export function createMappingCheckPlugin<State>(
  config: MappingCheckConfig<State>,
): Plugin {
  return {
    name: 'ttrpg-pdf-fill:mapping-check',
    async buildStart(this: {
      warn: (msg: string) => void
      error: (msg: string) => never
    }) {
      if (config.skip || process.env.TTRPG_PDF_INTENT_SKIP === '1') {
        this.warn('ttrpg-pdf-fill: INTENT check skipped (escape hatch active)')
        return
      }
      const result = await runMappingCheck(config)
      for (const w of result.warnings) this.warn(`ttrpg-pdf-fill: ${w}`)
      if (!result.ok) {
        this.error(
          `ttrpg-pdf-fill INTENT check failed:\n` +
            result.failures.map((f) => `  - ${f}`).join('\n'),
        )
      }
    },
  } as Plugin
}
