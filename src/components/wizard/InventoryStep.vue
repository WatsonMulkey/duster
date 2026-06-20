<script setup lang="ts">
import type { Hand } from '../../types'

const props = defineProps<{
  name: string
  inventory: string
  hand: Hand
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:inventory': [value: string]
  'update:hand': [value: Hand]
  reset: []
}>()

const hands: Hand[] = ['Right', 'Left']
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Final Details</h2>
    <p class="text-gray-600 mb-6">Name your character and review your inventory.</p>

    <div class="space-y-4 max-w-xl">
      <div>
        <label class="block font-semibold text-sm mb-1">Character Name</label>
        <input
          type="text"
          :value="name"
          @input="emit('update:name', ($event.target as HTMLInputElement).value)"
          class="w-full border rounded px-3 py-2"
          placeholder="Enter character name..."
        />
      </div>

      <div>
        <label class="block font-semibold text-sm mb-1">Dominant Hand</label>
        <div class="flex gap-2" data-testid="hand-picker">
          <button
            v-for="h in hands"
            :key="h"
            @click="emit('update:hand', h)"
            class="px-4 py-2 border-2 rounded transition-all"
            :class="hand === h ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'"
          >
            {{ h }}
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-baseline justify-between mb-1 gap-2">
          <label class="block font-semibold text-sm">Inventory</label>
          <button
            type="button"
            @click="emit('reset')"
            class="text-xs text-gray-500 hover:text-black underline underline-offset-2"
          >
            ↺ Reset to starting gear
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-1">
          Your starting kit and rolled items are filled in below — one per line. Edit freely.
        </p>
        <textarea
          :value="inventory"
          @input="emit('update:inventory', ($event.target as HTMLTextAreaElement).value)"
          rows="14"
          class="w-full border rounded px-3 py-2 font-mono text-sm leading-relaxed"
          placeholder="One item per line..."
        />
      </div>
    </div>
  </div>
</template>
