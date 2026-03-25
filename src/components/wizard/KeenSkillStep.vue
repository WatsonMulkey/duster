<script setup lang="ts">
import type { Skill } from '../../types'

const props = defineProps<{
  options: Skill[]
  selected: Skill | null
}>()

const emit = defineEmits<{
  select: [skill: Skill]
}>()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Choose Your Keen Skill</h2>
    <p class="text-gray-600 mb-6">Being Keen in a skill means you have an advantage when using it.</p>

    <div class="flex flex-col gap-3 max-w-md">
      <button
        v-for="skill in options"
        :key="skill"
        @click="emit('select', skill)"
        class="p-4 border-2 rounded-lg text-left transition-all hover:border-black"
        :class="selected === skill ? 'border-black bg-black text-white' : 'border-gray-300'"
      >
        <div class="font-bold">{{ skill }}</div>
      </button>
    </div>

    <p v-if="options.length === 0" class="text-gray-400 italic">Select a specialty first.</p>
  </div>
</template>
