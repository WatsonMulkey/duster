import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast, toasts } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    toasts.value = []
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('showToast adds a toast', () => {
    const { showToast } = useToast()
    showToast({ message: 'hello', variant: 'success' })
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.message).toBe('hello')
  })

  it('returns an id from showToast', () => {
    const { showToast } = useToast()
    const id1 = showToast({ message: 'a', variant: 'success' })
    const id2 = showToast({ message: 'b', variant: 'success' })
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('number')
  })

  it('auto-dismisses success toast after 4s', () => {
    const { showToast } = useToast()
    showToast({ message: 'bye', variant: 'success' })
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(4000)
    expect(toasts.value).toHaveLength(0)
  })

  it('does NOT auto-dismiss error toast', () => {
    const { showToast } = useToast()
    showToast({ message: 'err', variant: 'error' })
    vi.advanceTimersByTime(10_000)
    expect(toasts.value).toHaveLength(1)
  })

  it('dismissToast removes by id', () => {
    const { showToast, dismissToast } = useToast()
    const id = showToast({ message: 'x', variant: 'error' })
    expect(toasts.value).toHaveLength(1)
    dismissToast(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('carries an optional action through to the toast', () => {
    const { showToast } = useToast()
    const handler = vi.fn()
    showToast({
      message: 'err',
      variant: 'error',
      action: { label: 'Retry', handler },
    })
    expect(toasts.value[0]?.action?.label).toBe('Retry')
    toasts.value[0]?.action?.handler()
    expect(handler).toHaveBeenCalledOnce()
  })
})
