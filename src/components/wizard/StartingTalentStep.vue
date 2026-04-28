<script setup lang="ts">
import { talents } from '../../data/talents'
import type { Talent } from '../../types'

const props = defineProps<{
  options: string[]
  selected: string | null
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

function getTalent(name: string): Talent | undefined {
  return talents.find((t) => t.name === name)
}

const hasChoice = props.options.length > 1
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">
      {{ hasChoice ? 'Choose Your Starting Talent' : 'Your Starting Talent' }}
    </h2>
    <p class="text-gray-600 mb-6">This talent begins at Skilled tier.</p>

    <div class="flex flex-col gap-3 max-w-lg">
      <button
        v-for="name in options"
        :key="name"
        @click="emit('select', name)"
        :disabled="!hasChoice"
        class="p-4 border-2 rounded-lg text-left transition-all"
        :class="[
          selected === name ? 'border-black bg-black text-white' : 'border-gray-300',
          hasChoice ? 'hover:border-black cursor-pointer' : 'cursor-default'
        ]"
      >
        <div class="font-bold">{{ name }}</div>
        <div class="text-sm mt-1 opacity-85" v-if="getTalent(name)">
          {{ getTalent(name)!.skilled }}
        </div>
      </button>
    </div>

    <p v-if="options.length === 0" class="text-gray-400 italic">Select a specialty first.</p>
  </div>
</template>
