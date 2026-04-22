import { PDFDocument, StandardFonts } from 'pdf-lib'

// --- Types ---

export type FieldValue =
  | string
  | boolean
  | undefined
  | { kind: 'text'; value: string }
  | { kind: 'checkbox'; value: boolean }
  | { kind: 'radio'; value: string }
  | { kind: 'choice'; value: string }

export type FieldMapping<State> = (state: State) => Record<string, FieldValue>

export type FieldOverrides = Record<
  string,
  {
    multiline?: boolean
    alignment?: 'left' | 'center' | 'right'
    fontSize?: number
  }
>

export type FieldIntent =
  | 'app-fill'
  | 'player-fill'
  | 'calculated-stub'
  | 'template-artifact'

export type FieldIntents = Record<string, FieldIntent>

export interface FillCharacterSheetOptions<State> {
  templateBytes: Uint8Array
  mapping: FieldMapping<State>
  state: State
  filename?: string
  fieldAliases?: Record<string, string>
  fieldOverrides?: FieldOverrides
}

// --- Error classes ---

export class PdfFillError extends Error {
  field?: string
  override cause?: unknown
  constructor(message: string, field?: string, cause?: unknown) {
    super(message)
    this.name = 'PdfFillError'
    this.field = field
    this.cause = cause
  }
}

export class NotYetImplementedError extends PdfFillError {
  constructor(message: string, field?: string) {
    super(message, field)
    this.name = 'NotYetImplementedError'
  }
}

export class EncodingError extends PdfFillError {
  constructor(message: string, field?: string) {
    super(message, field)
    this.name = 'EncodingError'
  }
}

export class UnknownFieldError extends PdfFillError {
  constructor(message: string, field?: string) {
    super(message, field)
    this.name = 'UnknownFieldError'
  }
}

// --- Internal helpers ---

type NormalizedValue =
  | { kind: 'text'; value: string }
  | { kind: 'checkbox'; value: boolean }
  | { kind: 'radio'; value: string }
  | { kind: 'choice'; value: string }

function normalizeValue(value: FieldValue): NormalizedValue | null {
  if (value === undefined) return null
  if (typeof value === 'string') return { kind: 'text', value }
  if (typeof value === 'boolean') return { kind: 'checkbox', value }
  return value
}

function resolveAlias(key: string, aliases?: Record<string, string>): string {
  return aliases?.[key] ?? key
}

/**
 * WinAnsi (CP1252) covers three ranges:
 *   - 0x20-0x7E: ASCII printable
 *   - 0xA0-0xFF: Latin-1 supplement
 *   - 0x80-0x9F gap: a curated set of General Punctuation + symbols mapped in by CP1252
 *
 * That gap is where smart punctuation lives. WinAnsi 0x91 = U+2018 (left single
 * quote), 0x92 = U+2019 (right single quote), 0x93/0x94 = U+201C/D (curly double
 * quotes), 0x96/0x97 = U+2013/2014 (en/em dash), 0x85 = U+2026 (ellipsis), etc.
 *
 * These ARE representable in pdf-lib's default Helvetica + WinAnsi encoding —
 * no need to normalize to ASCII.
 */
const WINANSI_EXTRA_CODEPOINTS = new Set<number>([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6,
  0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
])

function assertWinAnsi(value: string, fieldName: string): void {
  for (const ch of value) {
    const cp = ch.codePointAt(0)!
    const isWhitespace = cp === 0x09 || cp === 0x0a || cp === 0x0d
    const isAscii = cp >= 0x20 && cp <= 0x7e
    const isLatin1 = cp >= 0xa0 && cp <= 0xff
    const isWinAnsiExtra = WINANSI_EXTRA_CODEPOINTS.has(cp)
    if (!isWhitespace && !isAscii && !isLatin1 && !isWinAnsiExtra) {
      throw new EncodingError(
        `Field "${fieldName}" contains non-WinAnsi character "${ch}" ` +
          `(U+${cp.toString(16).toUpperCase().padStart(4, '0')}). ` +
          `pdf-lib's default Helvetica font doesn't support it. ` +
          `Replace/remove the character, or embed a UTF-8 font (deferred to v2).`,
        fieldName,
      )
    }
  }
}

// --- Main entry point ---

export async function fillCharacterSheet<State>(
  opts: FillCharacterSheetOptions<State>,
): Promise<Uint8Array> {
  const { templateBytes, mapping, state, fieldAliases, fieldOverrides } = opts

  const doc = await PDFDocument.load(templateBytes)
  const form = doc.getForm()
  const output = mapping(state)

  for (const [rawKey, rawValue] of Object.entries(output)) {
    const normalized = normalizeValue(rawValue)
    if (normalized === null) continue // undefined → skip

    const key = resolveAlias(rawKey, fieldAliases)

    let field
    try {
      field = form.getField(key)
    } catch {
      throw new UnknownFieldError(
        `Mapping produced key "${rawKey}"` +
          (rawKey !== key ? ` (aliased to "${key}")` : '') +
          ` but the PDF has no field by that name. Check fieldAliases or remove from mapping.`,
        rawKey,
      )
    }

    if (normalized.kind === 'text') {
      // Strict WinAnsi check (including smart punctuation in the 0x80-0x9F gap).
      // Pass through as-is — pdf-lib's Helvetica + WinAnsi encoding handles
      // curly quotes, em-dashes, ellipsis, etc. natively.
      assertWinAnsi(normalized.value, key)
      // pdf-lib's form field types are unions; cast to access setText
      const tf = field as unknown as {
        setText: (v: string) => void
        enableMultiline: () => void
        disableMultiline: () => void
        setAlignment: (a: number) => void
        setFontSize: (s: number) => void
      }
      tf.setText(normalized.value)

      const override = fieldOverrides?.[key]
      if (override) {
        if (override.multiline === true) tf.enableMultiline()
        if (override.multiline === false) tf.disableMultiline()
        if (override.alignment) {
          // pdf-lib TextAlignment: Left=0, Center=1, Right=2
          const alignMap = { left: 0, center: 1, right: 2 } as const
          tf.setAlignment(alignMap[override.alignment])
        }
        if (override.fontSize !== undefined) tf.setFontSize(override.fontSize)
      }
    } else if (normalized.kind === 'checkbox') {
      const cb = field as unknown as { check: () => void; uncheck: () => void }
      if (normalized.value) cb.check()
      else cb.uncheck()
    } else if (normalized.kind === 'radio' || normalized.kind === 'choice') {
      throw new NotYetImplementedError(
        `Field "${key}" uses "${normalized.kind}" which is not supported in v1. ` +
          `Only text and checkbox fields are implemented.`,
        key,
      )
    }
  }

  // Embed Helvetica + update appearances so values render
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  form.updateFieldAppearances(helv)

  return await doc.save()
}
