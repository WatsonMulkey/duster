<script setup lang="ts">
import type { Gift, Skill, EnergyGroup, StartingTalentTier, TalentSlot, WeaponSlot, StartingItem, Hand } from '../types'
import { talents } from '../data/talents'

const props = defineProps<{
  name: string
  specialty: string | null
  gift: Gift | null
  level: number
  xpSpent: number
  xpTotal: number
  hp: number
  hand: Hand
  statBoost: EnergyGroup | null
  keenSkill: Skill | null
  startingTalent: string | null
  startingTalentTier: StartingTalentTier
  talentSlots: (TalentSlot | null)[]
  weaponSlots: WeaponSlot[]
  startingItems: StartingItem[]
  bonusItem: StartingItem | null
  inventory: string
  energyModifiers: Record<EnergyGroup, number>
}>()

const bodyLocations = ['L LEG', 'R LEG', 'TORSO', 'R ARM', 'L ARM', 'HEAD']
const bodyColumns = ['A', 'S', 'I', 'B']
const energyGroups: { name: EnergyGroup; skills: Skill[] }[] = [
  { name: 'Mental', skills: ['Focus', 'Memory', 'Tech'] },
  { name: 'Physical', skills: ['Force', 'Reflex', 'Coordination'] },
  { name: 'Emotional', skills: ['Persuasion', 'Deception', 'Intuition'] },
]

function getTalent(name: string) {
  return talents.find((t) => t.name === name)
}

function getTalentTierText(name: string, tier: string): string {
  const t = getTalent(name)
  if (!t) return ''
  return t[tier.toLowerCase() as 'novice' | 'skilled' | 'expert' | 'master'] || ''
}

const allTalentRows = [
  props.startingTalent
    ? { name: props.startingTalent, tier: props.startingTalentTier }
    : null,
  ...props.talentSlots,
]
</script>

<template>
  <div class="character-sheet bg-white text-black w-[8.5in] min-h-[11in] p-[0.4in] font-['Arial',sans-serif] text-[9pt] leading-tight">
    <!-- HEADER -->
    <div class="flex items-start gap-4 mb-3">
      <!-- Logo -->
      <img src="/duster-logo.png" alt="DUSTER" class="h-10 shrink-0" />

      <div class="flex-1 grid grid-cols-[1fr_auto] gap-x-4 items-start">
        <div>
          <div class="border-b border-black pb-0.5 mb-1">
            <span class="text-[7pt] text-gray-600 block">NAME</span>
            <span class="font-bold text-base">{{ name || '\u00A0' }}</span>
          </div>
          <div class="border-b border-black pb-0.5">
            <span class="text-[7pt] text-gray-600 block">SPECIALTY</span>
            <span class="font-bold text-base">{{ specialty || '\u00A0' }}</span>
          </div>
        </div>

        <div class="text-right">
          <div class="flex items-center gap-3 justify-end">
            <div class="text-center">
              <div class="bg-black text-white text-[7pt] px-2 py-0.5 font-bold">XP</div>
              <div class="border border-black px-2 py-0.5 text-xs">{{ xpSpent }}/{{ xpTotal }}</div>
            </div>
            <div class="text-center">
              <div class="bg-black text-white text-[7pt] px-2 py-0.5 font-bold">LVL</div>
              <div class="border border-black px-3 py-0.5 text-lg font-bold">{{ level }}</div>
            </div>
          </div>
          <div class="mt-1">
            <span class="text-[7pt] text-gray-600">GIFT</span>
            <span class="ml-1 text-xs">{{ gift?.name || '\u00A0' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS ROW + BODY GRID -->
    <div class="flex gap-4 mb-6">
      <!-- Left: Stats -->
      <div class="flex-1 space-y-2">
        <!-- HP / Stress -->
        <div class="flex items-end gap-4">
          <div class="flex items-end gap-2">
            <span class="font-bold text-sm pb-1">HP</span>
            <div class="flex flex-col items-center">
              <span class="text-[7pt] text-gray-600 leading-none">Now</span>
              <span class="border border-black px-2 py-0.5 text-xs font-semibold min-w-[1.75rem] text-center">{{ hp }}</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-[7pt] text-gray-600 leading-none">Total</span>
              <span class="border border-black px-2 py-0.5 text-xs font-semibold min-w-[1.75rem] text-center">{{ hp }}</span>
            </div>
          </div>
          <div class="flex items-end gap-1">
            <span class="font-bold text-sm pb-1">STRESS</span>
            <span v-for="i in 4" :key="i" class="w-4 h-4 border border-black inline-block mb-0.5"></span>
          </div>
        </div>

        <!-- Luck / Ghost Hand -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1">
            <span class="font-bold text-sm">LUCK</span>
            <span class="border border-black w-8 h-6 inline-flex items-center justify-center text-sm font-bold">4</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-bold text-sm">GHOST HAND</span>
            <span class="border border-black w-8 h-6 inline-flex items-center justify-center text-sm font-bold">4</span>
          </div>
        </div>

        <!-- Hand / Resource -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1">
            <span class="font-bold text-sm">HAND</span>
            <span class="border border-black w-8 h-6 inline-flex items-center justify-center text-xs font-bold">
              {{ hand === 'Right' ? 'R' : hand === 'Left' ? 'L' : 'B' }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-bold text-sm">RESOURCE</span>
            <span class="border border-black w-8 h-6 inline-block"></span>
          </div>
        </div>
      </div>

      <!-- Right: Body Grid -->
      <div class="shrink-0 self-start">
        <div class="font-bold text-xs mb-1 text-center">BODY</div>
        <table class="border-collapse text-[8pt]">
          <thead>
            <tr>
              <th class="px-1"></th>
              <th v-for="col in bodyColumns" :key="col" class="px-2 font-bold text-center">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loc in bodyLocations" :key="loc">
              <td class="pr-2 font-semibold text-right text-[7pt]">{{ loc }}</td>
              <td v-for="col in bodyColumns" :key="col" class="border border-black w-6 h-4"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ENERGY / SKILLS + INVENTORY / WEAPONS -->
    <div class="flex gap-4 mb-3">
      <!-- Left: Energy groups -->
      <div class="flex-1 min-w-0 space-y-3">
        <div v-for="group in energyGroups" :key="group.name">
          <div class="flex items-center gap-2 mb-1">
            <span class="border border-black w-6 h-5 inline-flex items-center justify-center text-[8pt] font-bold">
              {{ energyModifiers[group.name] > 0 ? '+' + energyModifiers[group.name] : '' }}
            </span>
            <span class="font-bold text-sm uppercase">{{ group.name }}</span>
          </div>
          <div class="ml-8 space-y-0.5">
            <div v-for="skill in group.skills" :key="skill" class="flex items-center gap-1 text-[8pt]">
              <span class="uppercase w-24">{{ skill }}</span>
              <span class="w-3 h-3 border border-black inline-flex items-center justify-center text-[7pt]">
                {{ keenSkill === skill ? '\u2714' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Inventory + Weapons -->
      <div class="flex-1 min-w-0 space-y-3">
        <!-- Inventory -->
        <div>
          <div class="bg-black text-white font-bold text-sm px-2 py-1 mb-1">INVENTORY</div>
          <div class="border border-black p-2 min-h-[80px] text-[8pt] whitespace-pre-wrap break-all overflow-hidden">{{ inventory || '\u00A0' }}</div>
        </div>

        <!-- Starting Items -->
        <div>
          <div class="bg-black text-white font-bold text-sm px-2 py-1 mb-1">STARTING ITEMS</div>
          <ul class="text-[8pt] space-y-0.5 pl-1 overflow-hidden">
            <li v-for="(item, idx) in startingItems" :key="idx" class="py-0.5 break-words">
              {{ item.name }}
            </li>
            <li v-if="bonusItem" class="py-0.5 break-words">
              {{ bonusItem.name }} <span class="text-amber-700">(bonus)</span>
            </li>
            <li v-if="startingItems.length === 0 && !bonusItem" class="py-0.5 text-gray-400">None</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- TALENTS -->
    <div>
      <div class="bg-black text-white font-bold text-sm px-2 py-1 mb-1 text-center">TALENTS</div>
      <table class="w-full text-[8pt] border-collapse">
        <thead>
          <tr>
            <th class="text-left pb-1 w-1/4">NAME/NOVICE</th>
            <th class="text-left pb-1 w-1/4">SKILLED</th>
            <th class="text-left pb-1 w-1/4">EXPERT</th>
            <th class="text-left pb-1 w-1/4">MASTER</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in allTalentRows" :key="idx" class="border-t border-gray-300">
            <template v-if="row">
              <td class="py-1 pr-2 align-top">
                <div class="font-bold">{{ row.name }}</div>
                <div class="text-[7pt]">{{ getTalentTierText(row.name, 'novice') }}</div>
              </td>
              <td class="py-1 pr-2 align-top text-[7pt]">
                {{ ['Skilled','Expert','Master'].includes(row.tier) ? getTalentTierText(row.name, 'skilled') : '' }}
              </td>
              <td class="py-1 pr-2 align-top text-[7pt]">
                {{ ['Expert','Master'].includes(row.tier) ? getTalentTierText(row.name, 'expert') : '' }}
              </td>
              <td class="py-1 align-top text-[7pt]">
                {{ row.tier === 'Master' ? getTalentTierText(row.name, 'master') : '' }}
              </td>
            </template>
            <template v-else>
              <td class="py-1">&nbsp;</td>
              <td></td><td></td><td></td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
