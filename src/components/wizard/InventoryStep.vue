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
}>()

const hands: Hand[] = ['Right', 'Left', 'Both']
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Final Details</h2>
    <p class="text-gray-600 mb-6">Name your character and note your starting inventory.</p>

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
        <div class="flex gap-2">
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
        <label class="block font-semibold text-sm mb-1">Inventory</label>
        <textarea
          :value="inventory"
          @input="emit('update:inventory', ($event.target as HTMLTextAreaElement).value)"
          rows="5"
          class="w-full border rounded px-3 py-2"
          placeholder="Pack, tinderbox, bedroll, tent, 2d6 slugs, 2 rations, 2 cans of H..."
        />
      </div>
    </div>
  </div>
</template>
