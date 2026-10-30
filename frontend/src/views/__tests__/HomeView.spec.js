import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { shallowMount, flushPromises } from '@vue/test-utils'
import HomeView from '../HomeView.vue'
import { prepareScreenshot } from '../../utils/screenshot.js'
import { autoCheck } from '../../services/api.js'
import { useElder } from '../../composables/useElder.js'

vi.mock('../../utils/screenshot.js', () => ({ prepareScreenshot: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../../composables/useTheme.js', () => ({ useTheme: () => ({ isDark: false, toggle: vi.fn() }) }))
vi.mock('../../services/api.js', () => ({
  normalizePhone: vi.fn(), autoCheck: vi.fn(), report: vi.fn(),
  getStatsPeriods: async () => ({ periods: [], todayCards: [] }),
  getChartData: async () => ({}),
}))
let wrapper
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
})
afterEach(() => {
  wrapper?.unmount()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
it('hides the animated placeholder while English is being composed by an IME', async () => {
  wrapper = shallowMount(HomeView)
  const input = wrapper.get('textarea')
  expect(wrapper.find('.animated-placeholder').exists()).toBe(true)
  await input.trigger('compositionstart')
  input.element.value = 'example'
  await input.trigger('input')
  expect(wrapper.find('.animated-placeholder').exists()).toBe(false)
  await input.trigger('compositionend')
  expect(wrapper.find('.animated-placeholder').exists()).toBe(false)
  await input.setValue('')
  expect(wrapper.find('.animated-placeholder').exists()).toBe(true)
})
it('hides the animated placeholder for ordinary English input', async () => {
  wrapper = shallowMount(HomeView)
  await wrapper.get('textarea').setValue('example.com')
  expect(wrapper.find('.animated-placeholder').exists()).toBe(false)
})

it('fades the scroll hint and restores it on return without changing layout', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('scrollY', 0)
  wrapper = shallowMount(HomeView)
  const hint = wrapper.get('.scroll-arrow')
  expect(hint.attributes('style')).toContain('opacity: 1')
  vi.stubGlobal('scrollY', 80)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(hint.attributes('style')).toContain('opacity: 1')
  vi.stubGlobal('scrollY', 260)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(hint.attributes('style')).toContain('opacity: 0.5')
  vi.stubGlobal('scrollY', 440)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(hint.attributes('aria-hidden')).toBe('true')
  expect(hint.attributes('tabindex')).toBe('-1')
  vi.stubGlobal('scrollY', 0)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(hint.attributes('style')).toContain('opacity: 1')
  expect(hint.attributes('aria-hidden')).toBeUndefined()
})


it('reveals the navbar immediately when scrolling upward and keeps it visible at the top', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('scrollY', 0)
  wrapper = shallowMount(HomeView)
  const navbar = wrapper.get('.navbar')
  vi.stubGlobal('scrollY', 500)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(navbar.classes()).toContain('hidden')
  vi.stubGlobal('scrollY', 450)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(navbar.classes()).not.toContain('hidden')
  vi.stubGlobal('scrollY', 0)
  window.dispatchEvent(new Event('scroll'))
  await nextTick()
  expect(navbar.classes()).not.toContain('hidden')
})

it('switches elder mode in place without losing input or reloading', async () => {
  const reload = vi.fn()
  vi.stubGlobal('location', { reload })
  const elder = useElder()
  if (elder.isElder.value) elder.toggle()
  wrapper = shallowMount(HomeView)
  const input = wrapper.get('textarea').element
  await wrapper.get('textarea').setValue('example.com')
  elder.toggle()
  await nextTick()
  expect(wrapper.classes()).toContain('elder')
  expect(wrapper.get('textarea').element).toBe(input)
  expect(input.value).toBe('example.com')
  expect(wrapper.get('.elder-instructions').text()).toContain('立即檢測')
  expect(document.documentElement.getAttribute('data-elder')).toBe('true')
  expect(localStorage.getItem('elder')).toBe('true')
  expect(reload).not.toHaveBeenCalled()
  elder.toggle()
  await nextTick()
  expect(wrapper.classes()).not.toContain('elder')
  expect(input.value).toBe('example.com')
})

it('keeps the floating settings menu open while changing elder mode', async () => {
  const elder = useElder()
  if (elder.isElder.value) elder.toggle()
  wrapper = shallowMount(HomeView, { attachTo: document.body })
  await wrapper.get('.settings-btn').trigger('click')
  expect(wrapper.find('.navbar .settings-menu').exists()).toBe(true)
  await wrapper.get('.settings-menu .menu-row').trigger('click')
  expect(wrapper.find('.settings-menu').exists()).toBe(true)
  expect(elder.isElder.value).toBe(true)
  await wrapper.get('.settings-btn').trigger('click')
  expect(wrapper.find('.settings-menu').exists()).toBe(false)
  elder.toggle()
})

it('preserves Chinese IME input and switches mixed phone text to text analysis', async () => {
  wrapper = shallowMount(HomeView)
  const input = wrapper.get('textarea')
  await input.trigger('compositionstart')
  input.element.value = '請問這是詐騙嗎？'
  await input.trigger('input')
  await input.trigger('compositionend')
  expect(input.element.value).toBe('請問這是詐騙嗎？')
  expect(wrapper.get('.type-chip.active').text()).toBe('文字')
  await input.setValue('0912345678')
  expect(wrapper.get('.type-chip.active').attributes('data-type')).toBe('phone')
  await input.setValue('0912345678 說我的帳戶有問題')
  expect(input.element.value).toBe('0912345678 說我的帳戶有問題')
  expect(wrapper.get('.type-chip.active').attributes('data-type')).toBe('text')
})

it('keeps empty automatic input unclassified, including after clearing text', async () => {
  wrapper = shallowMount(HomeView)
  expect(wrapper.find('.type-chips').exists()).toBe(false)
  expect(wrapper.find('.type-chip.active').exists()).toBe(false)
  expect(wrapper.get('.send-btn').attributes('disabled')).toBeDefined()
  const input = wrapper.get('textarea')
  await input.setValue('請幫我看看這則訊息')
  expect(wrapper.find('.type-chips').exists()).toBe(true)
  expect(wrapper.get('.type-chip.active').attributes('data-type')).toBe('text')
  await input.setValue('   ')
  expect(wrapper.find('.type-chips').exists()).toBe(false)
  expect(wrapper.find('.type-chip.active').exists()).toBe(false)
  await input.setValue('example.com')
  await wrapper.get('.clear-btn').trigger('click')
  expect(wrapper.find('.type-chips').exists()).toBe(false)
  expect(wrapper.find('.type-chip.active').exists()).toBe(false)
})

it('allows manually selecting a type after entering content', async () => {
  wrapper = shallowMount(HomeView)
  await wrapper.get('textarea').setValue('example.com')
  await wrapper.get('[data-type="text"]').trigger('click')
  expect(wrapper.get('.type-chip.active').attributes('data-type')).toBe('text')
  await wrapper.get('textarea').setValue('請幫我看看這則訊息')
  expect(wrapper.get('textarea').element.value).toBe('請幫我看看這則訊息')
})
it('previews and replaces one screenshot, sends its content, and preserves text when switching modes', async () => {
  prepareScreenshot.mockResolvedValueOnce({ name: 'first.png', src: 'data:image/jpeg;base64,first' })
    .mockResolvedValueOnce({ name: 'second.png', src: 'data:image/jpeg;base64,second' })
  autoCheck.mockResolvedValueOnce({ level: 'warn', reasons: ['截圖原因'] })
  wrapper = shallowMount(HomeView)
  await wrapper.get('textarea').setValue('保留這段文字')
  await wrapper.get('[data-type="screenshot"]').trigger('click')
  expect(wrapper.get('.send-btn').attributes('disabled')).toBeDefined()
  for (const name of ['first.png', 'second.png']) {
    const input = wrapper.get('.screenshot-file')
    Object.defineProperty(input.element, 'files', { value: [new File(['image'], name, { type: 'image/png' })], configurable: true })
    await input.trigger('change')
    await flushPromises()
    expect(wrapper.findAll('.img-thumb')).toHaveLength(1)
  }
  expect(wrapper.get('.img-thumb img').attributes('src')).toBe('data:image/jpeg;base64,second')
  await wrapper.get('.send-btn').trigger('click')
  await flushPromises()
  expect(autoCheck).toHaveBeenLastCalledWith('data:image/jpeg;base64,second', 'screenshot', undefined, expect.anything(), 'zh')
  await wrapper.get('[data-type="text"]').trigger('click')
  expect(wrapper.get('textarea').element.value).toBe('保留這段文字')
})
