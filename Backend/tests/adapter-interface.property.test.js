/**
 * Adapter 介面屬性測試
 * Feature: backend-api-integration
 */
'use strict'

const { test } = require('node:test')
const assert   = require('node:assert/strict')
const fc       = require('fast-check')
const mock     = require('../integrations/mock-adapter.js')

// Feature: backend-api-integration, Property 1: Adapter 介面完整性
// Validates: Requirements 1.4, 8.1, 8.4
test('屬性 1：Adapter 介面完整性 — mock', () => {
  const REQUIRED_FUNS = ['checkUrl', 'checkPhone', 'checkScreenshot', 'report']
  for (const fn of REQUIRED_FUNS) {
    assert.strictEqual(typeof mock[fn], 'function', `mock.${fn} 應為函式`)
  }
  assert.strictEqual(typeof mock.name, 'string', 'mock.name 應為字串')
  assert.strictEqual(mock.name, 'mock', 'mock.name 應為 "mock"')
})

// Feature: backend-api-integration, Property 2: 動態載入任意合法 Adapter
// Validates: Requirements 1.3
test('屬性 2：動態載入 mock adapter 不拋出例外', () => {
  assert.doesNotThrow(() => {
    require('../integrations/mock-adapter.js')
  }, '載入 mock-adapter.js 不應拋出例外')
})

test('屬性 2：動態載入 hackathon adapter 不拋出例外', () => {
  assert.doesNotThrow(() => {
    require('../integrations/hackathon-adapter.js')
  }, '載入 hackathon-adapter.js 不應拋出例外')
})

// 驗證 mock adapter 四個函式呼叫後回傳 Promise
// Validates: Requirements 1.5
test('屬性 1：mock adapter 函式呼叫後回傳 Promise', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),
      async (query) => {
        const urlResult   = mock.checkUrl(query)
        const phoneResult = mock.checkPhone(query)
        const ssResult    = mock.checkScreenshot(query)
        assert.ok(urlResult   instanceof Promise, 'checkUrl 應回傳 Promise')
        assert.ok(phoneResult instanceof Promise, 'checkPhone 應回傳 Promise')
        assert.ok(ssResult    instanceof Promise, 'checkScreenshot 應回傳 Promise')
        // 等待完成確保不拋出例外
        await urlResult
        await phoneResult
        await ssResult
      }
    ),
    { numRuns: 100 }
  )
})

// 驗證 hackathon adapter 介面完整性（不實際呼叫 API）
// Validates: Requirements 1.4
test('屬性 1：Adapter 介面完整性 — hackathon', () => {
  const hackathon = require('../integrations/hackathon-adapter.js')
  const REQUIRED_FUNS = ['checkUrl', 'checkPhone', 'checkScreenshot', 'report']
  for (const fn of REQUIRED_FUNS) {
    assert.strictEqual(typeof hackathon[fn], 'function', `hackathon.${fn} 應為函式`)
  }
  assert.strictEqual(typeof hackathon.name, 'string', 'hackathon.name 應為字串')
  assert.strictEqual(hackathon.name, 'hackathon', 'hackathon.name 應為 "hackathon"')
})
