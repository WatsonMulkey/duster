import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InventoryStep from './InventoryStep.vue'

describe('InventoryStep — Dominant Hand', () => {
  const mountStep = () =>
    mount(InventoryStep, { props: { name: '', inventory: '', hand: 'Right' } })

  const handButtons = (wrapper: ReturnType<typeof mountStep>) =>
    wrapper.find('[data-testid="hand-picker"]').findAll('button')

  it('offers exactly Right and Left (no "Both" at character creation)', () => {
    // Andrew (Occupied Hex): ambidexterity is a talent you earn, not a
    // starting choice — so "Both" must not be selectable in the creator.
    const labels = handButtons(mountStep()).map((b) => b.text())
    expect(labels).toEqual(['Right', 'Left'])
    expect(labels).not.toContain('Both')
  })

  it('emits update:hand with the chosen hand when a button is clicked', async () => {
    const wrapper = mountStep()
    const left = handButtons(wrapper).find((b) => b.text() === 'Left')!
    await left.trigger('click')
    expect(wrapper.emitted('update:hand')![0]).toEqual(['Left'])
  })
})

describe('InventoryStep — Inventory box', () => {
  it('emits reset when "Reset to starting gear" is clicked', async () => {
    const wrapper = mount(InventoryStep, {
      props: { name: '', inventory: 'edited', hand: 'Right' },
    })
    const resetBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Reset to starting gear'))!
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
