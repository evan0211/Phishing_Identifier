import { afterEach, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ResultView from '../ResultView.vue'
import { resultState } from '../../composables/useResult.js'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('../../composables/useTheme.js', () => ({ useTheme: () => ({ isDark: false, toggle: vi.fn() }) }))
let wrapper
afterEach(() => {
  wrapper?.unmount()
  resultState.data = null
  vi.useRealTimers()
})
it('renders Claude phone reasoning when top-level reasons are absent', () => {
  vi.useFakeTimers()
  resultState.lastType = 'phone'
  resultState.lastInput = '+886223456789'
  resultState.data = { level: 'warn', label: '可疑', ai: { score: 50, reasoning: '無法確認身分\n請透過官方管道查證' } }
  wrapper = shallowMount(ResultView)
  expect(wrapper.findAll('.reasons li').map(item => item.text())).toEqual([
    expect.stringContaining('無法確認身分'), expect.stringContaining('請透過官方管道查證'),
  ])
})
it('renders a top-level paragraph as one reason rather than one list item per character', () => {
  vi.useFakeTimers()
  resultState.lastType = 'url'
  resultState.lastInput = 'https://example.com'
  resultState.data = { level: 'warn', label: '可疑', reasons: '網址尚無足夠資料' }
  wrapper = shallowMount(ResultView)
  expect(wrapper.findAll('.reasons li')).toHaveLength(1)
  expect(wrapper.get('.reasons li').text()).toContain('網址尚無足夠資料')
})
