<script setup lang="ts">
import { weapons } from '../../data/weapons'
import type { WeaponSlot } from '../../types'

const props = defineProps<{
  slots: WeaponSlot[]
}>()

const emit = defineEmits<{
  update: [weapons: WeaponSlot[]]
}>()

function addWeapon() {
  emit('update', [...props.slots, { name: '' }])
}

function removeWeapon(index: number) {
  const updated = [...props.slots]
  updated.splice(index, 1)
  emit('update', updated)
}

function setWeapon(index: number, name: string) {
  const updated = [...props.slots]
  updated[index] = { name }
  emit('update', updated)
}

function getWeapon(name: string) {
  return weapons.find((w) => w.name === name)
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Weapons</h2>
    <p class="text-gray-600 mb-6">Select your starting weapons.</p>

    <div class="space-y-3 max-w-xl">
      <div v-for="(slot, idx) in slots" :key="idx" class="p-3 border rounded-lg">
        <div class="flex items-center gap-2">
          <select
            :value="slot.name"
            @change="setWeapon(idx, ($event.target as HTMLSelectElement).value)"
            class="flex-1 border rounded px-2 py-1"
          >
            <option value="">-- Select weapon --</option>
            <option v-for="w in weapons" :key="w.name" :value="w.name">
              {{ w.name }} ({{ w.damageModifier }})
            </option>
          </select>
          <button @click="removeWeapon(idx)" class="text-red-500 text-sm px-2">Remove</button>
        </div>

        <div v-if="slot.name && getWeapon(slot.name)" class="text-xs text-gray-500 mt-2 grid grid-cols-3 gap-2">
          <div><span class="font-semibold">Dmg:</span> {{ getWeapon(slot.name)!.damageModifier }}</div>
          <div><span class="font-semibold">Range:</span> {{ getWeapon(slot.name)!.maxRange }}</div>
          <div><span class="font-semibold">Dodge:</span> {{ getWeapon(slot.name)!.dodgeMod }}</div>
          <div v-if="getWeapon(slot.name)!.notes" class="col-span-3">
            <span class="font-semibold">Notes:</span> {{ getWeapon(slot.name)!.notes }}
          </div>
        </div>
      </div>

      <button
        @click="addWeapon"
        class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-black hover:text-black transition-all"
      >
        + Add Weapon
      </button>
    </div>
  </div>
</template>
