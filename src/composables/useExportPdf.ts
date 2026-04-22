import { ref } from 'vue'
import type { CharacterState } from '../types'
import { useToast } from './useToast'

const TEMPLATE_URL = '/templates/character-sheet.pdf'

/**
 * Load the PDF template, run the Duster mapping, return filled bytes.
 * All heavy imports (pdf-lib + engine + mapping) are dynamic so the
 * ~100KB stays out of the main bundle.
 */
export async function exportCharacterPdf(
  state: CharacterState,
): Promise<Uint8Array> {
  // Dynamic imports — deferred until button click.
  // Import engine directly (not index) so the vite-plugin (which uses node:fs)
  // doesn't get dragged into the browser bundle.
  const { fillCharacterSheet } = await import('../pdf/ttrpg-pdf-fill/engine')
  const { dusterMapping } = await import('../pdf/duster-mapping')
  const { dusterOverrides } = await import('../pdf/duster-overrides')
  const { dusterAliases } = await import('../pdf/duster-aliases')

  const response = await fetch(TEMPLATE_URL)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF template (HTTP ${response.status}). ` +
        `Check that public/templates/character-sheet.pdf shipped with the build.`,
    )
  }
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  return await fillCharacterSheet({
    templateBytes,
    mapping: dusterMapping,
    state,
    fieldAliases: dusterAliases,
    fieldOverrides: dusterOverrides,
  })
}

function sanitizeFilename(raw: string): string {
  // Keep alphanumerics, spaces, dashes, underscores. Collapse spaces.
  const cleaned = raw.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return cleaned || 'character'
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Give the browser a tick before revoking — some browsers race the click
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Composable wrapping the export flow with toast + error-recovery UX.
 *
 * Usage:
 *   const { exporting, handleExport } = useExportPdf()
 *   <button :disabled="exporting" @click="handleExport(state)">...</button>
 */
export function useExportPdf() {
  const exporting = ref(false)
  const { showToast } = useToast()

  async function handleExport(state: CharacterState): Promise<void> {
    if (exporting.value) return
    exporting.value = true
    try {
      const bytes = await exportCharacterPdf(state)
      const filename = `duster-${sanitizeFilename(state.name)}.pdf`
      triggerDownload(bytes, filename)
      showToast({
        message:
          'Character sheet downloaded. Open in Adobe Reader for best fidelity.',
        variant: 'success',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast({
        message: `Export failed: ${msg}`,
        variant: 'error',
        action: {
          label: 'Copy error details',
          handler: () => {
            const details = JSON.stringify(
              {
                error: msg,
                stack: err instanceof Error ? err.stack : undefined,
                field: (err as { field?: string })?.field,
                state,
                userAgent:
                  typeof navigator !== 'undefined' ? navigator.userAgent : '',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            )
            void navigator.clipboard?.writeText(details)
          },
        },
      })
      console.error('[ttrpg-pdf-fill]', err)
    } finally {
      exporting.value = false
    }
  }

  return { exporting, handleExport }
}
