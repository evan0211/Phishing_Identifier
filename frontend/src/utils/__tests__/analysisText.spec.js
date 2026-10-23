import { expect, it } from 'vitest'
import { phoneAnalysisText } from '../analysisText.js'

it.each(['核心辨識模型確認安全', 'Gogolook verified the number', 'Core Recognition Model confirms safety'])(
  'does not attribute unsupported phone verification to Claude: %s', text => {
    const result = phoneAnalysisText(text, 'phone')
    expect(result).toContain('不支援電話驗證')
    expect(result).not.toMatch(/核心辨識模型|Gogolook|Core Recognition Model|Claude/)
  },
)
it('preserves actionable phone advice and URL analysis', () => {
  expect(phoneAnalysisText('不要提供個人資料', 'phone')).toBe('不要提供個人資料')
  expect(phoneAnalysisText('核心辨識模型', 'url')).toBe('核心辨識模型')
})
it('supports English and absent text', () => {
  expect(phoneAnalysisText('Gogolook', 'phone', 'en')).toContain('does not support phone verification')
  expect(phoneAnalysisText(null, 'phone')).toBeNull()
})
