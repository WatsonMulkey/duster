<script setup lang="ts">
import { computed } from 'vue'
import { talents } from '../../data/talents'
import type { Talent, TalentSlot, MasteryTier } from '../../types'

const XP_COST: Record<MasteryTier, number> = {
  Novice: 2,
  Skilled: 3,
  Expert: 4,
  Master: 6,
}

const props = defineProps<{
  slots: (TalentSlot | null)[]
  startingTalent: string | null
  xpRemaining: number
  xpTotal: number
  level: number
}>()

const emit = defineEmits<{
  update: [index: number, slot: TalentSlot | null]
  'update:level': [level: number]
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

function hasPrerequisite(t: Talent): boolean {
  return !!t.prerequisite && t.prerequisite !== 'None.'
}

/** Can the player afford to set slot[slotIndex] to the given tier? */
function canAffordTier(slotIndex: number, tier: MasteryTier): boolean {
  const slot = props.slots[slotIndex]
  const currentCost = slot ? XP_COST[slot.tier] : 0
  const newCost = XP_COST[tier]
  return (props.xpRemaining + currentCost - newCost) >= 0
}

/** Can this empty slot afford at least a Novice talent? */
function canAffordNewTalent(slotIndex: number): boolean {
  const slot = props.slots[slotIndex]
  if (slot) return true // already has a talent, dropdown stays enabled
  return props.xpRemaining >= XP_COST.Novice
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
  if (slot && canAffordTier(index, tier)) {
    emit('update', index, { name: slot.name, tier })
  }
}

function talentLabel(t: Talent): string {
  if (hasPrerequisite(t)) {
    return `\u{1F512} ${t.name} (Req: ${t.prerequisite})`
  }
  return t.name
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Choose Additional Talents</h2>
    <p class="text-gray-600 mb-4">Select up to 3 additional talents and set their mastery tier.</p>

    <div class="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg max-w-xl">
      <div class="flex items-center gap-2">
        <label class="font-semibold text-sm">Level</label>
        <select
          :value="level"
          @change="emit('update:level', Number(($event.target as HTMLSelectElement).value))"
          class="border rounded px-2 py-1 w-16 text-center"
        >
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="text-sm text-gray-600">
        XP: <strong>{{ xpTotal - xpRemaining }}</strong> / {{ xpTotal }} spent
        <span v-if="xpRemaining > 0" class="ml-1 text-green-600">({{ xpRemaining }} left)</span>
      </div>
    </div>

    <div class="space-y-4 max-w-xl">
      <div v-for="(slot, idx) in slots" :key="idx" class="p-4 border rounded-lg">
        <div class="flex items-center gap-3 mb-2">
          <span class="font-semibold text-sm text-gray-500 shrink-0">Skill {{ idx + 2 }}</span>
          <select
            :value="slot?.name ?? ''"
            @change="setTalent(idx, ($event.target as HTMLSelectElement).value)"
            :disabled="!canAffordNewTalent(idx)"
            class="flex-1 min-w-0 border rounded px-2 py-1"
            :class="!canAffordNewTalent(idx) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''"
          >
            <option value="">{{ canAffordNewTalent(idx) ? '-- None --' : '-- Not enough XP --' }}</option>
            <option v-if="slot" :value="slot.name">{{ slot.name }}</option>
            <option v-for="t in availableTalents" :key="t.name" :value="t.name">
              {{ talentLabel(t) }}
            </option>
          </select>
        </div>

        <div v-if="slot" class="flex gap-2 mt-2 flex-wrap">
          <button
            v-for="tier in tiers"
            :key="tier"
            @click="setTier(idx, tier)"
            :disabled="!canAffordTier(idx, tier)"
            class="px-3 py-1 text-xs border rounded transition-all"
            :class="[
              slot.tier === tier
                ? 'bg-black text-white border-black'
                : canAffordTier(idx, tier)
                  ? 'border-gray-300 hover:border-black'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50',
            ]"
          >
            {{ tier }} <span class="opacity-60">({{ XP_COST[tier] }})</span>
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
