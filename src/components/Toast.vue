<script setup lang="ts">
import { toasts, useToast } from '../composables/useToast'

const { dismissToast } = useToast()
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      role="status"
      class="pointer-events-auto max-w-sm rounded shadow-lg px-4 py-3 text-sm flex items-start gap-3 border"
      :class="
        t.variant === 'error'
          ? 'bg-red-900 text-red-50 border-red-700'
          : 'bg-emerald-900 text-emerald-50 border-emerald-700'
      "
    >
      <div class="flex-1">{{ t.message }}</div>
      <button
        v-if="t.action"
        type="button"
        class="text-xs underline hover:no-underline whitespace-nowrap"
        @click="t.action.handler()"
      >
        {{ t.action.label }}
      </button>
      <button
        type="button"
        aria-label="Dismiss notification"
        class="text-xs opacity-70 hover:opacity-100 ml-1"
        @click="dismissToast(t.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
