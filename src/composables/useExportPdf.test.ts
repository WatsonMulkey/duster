import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useExportPdf } from './useExportPdf'
import { toasts } from './useToast'
import type { CharacterState } from '../types'

const STUB_STATE: CharacterState = {
  name: 'Test Character',
  specialty: 'STITCH',
  keenSkill: 'Focus',
  selectedGiftIndex: 0,
  startingTalent: 'GOOD MEDICINE',
  talents: [null, null, null],
  weapons: [],
  startingItems: [],
  inventory: '',
  hand: 'Right',
  level: 1,
}

describe('useExportPdf — error handling', () => {
  beforeEach(() => {
    toasts.value = []
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error toast when fetch fails (non-200)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    )
    const { handleExport, exporting } = useExportPdf()
    await handleExport(STUB_STATE)
    expect(exporting.value).toBe(false)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.variant).toBe('error')
    expect(toasts.value[0]?.message).toMatch(/500/)
  })

  it('includes a Copy error details action on error toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    )
    const { handleExport } = useExportPdf()
    await handleExport(STUB_STATE)
    expect(toasts.value[0]?.action?.label).toBe('Copy error details')
  })

  it('prevents concurrent exports via exporting flag', async () => {
    // fetch never resolves — keeps the first call in flight
    let resolveFetch: (v: Response) => void = () => {}
    const fetchPromise = new Promise<Response>((r) => {
      resolveFetch = r as (v: Response) => void
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise))

    const { handleExport, exporting } = useExportPdf()
    const firstCall = handleExport(STUB_STATE)
    // exporting should flip to true synchronously after calling
    // (Vue ref writes are sync). Wait for microtask flush.
    await Promise.resolve()
    expect(exporting.value).toBe(true)

    // Second call while first is in flight — early-return
    await handleExport(STUB_STATE)

    // Toasts from second call should NOT exist (concurrent guard worked)
    expect(toasts.value).toHaveLength(0)

    // Now let the first call fail gracefully
    resolveFetch({
      ok: false,
      status: 503,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response)
    await firstCall
    expect(exporting.value).toBe(false)
  })
})
