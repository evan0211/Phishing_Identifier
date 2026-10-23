import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { normalizePhone } from '../../services/api.js'

describe('phone input preservation', () => {
  it('preserves input except surrounding whitespace', () => {
    fc.assert(fc.property(fc.string(), value => {
      expect(normalizePhone(value)).toBe(value.trim())
    }))
  })
})
