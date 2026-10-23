import { afterEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavLogo from '../NavLogo.vue'

const { route, push } = vi.hoisted(() => ({ route: { path: '/' }, push: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push }) }))
vi.mock('../../composables/useTheme.js', () => ({ useTheme: () => ({ isDark: false }) }))
afterEach(() => { vi.unstubAllGlobals(); push.mockClear(); route.path = '/' })
it('smoothly scrolls to the top when clicking the logo on the home page', async () => {
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  const wrapper = mount(NavLogo)
  await wrapper.get('a').trigger('click')
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  expect(push).not.toHaveBeenCalled()
  wrapper.unmount()
})
it('navigates home from another page', async () => {
  route.path = '/result'
  const wrapper = mount(NavLogo)
  await wrapper.get('a').trigger('click')
  expect(push).toHaveBeenCalledWith('/')
  wrapper.unmount()
})
