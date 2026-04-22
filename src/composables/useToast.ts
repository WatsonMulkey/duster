import { ref } from 'vue'

export interface ToastAction {
  label: string
  handler: () => void
}

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'error'
  action?: ToastAction
}

export const toasts = ref<Toast[]>([])
let nextId = 1

const SUCCESS_AUTO_DISMISS_MS = 4000

export function useToast() {
  function showToast(opts: Omit<Toast, 'id'>): number {
    const id = nextId++
    toasts.value.push({ id, ...opts })
    if (opts.variant === 'success') {
      setTimeout(() => dismissToast(id), SUCCESS_AUTO_DISMISS_MS)
    }
    return id
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { showToast, dismissToast }
}
