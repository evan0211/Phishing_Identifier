import { expect, it } from 'vitest'
import { getAnalysisReasons, normalizeReasons } from '../analysisReasons.js'

it('uses Claude reasons for phone results instead of core model reasons', () => {
  const data = { reasons: ['核心辨識模型查無資料'], ai: { reasoning: '來電身分無法確認\n請透過官方管道查證' } }
  expect(getAnalysisReasons(data, 'phone')).toEqual(['來電身分無法確認', '請透過官方管道查證'])
  expect(getAnalysisReasons(data, 'url')).toEqual(['核心辨識模型查無資料'])
})
it('falls back across supported fields, including top-level Claude responses', () => {
  expect(getAnalysisReasons({ ai: { reasoning: '', reasons: ['理由'] } }, 'phone')).toEqual(['理由'])
  expect(getAnalysisReasons({ reasoning: '電話分析' }, 'phone')).toEqual(['電話分析'])
  expect(getAnalysisReasons({ reasons: '一般原因' }, 'url')).toEqual(['一般原因'])
})
it('handles absent and malformed reasons without rendering objects or splitting into characters', () => {
  expect(normalizeReasons([' 第一項 ', null, {}, 42, '\n第二項\n'])).toEqual(['第一項', '第二項'])
  expect(getAnalysisReasons(null, 'phone')).toEqual([])
  expect(getAnalysisReasons({ ai: { reasoning: {} }, reasons: ['備用原因'] }, 'phone')).toEqual(['備用原因'])
})
