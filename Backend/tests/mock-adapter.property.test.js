/**
 * Mock Adapter 屬性測試
 * Feature: backend-api-integration
 */
'use strict'

const { test } = require('node:test')
const assert   = require('node:assert/strict')
const fc       = require('fast-check')
const mock     = require('../integrations/mock-adapter.js')

// Feature: backend-api-integration, Property 9: Mock checkUrl 關鍵字比對
// Validates: Requirements 8.2
test('屬性 9：Mock 關鍵字比對邏輯', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('scam', '詐騙', 'phish'),
      async (keyword) => {
        const result = await mock.checkUrl(keyword)
        assert.strictEqual(result.level, 'scam', `含關鍵字 "${keyword}" 應回傳 scam`)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: backend-api-integration, Property 10: Mock report 產生唯一案件編號
// Validates: Requirements 8.3
test('屬性 10：Mock report 產生唯一案件編號', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),
      async (query) => {
        const r1 = await mock.report(query)
        // 稍微延遲確保 timestamp 不同
        await new Promise(r => setTimeout(r, 1))
        const r2 = await mock.report(query)
        assert.ok(r1.caseNo && r1.caseNo.length > 0, 'caseNo 不得為空')
        assert.notStrictEqual(r1.caseNo, r2.caseNo, '連續兩次 caseNo 應不同')
      }
    ),
    { numRuns: 100 }
  )
})
