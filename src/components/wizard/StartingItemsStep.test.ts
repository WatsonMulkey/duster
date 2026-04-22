import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StartingItemsStep from './StartingItemsStep.vue'
import type { StartingItem } from '../../types'

describe('StartingItemsStep', () => {
  it('renders one card per assigned table (STITCH = 3 slots)', () => {
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'STITCH', items: [] },
    })
    // STITCH rolls on tables [2, 3, 3] → 3 cards with 6 items each
    const itemButtons = wrapper.findAll('button[aria-pressed]')
    expect(itemButtons).toHaveLength(18)
  })

  it('renders the same table slot twice for specialties with repeats', () => {
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'RAMBLER', items: [] }, // [3, 3, 4] = two Consumables + one Heavy Melee
    })
    const text = wrapper.text()
    // "Consumables" should appear twice, "Heavy Melee" once
    expect((text.match(/Consumables/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(text).toContain('Heavy Melee')
  })

  it('clicking an item emits an update with slotIndex = table position', async () => {
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'STITCH', items: [] },
    })
    const itemButtons = wrapper.findAll('button[aria-pressed]')
    // Click first item in first table (slot 0, roll 1)
    await itemButtons[0]!.trigger('click')
    const emits = wrapper.emitted('update')!
    expect(emits).toHaveLength(1)
    const payload = emits[0]![0] as StartingItem[]
    expect(payload).toHaveLength(1)
    expect(payload[0]).toMatchObject({ slotIndex: 0, roll: 1 })
  })

  it('selecting slots out of order preserves earlier selections (bug-regression)', async () => {
    // Initial: user has clicked slot 2 previously
    const initialItem: StartingItem = {
      name: '2 cans of clean H',
      tableNumber: 3,
      tableName: 'Consumables',
      roll: 1,
      slotIndex: 2,
    }
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'STITCH', items: [initialItem] },
    })
    // Now click item 4 in first table (slot 0, roll 4)
    const itemButtons = wrapper.findAll('button[aria-pressed]')
    await itemButtons[3]!.trigger('click')
    const payload = wrapper.emitted('update')![0]![0] as StartingItem[]
    // Both slot 0 and slot 2 should be in the payload, ordered by slotIndex
    expect(payload).toHaveLength(2)
    expect(payload[0]!.slotIndex).toBe(0)
    expect(payload[0]!.roll).toBe(4)
    expect(payload[1]!.slotIndex).toBe(2)
    expect(payload[1]!.roll).toBe(1)
  })

  it('clicking the same slot twice replaces (not duplicates) the prior selection', async () => {
    const wrapper = mount(StartingItemsStep, {
      props: {
        specialty: 'STITCH',
        items: [
          {
            name: '10 scrap metal',
            tableNumber: 2,
            tableName: 'Supplies',
            roll: 1,
            slotIndex: 0,
          },
        ],
      },
    })
    const itemButtons = wrapper.findAll('button[aria-pressed]')
    // Click item 6 in first table (also slot 0, roll 6)
    await itemButtons[5]!.trigger('click')
    const payload = wrapper.emitted('update')![0]![0] as StartingItem[]
    expect(payload).toHaveLength(1)
    expect(payload[0]!.slotIndex).toBe(0)
    expect(payload[0]!.roll).toBe(6)
  })

  it('Roll All populates every table slot at once', async () => {
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'STITCH', items: [] },
    })
    // Mock Math.random to make rolls deterministic
    const r = vi.spyOn(Math, 'random').mockReturnValue(0.5) // → roll = floor(0.5 * 6) + 1 = 4
    const rollBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Roll All'))!
    await rollBtn.trigger('click')
    r.mockRestore()

    const payload = wrapper.emitted('update')![0]![0] as StartingItem[]
    expect(payload).toHaveLength(3)
    expect(payload.every((p) => p.roll === 4)).toBe(true)
    expect(payload.map((p) => p.slotIndex)).toEqual([0, 1, 2])
  })

  it('shows "All tables resolved" indicator once every slot has a selection', () => {
    const items: StartingItem[] = [0, 1, 2].map((i) => ({
      name: 'x',
      tableNumber: i === 0 ? 2 : 3,
      tableName: 'x',
      roll: 1,
      slotIndex: i,
    }))
    const wrapper = mount(StartingItemsStep, {
      props: { specialty: 'STITCH', items },
    })
    expect(wrapper.text()).toContain('All tables resolved')
  })

  it('does NOT show "resolved" when only some slots are selected', () => {
    const wrapper = mount(StartingItemsStep, {
      props: {
        specialty: 'STITCH',
        items: [
          {
            name: 'x',
            tableNumber: 2,
            tableName: 'Supplies',
            roll: 1,
            slotIndex: 0,
          },
        ],
      },
    })
    expect(wrapper.text()).not.toContain('All tables resolved')
    expect(wrapper.text()).toContain('click an item')
  })
})
