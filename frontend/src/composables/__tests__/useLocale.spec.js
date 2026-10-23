import { afterEach, expect, it } from 'vitest'
import { locale, translateBackend } from '../useLocale.js'

afterEach(() => { locale.value = 'zh' })
it('renames the legacy provider in Chinese backend text', () => {
  locale.value = 'zh'
  expect(translateBackend('Gogolook 信任分數：1 / 100')).toBe('核心辨識模型 信任分數：1 / 100')
})
it('renames and translates the backend score label in English', () => {
  locale.value = 'en'
  expect(translateBackend('Gogolook 信任分數：1 / 100')).toBe('Core Recognition Model Trust Score：1 / 100')
})
