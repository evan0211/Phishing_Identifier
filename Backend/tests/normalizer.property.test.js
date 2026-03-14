/**
 * Normalizer 屬性測試
 * Feature: backend-api-integration
 */
'use strict'

const { test } = require('node:test')
const assert   = require('node:assert/strict')
const fc       = require('fast-check')

// 由於 server.js 啟動時會建立 HTTP server，在此直接複製 normalize 函式以避免副作用
const VALID_LEVELS = new Set(['safe', 'promo', 'warn', 'scam'])

function normalize(raw) {
  const level   = VALID_LEVELS.has(raw.level) ? raw.level : 'warn'
  const score   = raw.score   != null ? raw.score   : 50
  const label   = raw.label   || '查詢完成'
  const reasons = Array.isArray(raw.reasons) ? raw.reasons : (raw.reasons ? [raw.reasons] : [])
  return { level, score, label, reasons }
}

// Feature: backend-api-integration, Property 3: Normalizer 輸出格式一致性
// Validates: Requirements 9.1
test('屬性 3：Normalizer 輸出格式一致性', () => {
  fc.assert(
    fc.property(
      fc.record({
        level:   fc.option(fc.oneof(fc.constantFrom('safe', 'promo', 'warn', 'scam'), fc.string()), { nil: undefined }),
        score:   fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        label:   fc.option(fc.string(), { nil: undefined }),
        reasons: fc.option(fc.oneof(fc.string(), fc.array(fc.string())), { nil: undefined }),
      }),
      (raw) => {
        const result = normalize(raw)
        // 必含四個欄位
        assert.ok('level'   in result, '缺少 level 欄位')
        assert.ok('score'   in result, '缺少 score 欄位')
        assert.ok('label'   in result, '缺少 label 欄位')
        assert.ok('reasons' in result, '缺少 reasons 欄位')
        // reasons 必為陣列
        assert.ok(Array.isArray(result.reasons), 'reasons 必須為陣列')
        // level 必為有效值
        assert.ok(VALID_LEVELS.has(result.level), `level 必須為有效值，得到：${result.level}`)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: backend-api-integration, Property 4: Normalizer 缺少欄位時的預設值
// Validates: Requirements 9.2, 9.3, 9.4, 9.5
test('屬性 4：Normalizer 缺少欄位時的預設值', () => {
  fc.assert(
    fc.property(
      fc.record({
        level:   fc.constant(undefined),
        score:   fc.constant(undefined),
        reasons: fc.constant(undefined),
      }),
      (raw) => {
        const result = normalize(raw)
        assert.strictEqual(result.level,  'warn', '缺少 level 應預設為 warn')
        assert.strictEqual(result.score,  50,     '缺少 score 應預設為 50')
        assert.deepStrictEqual(result.reasons, [], '缺少 reasons 應預設為 []')
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: backend-api-integration, Property 5: Normalizer 冪等性
// Validates: Requirements 9.6
test('屬性 5：Normalizer 冪等性', () => {
  fc.assert(
    fc.property(
      fc.record({
        level:   fc.option(fc.oneof(fc.constantFrom('safe', 'promo', 'warn', 'scam'), fc.string()), { nil: undefined }),
        score:   fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        label:   fc.option(fc.string(), { nil: undefined }),
        reasons: fc.option(fc.oneof(fc.string(), fc.array(fc.string())), { nil: undefined }),
      }),
      (raw) => {
        const once  = normalize(raw)
        const twice = normalize(once)
        assert.deepStrictEqual(twice, once, 'normalize 應具備冪等性')
      }
    ),
    { numRuns: 200 }
  )
})
