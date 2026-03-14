/**
 * Server 端點屬性測試
 * Feature: backend-api-integration
 */
'use strict'

const { test } = require('node:test')
const assert   = require('node:assert/strict')
const fc       = require('fast-check')
const mock     = require('../integrations/mock-adapter.js')

// 從 server.js 提取可測試的純函式（避免啟動 HTTP server）
const VALID_LEVELS = new Set(['safe', 'promo', 'warn', 'scam'])

function normalize(raw) {
  const level   = VALID_LEVELS.has(raw.level) ? raw.level : 'warn'
  const score   = raw.score   != null ? raw.score   : 50
  const label   = raw.label   || '查詢完成'
  const reasons = Array.isArray(raw.reasons) ? raw.reasons : (raw.reasons ? [raw.reasons] : [])
  return { level, score, label, reasons }
}

function cleanPhone(query) {
  return query.replace(/[-\s]/g, '')
}

async function withFallback(fn) {
  try {
    return normalize(await fn())
  } catch (err) {
    return normalize(await mock.checkUrl(''))
  }
}

// Feature: backend-api-integration, Property 8: 電話號碼清理
// Validates: Requirements 4.1
test('屬性 8：電話號碼清理', () => {
  fc.assert(
    fc.property(
      // 產生含空白與連字號的電話號碼
      fc.tuple(
        fc.stringMatching(/^[0-9]{4,10}$/),
        fc.array(fc.constantFrom(' ', '-', '　'), { minLength: 1, maxLength: 5 })
      ).map(([digits, separators]) => {
        // 將分隔符插入數字之間
        let result = digits
        for (const sep of separators) {
          const pos = Math.floor(Math.random() * result.length)
          result = result.slice(0, pos) + sep + result.slice(pos)
        }
        return result
      }),
      (phoneWithSeparators) => {
        const cleaned = cleanPhone(phoneWithSeparators)
        // 清理後不應含空白或連字號
        assert.ok(!cleaned.includes(' '),  '清理後不應含空白')
        assert.ok(!cleaned.includes('-'),  '清理後不應含連字號')
        assert.ok(!cleaned.includes('　'), '清理後不應含全形空白')
      }
    ),
    { numRuns: 200 }
  )
})

// Feature: backend-api-integration, Property 6: 回傳 level 值必為有效 Risk Level
// Validates: Requirements 3.5
test('屬性 6：mock adapter 回傳的 level 必為有效 Risk Level', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),
      async (query) => {
        const result = await mock.checkUrl(query)
        assert.ok(VALID_LEVELS.has(result.level), `level 必須為有效值，得到：${result.level}`)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: backend-api-integration, Property 7: Adapter 失敗時回傳 mock fallback
// Validates: Requirements 3.4, 4.4, 5.3
test('屬性 7：Adapter 失敗時 withFallback 回傳合法 mock 結果', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(),
      async (_query) => {
        // 模擬 Adapter 拋出例外
        const result = await withFallback(() => { throw new Error('模擬 Adapter 失敗') })
        assert.ok('level'   in result, '缺少 level 欄位')
        assert.ok('score'   in result, '缺少 score 欄位')
        assert.ok('label'   in result, '缺少 label 欄位')
        assert.ok('reasons' in result, '缺少 reasons 欄位')
        assert.ok(VALID_LEVELS.has(result.level), `fallback level 必須為有效值，得到：${result.level}`)
        assert.ok(Array.isArray(result.reasons), 'reasons 必須為陣列')
      }
    ),
    { numRuns: 100 }
  )
})
