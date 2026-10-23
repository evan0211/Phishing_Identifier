import { afterEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import OnboardingTour from '../OnboardingTour.vue'
let wrapper
let target
afterEach(() => {
  wrapper?.unmount()
  target?.remove()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.removeItem('tour-regression')
})
it('fills the demo once without an endless positioning timer and uses vector icons', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('scrollTo', vi.fn())
  target = document.createElement('textarea')
  target.className = 'smart-input'
  target.getBoundingClientRect = () => ({ left: 400, right: 800, top: 300, bottom: 420, width: 400, height: 120 })
  document.body.append(target)
  wrapper = mount(OnboardingTour, { props: { storageKey: 'tour-regression', noScroll: true }, global: { stubs: { teleport: true } } })
  await flushPromises()
  expect(wrapper.find('.tour-icon svg').exists()).toBe(true)
  await wrapper.get('.tour-guide-btn').trigger('click')
  await vi.advanceTimersByTimeAsync(1000)
  expect(wrapper.emitted('set-input')).toHaveLength(1)
  expect(wrapper.findAll('.tour-blocker')).toHaveLength(4)
})

it.each([
  ['visible', 200, false, 0],
  ['offscreen', 1200, false, 1],
  ['noScroll', 1200, true, 0],
])('keeps the background still for %s targets', async (_, top, noScroll, calls) => {
  vi.useFakeTimers()
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  const scrollIntoView = vi.fn()
  target = document.createElement('button')
  target.className = 'tour-target'
  target.scrollIntoView = scrollIntoView
  target.getBoundingClientRect = () => ({ left: 100, right: 300, top, bottom: top + 60, width: 200, height: 60 })
  document.body.append(target)
  document.documentElement.style.overflow = 'auto'
  wrapper = mount(OnboardingTour, {
    props: { storageKey: 'tour-regression', noScroll, steps: [{ title: 'Target', icon: 'search', target: '.tour-target' }] },
    global: { stubs: { teleport: true } },
  })
  await flushPromises()
  await vi.advanceTimersByTimeAsync(100)
  expect(scrollTo).not.toHaveBeenCalled()
  expect(scrollIntoView).toHaveBeenCalledTimes(calls)
  if (calls) expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
  expect(document.documentElement.style.overflow).toBe('hidden')
  wrapper.unmount()
  wrapper = null
  expect(document.documentElement.style.overflow).toBe('auto')
  document.documentElement.style.overflow = ''
})

it('keeps the same visible card between steps instead of fading it out and remounting', async () => {
  vi.useFakeTimers()
  wrapper = mount(OnboardingTour, {
    props: { storageKey: 'tour-regression', steps: [
      { title: 'First', icon: 'search', target: null },
      { title: 'Second', icon: 'check', target: null },
    ] },
    global: { stubs: { teleport: false } },
  })
  await flushPromises()
  const card = document.querySelector('.tour-card')
  document.querySelector('.tour-next').click()
  await nextTick()
  expect(document.querySelector('.tour-card')).toBe(card)
  expect(document.querySelector('.tour-title').textContent).toBe('Second')
  expect(card.style.opacity).toBe('')
})
