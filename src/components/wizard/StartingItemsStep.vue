<script setup lang="ts">
import { specialtyTables, getTable } from '../../data/startingItems'
import type { StartingItem } from '../../types'

const props = defineProps<{
  specialty: string
  items: StartingItem[]
}>()

const emit = defineEmits<{
  update: [items: StartingItem[]]
}>()

const tables = specialtyTables[props.specialty.toUpperCase()] ?? []

function rollAll() {
  const results: StartingItem[] = tables.map((tableId) => {
    const table = getTable(tableId)
    const roll = Math.floor(Math.random() * 6) + 1
    return {
      name: table.items[roll - 1],
      tableNumber: tableId,
      tableName: table.name,
      roll,
    }
  })
  emit('update', results)
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Starting Items</h2>
    <p class="text-gray-600 mb-6">
      Roll d6 on each assigned loot table to determine your starting gear.
    </p>

    <!-- Table assignments -->
    <div class="mb-4 text-sm text-gray-500">
      <span class="font-semibold text-gray-700">Your tables:</span>
      {{ tables.map((id) => getTable(id).name + ' (#' + id + ')').join(', ') }}
    </div>

    <!-- Roll button -->
    <div class="mb-6">
      <button
        @click="rollAll"
        class="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        {{ items.length > 0 ? 'Re-Roll' : 'Roll for Starting Items' }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="items.length > 0" class="space-y-2 max-w-xl">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="flex items-start gap-3 p-3 border rounded-lg"
      >
        <div class="shrink-0 w-6 h-6 bg-black text-white rounded flex items-center justify-center text-xs font-bold">
          {{ item.roll }}
        </div>
        <div>
          <div class="font-medium">{{ item.name }}</div>
          <div class="text-xs text-gray-500">{{ item.tableName }} (Table {{ item.tableNumber }})</div>
        </div>
      </div>
    </div>
  </div>
</template>
