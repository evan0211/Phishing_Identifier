import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneInput from '../PhoneInput.vue'

// Stub VueTelInput to avoid browser API dependencies (teleport, dropdown, etc.)
const VueTelInputStub = {
  name: 'VueTelInput',
  template: '<div class="vue-tel-input"><input class="vti__input" /></div>',
  props: ['modelValue', 'inputOptions', 'dropdownOptions'],
  emits: ['on-input', 'on-country-changed', 'focus', 'blur'],
}

const mountOptions = {
  global: {
    stubs: { VueTelInput: VueTelInputStub },
  },
}

// ── Requirement 1.1: VueTelInput is rendered ──────────────────────────────────
describe('PhoneInput renders VueTelInput (Req 1.1)', () => {
  it('renders the VueTelInput stub', () => {
    const wrapper = mount(PhoneInput, mountOptions)
    expect(wrapper.findComponent(VueTelInputStub).exists()).toBe(true)
  })

  it('wraps VueTelInput in .phone-input-wrap', () => {
    const wrapper = mount(PhoneInput, mountOptions)
    expect(wrapper.find('.phone-input-wrap').exists()).toBe(true)
  })
})

// ── Requirement 7.1: aria-label attributes ────────────────────────────────────
describe('aria-label accessibility (Req 7.1)', () => {
  it('inputOptions contains aria-label for the phone input', () => {
    const wrapper = mount(PhoneInput, mountOptions)
    const vueTelInput = wrapper.findComponent(VueTelInputStub)
    expect(vueTelInput.props('inputOptions')['aria-label']).toBe('電話號碼輸入')
  })

  it('dropdownOptions contains aria-label for the country selector', () => {
    const wrapper = mount(PhoneInput, mountOptions)
    const vueTelInput = wrapper.findComponent(VueTelInputStub)
    expect(vueTelInput.props('dropdownOptions')['aria-label']).toBe('選擇國碼')
  })
})

// ── Requirement 4.5: phone number validation via onInput handler ──────────────
// We test the component's emit behaviour by directly invoking the on-input event
// that VueTelInput would emit, which triggers the component's onInput handler.
describe('phone number validation (Req 4.5)', () => {
  const validNumbers = [
    { label: '台灣', number: '+886912345678', e164: '+886912345678' },
    { label: '中國', number: '+8613800138000', e164: '+8613800138000' },
    { label: '香港', number: '+85291234567', e164: '+85291234567' },
    { label: '美國', number: '+12125551234', e164: '+12125551234' },
    { label: '日本', number: '+819012345678', e164: '+819012345678' },
  ]

  validNumbers.forEach(({ label, number, e164 }) => {
    it(`emits valid=true for ${label} number ${number}`, async () => {
      const wrapper = mount(PhoneInput, mountOptions)
      const vueTelInput = wrapper.findComponent(VueTelInputStub)

      // Simulate VueTelInput emitting on-input with a valid phoneObject
      await vueTelInput.vm.$emit('on-input', number, { valid: true, number: e164 })

      const validEvents = wrapper.emitted('valid')
      expect(validEvents).toBeTruthy()
      const lastEvent = validEvents[validEvents.length - 1][0]
      expect(lastEvent.isValid).toBe(true)
      expect(lastEvent.e164).toBe(e164)
    })
  })

  it('emits valid=false for an invalid number', async () => {
    const wrapper = mount(PhoneInput, mountOptions)
    const vueTelInput = wrapper.findComponent(VueTelInputStub)

    await vueTelInput.vm.$emit('on-input', '123', { valid: false, number: '' })

    const validEvents = wrapper.emitted('valid')
    expect(validEvents).toBeTruthy()
    expect(validEvents[validEvents.length - 1][0].isValid).toBe(false)
  })
})
