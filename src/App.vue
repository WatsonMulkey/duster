<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCharacter } from './composables/useCharacter'
import SpecialtyStep from './components/wizard/SpecialtyStep.vue'
import KeenSkillStep from './components/wizard/KeenSkillStep.vue'
import GiftStep from './components/wizard/GiftStep.vue'
import StartingTalentStep from './components/wizard/StartingTalentStep.vue'
import TalentsStep from './components/wizard/TalentsStep.vue'
import StartingItemsStep from './components/wizard/StartingItemsStep.vue'
import InventoryStep from './components/wizard/InventoryStep.vue'
import CharacterSheet from './components/CharacterSheet.vue'
import Toast from './components/Toast.vue'
import { useExportPdf } from './composables/useExportPdf'
import { toasts } from './composables/useToast'
import { specialtyTables } from './data/startingItems'
import type { Skill, Hand, TalentSlot, StartingItem, StartingTalentTier } from './types'

// Password gate for preview deployments (client-side only, not real security)
const previewPassword = 'dusty2026'
const authenticated = ref(false)
const passwordInput = ref('')
const passwordError = ref(false)

function checkPassword() {
  if (passwordInput.value === previewPassword) {
    authenticated.value = true
    passwordError.value = false
  } else {
    passwordError.value = true
  }
}

const {
  state,
  statBoost,
  keenSkillOptions,
  giftOptions,
  selectedGift,
  startingTalentOptions,
  energyModifiers,
  xpTotal,
  xpSpent,
  xpRemaining,
  hp,
  setSpecialty,
  reset,
} = useCharacter()

const currentStep = ref(0)
const showSheet = ref(false)

const steps = [
  'Specialty',
  'Keen Skill',
  'Gift',
  'Starting Talent',
  'Talents',
  'Starting Inventory',
  'Details',
]

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return state.specialty !== null
    case 1: return state.keenSkill !== null
    case 2: return true
    case 3: return state.startingTalent !== null
    case 4: return true
    case 5: {
      const expected = state.specialty ? (specialtyTables[state.specialty.toUpperCase()]?.length ?? 0) : 0
      return expected > 0 && state.startingItems.length === expected
    }
    case 6: return state.name.trim() !== ''
    default: return false
  }
})

// Auto-select when only one option
watch(() => giftOptions.value, (opts) => {
  if (opts.length === 1) state.selectedGiftIndex = 0
}, { immediate: true })

watch(() => startingTalentOptions.value, (opts) => {
  if (opts.length === 1) state.startingTalent = opts[0]
}, { immediate: true })

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    showSheet.value = true
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function printSheet() {
  window.print()
}

const { exporting, handleExport } = useExportPdf()
function exportFillablePdf() {
  void handleExport(state)
}

function startOver() {
  reset()
  currentStep.value = 0
  showSheet.value = false
  // Clear any lingering toasts (e.g. an export error toast from before reset)
  toasts.value = []
}

function updateTalent(index: number, slot: TalentSlot | null) {
  state.talents[index] = slot
}

function updateStartingItems(items: StartingItem[]) {
  state.startingItems = items
}
</script>

<template>
  <!-- Password gate for preview -->
  <div v-if="!authenticated" class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold tracking-wider mb-1" style="font-family: Georgia, serif;">DUSTER</h1>
      <p class="text-sm text-gray-500 mb-6">Character Creator Preview</p>
      <form @submit.prevent="checkPassword" class="flex flex-col items-center gap-3" autocomplete="off">
        <input
          v-model="passwordInput"
          type="password"
          name="duster-access-code"
          placeholder="Enter access code"
          autocomplete="one-time-code"
          data-lpignore="true"
          data-form-type="other"
          spellcheck="false"
          class="border border-gray-300 rounded px-4 py-2 text-center w-56 focus:outline-none focus:border-black"
          :class="{ 'border-red-400': passwordError }"
        />
        <button type="submit" class="px-6 py-2 bg-black text-white rounded hover:bg-gray-800">
          Enter
        </button>
        <p v-if="passwordError" class="text-red-500 text-sm">Invalid code</p>
      </form>
    </div>
  </div>

  <!-- Character Sheet (print target) -->
  <div v-else-if="showSheet" class="min-h-screen bg-gray-100">
    <div class="max-w-4xl mx-auto py-4 px-4 print:hidden">
      <div class="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h1 class="text-xl font-bold">Character Sheet Preview</h1>
        <div class="flex gap-2 flex-wrap">
          <button @click="startOver" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Start Over
          </button>
          <button @click="printSheet" class="px-4 py-2 border border-gray-400 rounded hover:bg-gray-50">
            Print Sheet
          </button>
          <button
            @click="exportFillablePdf"
            :disabled="exporting"
            aria-label="Export character sheet as fillable PDF"
            class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ exporting ? 'Generating…' : 'Export Fillable PDF' }}
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-500 text-right">
        ℹ️ Open the fillable PDF in Adobe Reader for best results.
      </p>
    </div>

    <div class="flex justify-center">
      <CharacterSheet
        :name="state.name"
        :specialty="state.specialty"
        :gift="selectedGift"
        :level="state.level"
        :xp-spent="xpSpent"
        :xp-total="xpTotal"
        :hp="hp"
        :hand="state.hand"
        :stat-boost="statBoost"
        :keen-skill="state.keenSkill"
        :starting-talent="state.startingTalent"
        :starting-talent-tier="state.startingTalentTier"
        :talent-slots="state.talents"
        :weapon-slots="state.weapons"
        :starting-items="state.startingItems"
        :bonus-item="state.bonusItem"
        :inventory="state.inventory"
        :energy-modifiers="energyModifiers"
      />
    </div>
  </div>

  <!-- Wizard -->
  <div v-else class="min-h-screen bg-white">
    <header class="border-b border-gray-200 px-6 py-4">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <img src="/duster-logo.png" alt="DUSTER" class="h-8" />
        <span class="text-sm text-gray-500">Character Creator</span>
      </div>
    </header>

    <!-- Step indicator -->
    <div class="border-b border-gray-100 px-6 py-3">
      <div class="max-w-3xl mx-auto flex gap-1">
        <div
          v-for="(step, idx) in steps"
          :key="idx"
          class="flex-1 text-center text-xs py-1 rounded transition-all"
          :class="[
            idx === currentStep ? 'bg-black text-white font-bold' : '',
            idx < currentStep ? 'bg-gray-200 text-gray-600' : 'text-gray-400',
          ]"
        >
          {{ step }}
        </div>
      </div>
    </div>

    <main class="max-w-3xl mx-auto px-6 py-8">
      <SpecialtyStep
        v-if="currentStep === 0"
        :selected="state.specialty"
        @select="setSpecialty"
      />
      <KeenSkillStep
        v-if="currentStep === 1"
        :options="keenSkillOptions"
        :selected="state.keenSkill"
        @select="(s: Skill) => state.keenSkill = s"
      />
      <GiftStep
        v-if="currentStep === 2"
        :options="giftOptions"
        :selected-index="state.selectedGiftIndex"
        @select="(idx: number) => state.selectedGiftIndex = idx as 0 | 1"
      />
      <StartingTalentStep
        v-if="currentStep === 3"
        :options="startingTalentOptions"
        :selected="state.startingTalent"
        @select="(name: string) => state.startingTalent = name"
      />
      <TalentsStep
        v-if="currentStep === 4"
        :slots="state.talents"
        :starting-talent="state.startingTalent"
        :starting-talent-tier="state.startingTalentTier"
        :xp-remaining="xpRemaining"
        :xp-total="xpTotal"
        :level="state.level"
        @update="updateTalent"
        @update:level="(l: number) => state.level = l"
        @update:starting-talent-tier="(t: StartingTalentTier) => state.startingTalentTier = t"
      />
      <StartingItemsStep
        v-if="currentStep === 5"
        :specialty="state.specialty!"
        :items="state.startingItems"
        :bonus-item="state.bonusItem"
        @update="updateStartingItems"
        @update:bonus-item="(b: StartingItem) => state.bonusItem = b"
      />
      <InventoryStep
        v-if="currentStep === 6"
        :name="state.name"
        :inventory="state.inventory"
        :hand="state.hand"
        @update:name="(v: string) => state.name = v"
        @update:inventory="(v: string) => state.inventory = v"
        @update:hand="(h: Hand) => state.hand = h"
      />
    </main>

    <footer class="border-t border-gray-200 px-6 py-4">
      <div class="max-w-3xl mx-auto flex justify-between">
        <button
          @click="prevStep"
          :disabled="currentStep === 0"
          class="px-6 py-2 border border-gray-300 rounded disabled:opacity-30 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          @click="nextStep"
          :disabled="!canProceed"
          class="px-6 py-2 bg-black text-white rounded disabled:opacity-30 hover:bg-gray-800"
        >
          {{ currentStep === steps.length - 1 ? 'Generate Sheet' : 'Next' }}
        </button>
      </div>
    </footer>
  </div>
  <Toast />
</template>
