<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { specialtyTables, getTable, lootTables } from '../../data/startingItems'
import type { StartingItem } from '../../types'

const props = defineProps<{
  specialty: string
  items: StartingItem[]
  bonusItem: StartingItem | null
}>()

const emit = defineEmits<{
  update: [items: StartingItem[]]
  'update:bonusItem': [item: StartingItem]
}>()

/**
 * Roll a single bonus item: d6 picks the table (1-6), d6 picks the slot (1-6).
 * Pure (takes an injectable rng for testability). Caller is responsible for
 * gating: only roll when bonusItem is null.
 */
function rollBonusItem(rng: () => number = Math.random): StartingItem {
  const tableId = Math.floor(rng() * 6) + 1
  const slotPos = Math.floor(rng() * 6) + 1
  const table = lootTables.find((t) => t.id === tableId)!
  return {
    name: table.items[slotPos - 1]!,
    tableNumber: tableId,
    tableName: table.name,
    roll: slotPos,
    // slotIndex omitted — not a specialty-table slot
  }
}

onMounted(() => {
  if (props.bonusItem === null) {
    emit('update:bonusItem', rollBonusItem())
  }
})

/**
 * Ordered list of table IDs this specialty rolls on.
 * STITCH=[2,3,3] → 3 independent slots (two of which are both table 3).
 */
const tables = computed(() =>
  specialtyTables[props.specialty.toUpperCase()] ?? [],
)

/** Build an item for the given slot + d6 slot-position (1..6). */
function buildItem(tableSlotIndex: number, slotPos: number): StartingItem {
  const tableId = tables.value[tableSlotIndex]!
  const table = getTable(tableId)
  return {
    name: table.items[slotPos - 1]!,
    tableNumber: tableId,
    tableName: table.name,
    roll: slotPos,
    slotIndex: tableSlotIndex,
  }
}

/** Find the item assigned to a specific table slot (by slotIndex). */
function itemForSlot(tableSlotIndex: number): StartingItem | undefined {
  return props.items.find((it) => it.slotIndex === tableSlotIndex)
}

/** Which roll (1..6) is selected for a given table slot? null if nothing selected yet. */
function selectedRoll(tableSlotIndex: number): number | null {
  return itemForSlot(tableSlotIndex)?.roll ?? null
}

function selectItem(tableSlotIndex: number, slotPos: number): void {
  // Replace-or-insert by slotIndex, preserving other slot selections.
  const without = props.items.filter((it) => it.slotIndex !== tableSlotIndex)
  const next = [...without, buildItem(tableSlotIndex, slotPos)]
  // Emit in table-slot order so downstream display is stable
  next.sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
  emit('update', next)
}

function rollAll(): void {
  const results: StartingItem[] = tables.value.map((_, i) => {
    const roll = Math.floor(Math.random() * 6) + 1
    return buildItem(i, roll)
  })
  emit('update', results)
}

const allSelected = computed(() =>
  tables.value.length > 0 && tables.value.every((_, i) => itemForSlot(i) !== undefined),
)
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-2">Starting Items</h2>
    <p class="text-gray-600 mb-4">
      Pick one item from each of your specialty's loot tables, or roll a d6 to decide for each.
    </p>

    <!-- Bonus item — randomly rolled, no override -->
    <div
      v-if="bonusItem"
      class="mb-6 max-w-2xl border-2 border-amber-500 bg-amber-50 rounded-lg overflow-hidden"
    >
      <div class="bg-amber-500 text-white px-3 py-2 flex items-center justify-between">
        <div class="font-bold text-sm flex items-center gap-2">
          <span aria-hidden="true">🎁</span>
          <span>Bonus Item</span>
          <span class="opacity-80 font-normal">— {{ bonusItem.tableName }} (Table {{ bonusItem.tableNumber }})</span>
        </div>
        <div class="text-xs opacity-80">d6 = {{ bonusItem.roll }}</div>
      </div>
      <div class="px-3 py-2 text-sm">{{ bonusItem.name }}</div>
    </div>

    <!-- Roll All button -->
    <div class="mb-6">
      <button
        type="button"
        @click="rollAll"
        class="px-5 py-2 bg-black text-white rounded hover:bg-gray-800 inline-flex items-center gap-2"
      >
        <span>🎲</span>
        <span>{{ items.length > 0 ? 'Re-Roll All' : 'Roll All' }}</span>
      </button>
      <span v-if="!allSelected" class="ml-3 text-sm text-gray-500">
        or click an item in each table to pick manually
      </span>
      <span v-else class="ml-3 text-sm text-emerald-600 font-medium">
        ✓ All tables resolved
      </span>
    </div>

    <!-- Per-table cards -->
    <div class="space-y-4 max-w-2xl">
      <div
        v-for="(tableId, tableSlotIdx) in tables"
        :key="`${tableId}-${tableSlotIdx}`"
        class="border border-gray-300 rounded-lg overflow-hidden"
      >
        <!-- Table header -->
        <div class="bg-black text-white px-3 py-2 flex items-center justify-between">
          <div class="font-bold text-sm">
            {{ getTable(tableId).name }}
            <span class="opacity-70 font-normal">— Table {{ tableId }}</span>
          </div>
          <div v-if="selectedRoll(tableSlotIdx) !== null" class="text-xs opacity-80">
            d6 = {{ selectedRoll(tableSlotIdx) }}
          </div>
        </div>

        <!-- Items grid -->
        <div class="divide-y divide-gray-200">
          <button
            v-for="(itemName, idx) in getTable(tableId).items"
            :key="idx"
            type="button"
            @click="selectItem(tableSlotIdx, idx + 1)"
            :aria-pressed="selectedRoll(tableSlotIdx) === idx + 1"
            class="w-full px-3 py-2 text-left flex items-center gap-3 text-sm transition-colors"
            :class="
              selectedRoll(tableSlotIdx) === idx + 1
                ? 'bg-emerald-50 hover:bg-emerald-100'
                : 'bg-white hover:bg-gray-50'
            "
          >
            <span
              class="shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              :class="
                selectedRoll(tableSlotIdx) === idx + 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
              "
            >
              {{ idx + 1 }}
            </span>
            <span
              class="flex-1"
              :class="
                selectedRoll(tableSlotIdx) === idx + 1
                  ? 'font-medium text-emerald-900'
                  : 'text-gray-700'
              "
            >
              {{ itemName }}
            </span>
            <span
              v-if="selectedRoll(tableSlotIdx) === idx + 1"
              class="shrink-0 text-emerald-600 text-sm"
              aria-label="Selected"
            >
              ✓
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
