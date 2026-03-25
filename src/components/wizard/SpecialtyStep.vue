<script setup lang="ts">
import { specialties } from '../../data/specialties'
import type { Specialty } from '../../types'

const props = defineProps<{
  selected: string | null
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

function selectSpecialty(name: string) {
  emit('select', name)
}

function getSpecialty(name: string): Specialty | undefined {
  return specialties.find((s) => s.name === name)
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Choose Your Specialty</h2>
    <p class="text-gray-600 mb-6">Your specialty defines your character's background and abilities.</p>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <button
        v-for="spec in specialties"
        :key="spec.name"
        @click="selectSpecialty(spec.name)"
        class="p-4 border-2 rounded-lg text-left transition-all hover:border-black"
        :class="selected === spec.name ? 'border-black bg-black text-white' : 'border-gray-300'"
      >
        <div class="font-bold text-sm tracking-wider">{{ spec.name }}</div>
        <div class="text-xs mt-1 opacity-75">{{ spec.statBoost }} boost</div>
      </button>
    </div>

    <div v-if="selected && getSpecialty(selected)" class="mt-6 p-4 bg-gray-50 rounded-lg border">
      <h3 class="font-bold">{{ selected }}</h3>
      <div class="text-sm mt-2 space-y-1">
        <p><span class="font-semibold">Stat Boost:</span> {{ getSpecialty(selected)!.statBoost }}</p>
        <p><span class="font-semibold">Starting Talent:</span> {{ getSpecialty(selected)!.talent }}</p>
        <p><span class="font-semibold">Keen Skill Options:</span> {{ getSpecialty(selected)!.keenSkillOptions.join(', ') }}</p>
      </div>
    </div>
  </div>
</template>
