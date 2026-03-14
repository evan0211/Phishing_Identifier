/**
 * Mock Adapter 單元測試
 * Feature: backend-api-integration
 */
'use strict'

const { test } = require('node:test')
const assert   = require('node:assert/strict')
const mock     = require('../integrations/mock-adapter.js')

// Validates: Requirements 8.1, 8.4
test('Mock Adapter 匯出四個函式', () => {
  assert.strictEqual(typeof mock.checkUrl,        'function', 'checkUrl 應為函式')
  assert.strictEqual(typeof mock.checkPhone,      'function', 'checkPhone 應為函式')
  assert.strictEqual(typeof mock.checkScreenshot, 'function', 'checkScreenshot 應為函式')
  assert.strictEqual(typeof mock.report,          'function', 'report 應為函式')
})

test('Mock Adapter name 屬性為 "mock"', () => {
  assert.strictEqual(mock.name, 'mock', 'name 應為 "mock"')
})

// Validates: Requirements 8.3
test('Mock report 回傳 { ok: true, caseNo: <非空字串> }', async () => {
  const result = await mock.report('測試查詢')
  assert.strictEqual(result.ok, true, 'ok 應為 true')
  assert.strictEqual(typeof result.caseNo, 'string', 'caseNo 應為字串')
  assert.ok(result.caseNo.length > 0, 'caseNo 不得為空')
})

// Validates: Requirements 8.2
test('Mock checkUrl 對安全網址回傳 safe', async () => {
  const result = await mock.checkUrl('https://example.com')
  assert.strictEqual(result.level, 'safe')
})

test('Mock checkScreenshot 依 query 判斷風險等級', async () => {
  const scam = await mock.checkScreenshot('這是詐騙訊息')
  assert.strictEqual(scam.level, 'scam')
  const safe = await mock.checkScreenshot('正常內容')
  assert.strictEqual(safe.level, 'safe')
})
