/**
 * 防詐雷達 API Server
 * 執行：node server.js
 * Port：3001
 */
const http = require('http')
const path = require('path')
const fs   = require('fs')

// ─── 載入 .env（若存在）───────────────────────
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      // 去除行首空白後，跳過空行與純註解行
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 1) return
      const k = trimmed.slice(0, eqIdx).trim()
      const v = trimmed.slice(eqIdx + 1).trim()
      if (k) process.env[k] = v
    })
}

// ─── 載入 Adapter ─────────────────────────────
// 只允許已知的 adapter 名稱，防止路徑注入
const ALLOWED_PROVIDERS = new Set(['mock', 'hackathon', 'example'])
const PROVIDER = (process.env.API_PROVIDER || 'mock').toLowerCase()

let adapter
if (!ALLOWED_PROVIDERS.has(PROVIDER)) {
  console.warn(`⚠️  不允許的 API_PROVIDER "${PROVIDER}"，改用 mock`)
  adapter = require('./integrations/mock-adapter.js')
} else {
  try {
    adapter = require(`./integrations/${PROVIDER}-adapter.js`)
    console.log(`✅ 使用 Adapter：${adapter.name || PROVIDER}`)
  } catch (e) {
    console.warn(`⚠️  找不到 Adapter "${PROVIDER}"，改用 mock`)
    adapter = require('./integrations/mock-adapter.js')
  }
}

// 警告：使用真實 API 但未設定 API Key
if (PROVIDER !== 'mock' && !process.env.API_KEY) {
  console.warn('⚠️  警告：API_PROVIDER 不為 mock，但 API_KEY 未設定')
}

const isMock = adapter.name === 'mock'

// ─── Normalizer（確保回傳欄位合法）──────────────
const VALID_LEVELS = new Set(['safe', 'promo', 'warn', 'scam'])

function normalize(raw) {
  const level   = VALID_LEVELS.has(raw.level) ? raw.level : 'warn'
  const score   = raw.score   != null ? raw.score   : 50
  const label   = raw.label   || '查詢完成'
  const reasons = Array.isArray(raw.reasons) ? raw.reasons : (raw.reasons ? [raw.reasons] : [])
  return { level, score, label, reasons }
}

// ─── 解析 POST body（限制 10MB，防止超大 payload）─────
const MAX_BODY = 10 * 1024 * 1024 // 10MB（截圖 base64 約 1-3MB）
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '', size = 0
    req.on('data', c => {
      size += c.length
      if (size > MAX_BODY) { req.destroy(); return reject(new Error('請求內容過大')) }
      body += c
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) }
      catch (e) { reject(new Error('JSON 解析失敗')) }
    })
  })
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ─── CORS 允許來源（只允許本地開發）────────────
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
])

// ─── Rate Limiting（每 IP 每分鐘最多 30 次）────
const RATE_LIMIT = 30
const RATE_WINDOW = 60 * 1000 // 1 分鐘
const ratemap = new Map() // ip → { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now()
  let entry = ratemap.get(ip)
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_WINDOW }
    ratemap.set(ip, entry)
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

// 定期清理過期紀錄（每 5 分鐘）
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ratemap) {
    if (now > entry.resetAt) ratemap.delete(ip)
  }
}, 5 * 60 * 1000)

// ─── HTTP Server ──────────────────────────────
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ''
  // 允許的來源才設 CORS，否則不帶 Allow-Origin header
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  // 安全 headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Rate limiting（OPTIONS 不計入）
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return json(res, 429, { error: '請求過於頻繁，請稍後再試' })
  }

  const { method, url } = req

  // 健康檢查
  if (method === 'GET' && url === '/api/health') {
    return json(res, 200, { ok: true, provider: adapter.name || PROVIDER, mock: isMock })
  }

  // 詐騙統計資料（來源：165打詐儀表板 165dashboard.tw，擷取於 2026-03-15）
  if (method === 'GET' && url === '/api/stats') {
    return json(res, 200, {
      updatedAt: '2026-03-15',
      source: '165打詐儀表板 165dashboard.tw',
      periods: [
        {
          label: '115年2月',
          stats: [
            { icon: '💸', num: '46.4 億元', label: '詐騙財產損失金額',          source: '165打詐儀表板 115/02', pct: 88, color: 'red'    },
            { icon: '🎣', num: '7,792 件',  label: '詐騙案件受理數',            source: '165打詐儀表板 115/02', pct: 55, color: 'orange' },
            { icon: '🛒', num: '2,142 件',  label: '網路購物詐騙（當月第1名）',  source: '165打詐儀表板 115/02', pct: 42, color: 'orange' },
            { icon: '📈', num: '20.7 億元', label: '假投資詐騙財損（當月第2名）', source: '165打詐儀表板 115/02', pct: 80, color: 'red'    },
            { icon: '💑', num: '732 件',    label: '假交友投資詐騙（當月第3名）', source: '165打詐儀表板 115/02', pct: 28, color: 'orange' },
            { icon: '🎣', num: '497 件',    label: '釣魚連結詐騙（當月第4名）',  source: '165打詐儀表板 115/02', pct: 19, color: 'blue'   }
          ]
        },
        {
          label: '115年1月',
          stats: [
            { icon: '💸', num: '70.1 億元', label: '詐騙財產損失金額',          source: '165打詐儀表板 115/01', pct: 100, color: 'red'   },
            { icon: '🎣', num: '14,301 件', label: '詐騙案件受理數',            source: '165打詐儀表板 115/01', pct: 100, color: 'orange' },
            { icon: '🚔', num: '254 團',    label: '查獲詐騙集團數',            source: '165打詐儀表板 115/01', pct: 62,  color: 'blue'   },
            { icon: '👥', num: '2,132 人',  label: '查獲詐騙嫌疑人數',          source: '165打詐儀表板 115/01', pct: 55,  color: 'blue'   },
            { icon: '🛡️', num: '11.4 億元', label: '攔阻詐騙金額',             source: '165打詐儀表板 115/01', pct: 45,  color: 'blue'   },
            { icon: '🌐', num: '25,077 件', label: '涉嫌詐騙網站已阻斷',        source: '165打詐儀表板 115/01', pct: 70,  color: 'red'    }
          ]
        }
      ]
    })
  }

  if (method !== 'POST') { res.writeHead(404); res.end(); return }

  let body
  try { body = await readBody(req) }
  catch (e) { return json(res, 400, { error: 'JSON 格式錯誤' }) }

  const { query } = body

  // ── POST /api/check/url ──
  if (url === '/api/check/url') {
    if (!query) return json(res, 400, { error: 'query 不得為空' })
    if (typeof query !== 'string' || query.length > 2048)
      return json(res, 400, { error: 'query 格式錯誤或過長' })
    try {
      const result = normalize(await adapter.checkUrl(query))
      return json(res, 200, result)
    } catch (err) {
      return json(res, 502, { error: `查詢失敗：${err.message}` })
    }
  }

  // ── POST /api/check/phone ──
  if (url === '/api/check/phone') {
    if (!query) return json(res, 400, { error: 'query 不得為空' })
    if (typeof query !== 'string' || query.length > 30)
      return json(res, 400, { error: 'query 格式錯誤或過長' })
    // 只允許數字、+、空白、-、()
    if (!/^[\d\s\-+()]+$/.test(query.trim()))
      return json(res, 400, { error: '電話號碼格式不正確' })
    const cleaned = query.replace(/[-\s]/g, '')
    try {
      const result = normalize(await adapter.checkPhone(cleaned))
      return json(res, 200, result)
    } catch (err) {
      return json(res, 502, { error: `查詢失敗：${err.message}` })
    }
  }

  // ── POST /api/check/screenshot ──
  if (url === '/api/check/screenshot') {
    if (!query) return json(res, 400, { error: 'query 不得為空' })
    if (typeof query !== 'string') return json(res, 400, { error: 'query 格式錯誤' })
    // 長度限制：base64 截圖約 1-3MB，上限設 15MB（base64 字元數）
    const MAX_SCREENSHOT = 15 * 1024 * 1024
    if (query.length > MAX_SCREENSHOT) return json(res, 400, { error: '截圖檔案過大（上限 15MB）' })
    // 必須是合法的 data URL 格式（只驗前綴，不驗整個 base64）
    if (!/^data:image\/(jpeg|png|gif|webp);base64,/.test(query))
      return json(res, 400, { error: '截圖格式不正確，僅支援 JPEG/PNG/GIF/WebP' })
    try {
      const result = normalize(await adapter.checkScreenshot(query))
      return json(res, 200, result)
    } catch (err) {
      return json(res, 502, { error: `查詢失敗：${err.message}` })
    }
  }

  // ── POST /api/report ──
  if (url === '/api/report') {
    if (!query) return json(res, 400, { error: 'query 不得為空' })
    if (typeof query !== 'string') return json(res, 400, { error: 'query 格式錯誤' })
    if (query.length > 2048) return json(res, 400, { error: 'query 過長（上限 2048 字元）' })
    try {
      const result = await adapter.report(query)
      return json(res, 200, { ok: true, caseNo: result.caseNo || null })
    } catch (err) {
      console.error('❌ 回報失敗：', err.message)
      return json(res, 200, { ok: false, caseNo: null })
    }
  }

  res.writeHead(404); res.end()
})

server.listen(3001, () => {
  console.log('🚀 防詐雷達 API Server → http://localhost:3001')
  console.log(`   Provider: ${adapter.name || PROVIDER} | Mock: ${isMock}`)
})

module.exports = { server }
