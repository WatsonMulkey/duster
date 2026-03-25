<script setup lang="ts">
import { computed } from 'vue'
import { talents } from '../../data/talents'
import type { Talent, TalentSlot, MasteryTier } from '../../types'

const props = defineProps<{
  slots: (TalentSlot | null)[]
  startingTalent: string | null
  xpRemaining: number
}>()

const emit = defineEmits<{
  update: [index: number, slot: TalentSlot | null]
}>()

const tiers: MasteryTier[] = ['Novice', 'Skilled', 'Expert', 'Master']

const availableTalents = computed(() => {
  const used = new Set<string>()
  if (props.startingTalent) used.add(props.startingTalent)
  for (const slot of props.slots) {
    if (slot) used.add(slot.name)
  }
  return talents.filter((t) => !used.has(t.name))
})

function getTalent(name: string): Talent | undefined {
  return talents.find((t) => t.name === name)
}

function setTalent(index: number, name: string) {
  if (name === '') {
    emit('update', index, null)
  } else {
    emit('update', index, { name, tier: 'Novice' })
  }
}

function setTier(index: number, tier: MasteryTier) {
  const slot = props.slots[index]
  if (slot) {
    emit('update', index, { name: slot.name, tier })
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Choose Additional Talents</h2>
    <p class="text-gray-600 mb-1">Select up to 3 additional talents and set their mastery tier.</p>
    <p class="text-sm mb-6" :class="xpRemaining < 0 ? 'text-red-600 font-bold' : 'text-gray-500'">
      XP Remaining: {{ xpRemaining }} / {{ xpRemaining + slots.reduce((sum, s) => sum + (s ? ({'Novice':2,'Skilled':3,'Expert':4,'Master':6}[s.tier]) : 0), 0) }}
    </p>

    <div class="space-y-4 max-w-xl">
      <div v-for="(slot, idx) in slots" :key="idx" class="p-4 border rounded-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="font-semibold text-sm text-gray-500">Skill {{ idx + 2 }}</span>
          <select
            :value="slot?.name ?? ''"
            @change="setTalent(idx, ($event.target as HTMLSelectElement).value)"
            class="flex-1 border rounded px-2 py-1"
          >
            <option value="">-- None --</option>
            <option v-if="slot" :value="slot.name">{{ slot.name }}</option>
            <option v-for="t in availableTalents" :key="t.name" :value="t.name">
              {{ t.name }}
            </option>
          </select>
        </div>

        <div v-if="slot" class="flex gap-2 mt-2">
          <button
            v-for="tier in tiers"
            :key="tier"
            @click="setTier(idx, tier)"
            class="px-3 py-1 text-xs border rounded transition-all"
            :class="slot.tier === tier ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'"
          >
            {{ tier }}
          </button>
        </div>

        <div v-if="slot && getTalent(slot.name)" class="text-xs text-gray-500 mt-2">
          <strong>{{ slot.tier }}:</strong>
          {{ getTalent(slot.name)![slot.tier.toLowerCase() as 'novice' | 'skilled' | 'expert' | 'master'] }}
        </div>

        <div v-if="slot && getTalent(slot.name)?.prerequisite && getTalent(slot.name)!.prerequisite !== 'None.'" class="text-xs text-amber-600 mt-1">
          Prerequisite: {{ getTalent(slot.name)!.prerequisite }}
        </div>
      </div>
    </div>
  </div>
</template>
