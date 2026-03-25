<script setup lang="ts">
import type { Gift } from '../../types'

const props = defineProps<{
  options: (Gift | null)[]
  selectedIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const hasChoice = props.options.length > 1
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">
      {{ hasChoice ? 'Choose Your Gift' : 'Your Gift' }}
    </h2>
    <p class="text-gray-600 mb-6">
      {{ hasChoice ? 'Pick one of two unique abilities for your specialty.' : 'Your specialty grants you this unique ability.' }}
    </p>

    <div class="flex flex-col gap-3 max-w-lg">
      <button
        v-for="(gift, idx) in options"
        :key="idx"
        @click="emit('select', idx)"
        :disabled="!hasChoice"
        class="p-4 border-2 rounded-lg text-left transition-all"
        :class="[
          selectedIndex === idx ? 'border-black bg-black text-white' : 'border-gray-300',
          hasChoice ? 'hover:border-black cursor-pointer' : 'cursor-default'
        ]"
      >
        <div class="font-bold" v-if="gift">{{ gift.name }}</div>
        <div class="text-sm mt-1 opacity-85" v-if="gift">{{ gift.description }}</div>
      </button>
    </div>

    <p v-if="options.length === 0" class="text-gray-400 italic">Select a specialty first.</p>
  </div>
</template>
