import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneInput from '../PhoneInput.vue'

describe('PhoneInput', () => {
  it('labels the phone input', () => {
    const wrapper = mount(PhoneInput, { props: { noAutoFocus: true } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('電話號碼輸入')
    wrapper.unmount()
  })
  it('emits a Taiwan international number without the trunk prefix', async () => {
    const wrapper = mount(PhoneInput)
    await wrapper.get('input').setValue('0912345678')
    expect(wrapper.emitted('valid').at(-1)[0]).toEqual({ isValid: true, e164: '+886912345678' })
    await wrapper.get('.phone-clear').trigger('click')
    expect(wrapper.emitted('valid').at(-1)[0]).toEqual({ isValid: false, e164: '' })
    wrapper.unmount()
  })
  it('does not mark a short number valid after changing country', async () => {
    const wrapper = mount(PhoneInput)
    await wrapper.get('input').setValue('123456')
    await wrapper.get('.cc-btn').trigger('click')
    await wrapper.findAll('.cc-item')[2].trigger('click')
    expect(wrapper.emitted('valid').at(-1)[0].isValid).toBe(false)
    wrapper.unmount()
  })
})
