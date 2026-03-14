/**
 * Server 單元測試
 * Feature: backend-api-integration
 */
'use strict'

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http   = require('http')
const path   = require('path')
const fs     = require('fs')

// ─── 輔助函式：發送 HTTP 請求 ───────────────────
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ─── 啟動 server（設定 mock 模式）────────────────
before(async () => {
  // 設定環境變數為 mock 模式
  process.env.API_PROVIDER = 'mock'
  delete process.env.API_KEY
  // 清除 require 快取以重新載入
  Object.keys(require.cache).forEach(k => {
    if (k.includes('server.js') || k.includes('mock-adapter') || k.includes('hackathon-adapter')) {
      delete require.cache[k]
    }
  })
  // 啟動 server
  require('../server.js')
  // 等待 server 就緒
  await new Promise(r => setTimeout(r, 200))
})

after(async () => {
  // 關閉 server，避免 port 佔用
  const { server } = require('../server.js')
  await new Promise(r => server.close(r))
})

// ─── 健康檢查端點 ─────────────────────────────
// Validates: Requirements 7.1, 7.2
test('GET /api/health 回傳正確格式（mock 模式）', async () => {
  const res = await request('GET', '/api/health', null)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.ok, true, 'ok 應為 true')
  assert.strictEqual(typeof res.body.provider, 'string', 'provider 應為字串')
  assert.strictEqual(res.body.mock, true, 'mock 模式下 mock 應為 true')
})

// ─── 空 query 回傳 400 ────────────────────────
// Validates: Requirements 3.3, 4.3, 6.4
test('POST /api/check/url 空 query 回傳 400', async () => {
  const res = await request('POST', '/api/check/url', { query: '' })
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.body.error, 'query 不得為空')
})

test('POST /api/check/phone 空 query 回傳 400', async () => {
  const res = await request('POST', '/api/check/phone', { query: '' })
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.body.error, 'query 不得為空')
})

test('POST /api/report 空 query 回傳 400', async () => {
  const res = await request('POST', '/api/report', { query: '' })
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.body.error, 'query 不得為空')
})

// ─── 回報端點回應格式 ─────────────────────────
// Validates: Requirements 6.2
test('POST /api/report 成功時回傳 { ok: true, caseNo: <非空字串> }', async () => {
  const res = await request('POST', '/api/report', { query: '測試回報內容' })
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.ok, true)
  assert.strictEqual(typeof res.body.caseNo, 'string')
  assert.ok(res.body.caseNo.length > 0, 'caseNo 不得為空')
})

// ─── 環境設定邊界情況 ─────────────────────────
// Validates: Requirements 2.4
test('.env.example 存在且包含三個必要變數', () => {
  const envExamplePath = path.join(__dirname, '../.env.example')
  assert.ok(fs.existsSync(envExamplePath), '.env.example 應存在')
  const content = fs.readFileSync(envExamplePath, 'utf8')
  assert.ok(content.includes('API_PROVIDER'), '.env.example 應包含 API_PROVIDER')
  assert.ok(content.includes('API_BASE_URL'), '.env.example 應包含 API_BASE_URL')
  assert.ok(content.includes('API_KEY'),      '.env.example 應包含 API_KEY')
})

// ─── 正常查詢回傳標準格式 ─────────────────────
// Validates: Requirements 3.1, 3.2
test('POST /api/check/url 正常查詢回傳標準格式', async () => {
  const res = await request('POST', '/api/check/url', { query: 'https://example.com' })
  assert.strictEqual(res.status, 200)
  const VALID_LEVELS = new Set(['safe', 'promo', 'warn', 'scam'])
  assert.ok(VALID_LEVELS.has(res.body.level), `level 應為有效值，得到：${res.body.level}`)
  assert.strictEqual(typeof res.body.score,   'number', 'score 應為數字')
  assert.strictEqual(typeof res.body.label,   'string', 'label 應為字串')
  assert.ok(Array.isArray(res.body.reasons),  'reasons 應為陣列')
})
