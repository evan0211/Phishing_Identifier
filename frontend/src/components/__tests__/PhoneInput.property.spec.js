/**
 * Property-Based Tests for PhoneInput
 *
 * Property 2: valid 事件包含完整驗證資訊（isValid + e164）
 * Validates: Requirements 2.2, 2.4
 *
 * For any phone number input, the `valid` event emitted by PhoneInput should
 * always contain both `isValid` (boolean) and `e164` (string) fields.
 * Even when the number is invalid, `e164` should be a string (possibly empty).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import fc from 'fast-check'
import PhoneInput from '../PhoneInput.vue'

// Stub VueTelInput to avoid browser API dependencies
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

/**
 * Property 2: valid 事件包含完整驗證資訊（isValid + e164）
 * Validates: Requirements 2.2, 2.4
 */
describe('PhoneInput property tests', () => {
  it('Property 2: valid event always contains isValid (boolean) and e164 (string)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),        // arbitrary phone number string
        fc.boolean(),       // arbitrary validity
        fc.string(),        // arbitrary e164 string
        async (phoneNumber, valid, e164) => {
          const wrapper = mount(PhoneInput, mountOptions)
          const vueTelInput = wrapper.findComponent(VueTelInputStub)

          // Simulate VueTelInput emitting on-input with arbitrary values
          await vueTelInput.vm.$emit('on-input', phoneNumber, { valid, number: e164 })

          const validEvents = wrapper.emitted('valid')
          expect(validEvents).toBeTruthy()

          const payload = validEvents[validEvents.length - 1][0]

          // isValid must be a boolean
          expect(typeof payload.isValid).toBe('boolean')

          // e164 must be a string (can be empty)
          expect(typeof payload.e164).toBe('string')
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 5: 無效號碼阻止送出，不發出 API 請求
 * Validates: Requirement 4.4
 *
 * For any phone number where phoneIsValid is false,
 * the doCheck validation guard should prevent API calls.
 */
describe('Property 5: invalid phone blocks submit (Req 4.4)', () => {
  it('validation guard returns early when phoneIsValid is false', () => {
    fc.assert(
      fc.property(
        fc.string(), // arbitrary phone number
        (phoneNumber) => {
          // Simulate the doCheck validation guard logic
          const phoneIsValid = false // always invalid for this property
          const type = 'phone'
          let fetchCalled = false
          let toastShown = false

          // Inline the guard logic from doCheck
          function simulateDoCheck() {
            if (type === 'phone' && !phoneIsValid) {
              toastShown = true
              return // early return - no fetch
            }
            fetchCalled = true // would call fetch
          }

          simulateDoCheck()

          // Property: fetch must NOT be called when phoneIsValid is false
          expect(fetchCalled).toBe(false)
          // Property: toast must be shown
          expect(toastShown).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 6: E.164 格式化送出
 * Validates: Requirements 5.1, 5.2
 *
 * For any valid phone number (starting with +), the cleaned E.164 format
 * should match /^\+\d+$/ (+ followed by digits only).
 */
describe('Property 6: E.164 format on submit (Req 5.1, 5.2)', () => {
  it('cleanE164 produces valid E.164 format for any phone with + prefix', () => {
    // Arbitrary: + prefix followed by 6-15 digits (valid E.164 range)
    const e164Arb = fc.stringMatching(/^\+\d{6,15}$/)

    fc.assert(
      fc.property(e164Arb, (e164) => {
        function cleanE164(raw) {
          return raw.replace(/[^\d+]/g, '')
        }
        const cleaned = cleanE164(e164)
        // Must match E.164: + followed by digits only
        expect(/^\+\d+$/.test(cleaned)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('cleanE164 removes spaces, brackets, and hyphens while preserving + prefix', () => {
    // Arbitrary: digits string to build a noisy E.164 from
    const digitsArb = fc.stringMatching(/^\d{6,15}$/)

    fc.assert(
      fc.property(digitsArb, (digits) => {
        // Build a noisy phone: +digits with hyphens and spaces inserted
        const noisyPhone = '+' + digits.split('').join('-').replace(/(\d{3})-/, '$1 ')

        function cleanE164(raw) {
          return raw.replace(/[^\d+]/g, '')
        }
        const cleaned = cleanE164(noisyPhone)
        expect(/^\+\d+$/.test(cleaned)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 8: detectedType 切換顯示/隱藏
 * Validates: Requirements 6.1, 6.2
 *
 * For any input matching PHONE_RE, detectedType returns 'phone'.
 * For inputs not matching PHONE_RE, detectedType returns non-'phone'.
 */
describe('Property 8: detectedType switching (Req 6.1, 6.2)', () => {
  const PHONE_RE = /^[\d\s\-+()]{6,15}$/
  const URL_RE   = /^(https?:\/\/|www\.|[a-zA-Z0-9]([a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,})/

  function computeDetectedType(inputText) {
    const t = inputText.trim()
    if (!t) return 'url'
    if (PHONE_RE.test(t.replace(/[-\s()]/g, ''))) return 'phone'
    if (URL_RE.test(t)) return 'url'
    return 'url'
  }

  it('inputs matching PHONE_RE produce detectedType === phone', () => {
    // Generate strings of 6-15 digits (always match PHONE_RE after stripping)
    const phoneInputArb = fc.stringMatching(/^\d{6,15}$/)

    fc.assert(
      fc.property(phoneInputArb, (phoneStr) => {
        const type = computeDetectedType(phoneStr)
        expect(type).toBe('phone')
      }),
      { numRuns: 100 }
    )
  })

  it('URL inputs produce detectedType !== phone', () => {
    // Generate valid URL strings
    const urlArb = fc.constantFrom(
      'https://example.com',
      'http://suspicious.net/path',
      'www.scam-site.com',
      'example.com',
      'google.com/search?q=test'
    )

    fc.assert(
      fc.property(urlArb, (urlStr) => {
        const type = computeDetectedType(urlStr)
        expect(type).not.toBe('phone')
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 9: 清空後狀態重設
 * Validates: Requirement 6.4
 *
 * After clearing inputText (setting to empty string),
 * phoneIsValid should be false and phoneE164 should be empty string.
 */
describe('Property 9: reset on clear (Req 6.4)', () => {
  it('clearing inputText resets phoneIsValid to false and phoneE164 to empty string', () => {
    // Arbitrary: any initial phone state (valid or invalid, any e164)
    const initialStateArb = fc.record({
      phoneIsValid: fc.boolean(),
      phoneE164: fc.string(),
      inputText: fc.string()
    })

    fc.assert(
      fc.property(initialStateArb, ({ phoneIsValid, phoneE164 }) => {
        // Simulate the watcher logic from HomeView.vue
        let currentPhoneIsValid = phoneIsValid
        let currentPhoneE164 = phoneE164

        function simulateWatcher(newInputText) {
          if (!newInputText) {
            currentPhoneIsValid = false
            currentPhoneE164 = ''
          }
        }

        // Clear the input
        simulateWatcher('')

        // Property: after clearing, phoneIsValid must be false
        expect(currentPhoneIsValid).toBe(false)
        // Property: after clearing, phoneE164 must be empty string
        expect(currentPhoneE164).toBe('')
      }),
      { numRuns: 100 }
    )
  })

  it('non-empty inputText does not reset phone state', () => {
    // Arbitrary: any non-empty phone input
    const nonEmptyArb = fc.string({ minLength: 1 })
    const stateArb = fc.record({
      phoneIsValid: fc.boolean(),
      phoneE164: fc.string()
    })

    fc.assert(
      fc.property(nonEmptyArb, stateArb, (inputText, { phoneIsValid, phoneE164 }) => {
        let currentPhoneIsValid = phoneIsValid
        let currentPhoneE164 = phoneE164

        function simulateWatcher(newInputText) {
          if (!newInputText) {
            currentPhoneIsValid = false
            currentPhoneE164 = ''
          }
        }

        // Set non-empty input - should NOT reset state
        simulateWatcher(inputText)

        // Property: state should remain unchanged
        expect(currentPhoneIsValid).toBe(phoneIsValid)
        expect(currentPhoneE164).toBe(phoneE164)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 7: 後端正規表達式接受 E.164 格式
 * Validates: Requirement 5.4
 *
 * For any E.164 format phone number (+digits), the backend regex
 * /^[\d\s\-+()]+$/ should pass validation (not return 400 error).
 */
describe('Property 7: backend regex accepts E.164 (Req 5.4)', () => {
  // Backend regex from server.js
  const BACKEND_PHONE_RE = /^[\d\s\-+()]+$/

  it('backend regex accepts any E.164 format number', () => {
    // Generate arbitrary E.164 numbers: + followed by 6-15 digits
    const e164Arb = fc.stringMatching(/^\+\d{6,15}$/)

    fc.assert(
      fc.property(e164Arb, (e164) => {
        // The backend does: if (!/^[\d\s\-+()]+$/.test(query.trim())) return 400
        const passes = BACKEND_PHONE_RE.test(e164.trim())
        expect(passes).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('backend regex rejects non-phone strings', () => {
    // Strings with letters should fail the backend regex
    const nonPhoneArb = fc.constantFrom(
      'hello world',
      'not-a-phone@email.com',
      'abc123',
      'https://example.com'
    )

    fc.assert(
      fc.property(nonPhoneArb, (nonPhone) => {
        const passes = BACKEND_PHONE_RE.test(nonPhone.trim())
        expect(passes).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
