/**
 * Hackathon Adapter — AWS Hackathon 2026 詐騙識別防範 API
 * Base URL: https://hljaj2f6gf.execute-api.ap-northeast-1.amazonaws.com/prod
 * 需要在 .env 設定 API_KEY
 */
const https = require('https')

const BASE_URL = process.env.API_BASE_URL || 'https://hljaj2f6gf.execute-api.ap-northeast-1.amazonaws.com/prod'
const API_KEY  = process.env.API_KEY || ''

/** 發送 HTTPS 請求的通用函式 */
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url     = new URL(BASE_URL + path)
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      port:     443,
      path:     url.pathname + url.search,
      method,
      headers: {
        'x-api-key':       API_KEY,
        'Content-Type':    'application/json',
        'User-Agent':      'PostmanRuntime/7.43.0',
        'Accept':          '*/*',
        'Accept-Language': 'zh-TW',
        'Connection':      'keep-alive',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { reject(new Error('回應解析失敗：' + data)) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

/** 將 hackathon API 回應轉換為標準格式 { level, score, label, reasons } */
function normalize(raw) {
  let level, score

  // ── 截圖結果（content-check 輪詢回傳）──
  // category: SCAM / HIGH_RISK / MEDIUM_RISK / LOW_RISK / NO_RISK_FOR_NOW / SAFE
  if (raw.category) {
    const cat = raw.category.toUpperCase()
    if      (cat === 'SCAM' || cat === 'HIGH_RISK')   { level = 'scam';  score = 90 }
    else if (cat === 'MEDIUM_RISK')                    { level = 'warn';  score = 65 }
    else if (cat === 'LOW_RISK')                       { level = 'promo'; score = 35 }
    else                                               { level = 'safe';  score = 10 }
    // urls 裡若有 SCAM 等級則升級
    if (Array.isArray(raw.urls)) {
      const hasScamUrl = raw.urls.some(u => u.level === 'SCAM' || u.level === 'HIGH_RISK')
      if (hasScamUrl && level === 'safe') { level = 'warn'; score = 60 }
    }
  }
  // ── url-check / number-check 回傳 ──
  // attributes.score: 0-100（越高越安全）
  // attributes.block_indicator: true = 確定詐騙
  else {
    const attrs    = raw.attributes || {}
    // 優先用 attributes.score，其次頂層 score
    const apiScore = attrs.score ?? raw.score ?? raw.risk_score ?? null

    if (raw.level && ['safe','promo','warn','scam'].includes(raw.level)) {
      level = raw.level
    } else if (attrs.block_indicator === true) {
      level = 'scam'
    } else if (apiScore !== null) {
      // score 越高越安全（0=危險，100=安全）
      if      (apiScore >= 80) level = 'safe'
      else if (apiScore >= 50) level = 'promo'
      else if (apiScore >= 20) level = 'warn'
      else                     level = 'scam'
    } else {
      throw new Error('API 回傳資料不含可判斷風險的欄位，無法評估')
    }
    score = Math.round(100 - apiScore)
  }

  // 標籤：截圖用 title，url-check 用 host，其他用 label/summary
  const host  = raw.identifier?.host
  const label = raw.title || raw.label || raw.summary || raw.description || (host ? `${host} 查詢完成` : '查詢完成')

  // 原因：截圖用 content[]，url-check 用 antiphishing/tags，其他用 reasons
  let reasons = []
  if (Array.isArray(raw.content) && raw.content.length > 0) {
    reasons = raw.content
  } else if (Array.isArray(raw.reasons) && raw.reasons.length > 0) {
    reasons = raw.reasons
  } else if (raw.antiphishing && Array.isArray(raw.antiphishing.brands) && raw.antiphishing.brands.length > 0) {
    reasons = raw.antiphishing.brands.map(b => `疑似仿冒品牌：${b.name}`)
  } else if (raw.tags && Array.isArray(raw.tags.tags) && raw.tags.tags.length > 0) {
    reasons = raw.tags.tags.map(t => t.name || t).filter(Boolean)
  }
  if (raw.kindly_reminder) reasons = [...reasons, raw.kindly_reminder]

  return { level, score, label, reasons }
}

/** 專門處理 number-check 回應格式
 *  { data: { name, spam_category, business_categories, region }, query_id }
 */
function normalizePhone(raw) {
  const d = raw.data || {}
  const spam = d.spam_category

  let level, score, label, reasons = []

  if (spam) {
    // 有 spam_category 代表被標記為詐騙/騷擾
    const s = spam.toUpperCase()
    if (s.includes('SCAM') || s.includes('FRAUD') || s.includes('詐騙')) {
      level = 'scam'; score = 88
    } else {
      level = 'warn'; score = 60
    }
    label   = `${d.name || '未知號碼'} — ${spam}`
    reasons = [`被標記為：${spam}`]
    if (d.name) reasons.push(`來電顯示名稱：${d.name}`)
  } else if (d.name) {
    // 有名稱但無 spam，可能是正常企業號碼
    level   = 'safe'; score = 10
    label   = d.name
    reasons = [`已知號碼：${d.name}`]
    if (d.business_categories) reasons.push(`類別：${d.business_categories}`)
    if (d.region) reasons.push(`地區：${d.region}`)
  } else {
    // 完全查無資料
    level   = 'warn'; score = 45
    label   = '查無此號碼資料'
    reasons = ['此號碼無公開紀錄，請謹慎接聽']
  }

  return { level, score, label, reasons }
}

/** POST /url-check — 網址風險查詢 */
async function checkUrl(query) {
  const res = await request('POST', '/url-check', { url: query })
  return normalize(res.body)
}

/** GET /number-check/{country}/{number} — 電話號碼查詢
 *  country: ISO 3166-1 alpha-2（如 TW）
 *  number: E.164 格式（如 +886976589009），URL encode 後傳入
 */
async function checkPhone(query) {
  // 解析國碼與號碼
  let number  = query.replace(/[-\s]/g, '')
  let country = 'TW'

  if (number.startsWith('+886')) {
    country = 'TW'; number = '+886' + number.slice(4)
  } else if (number.startsWith('886')) {
    country = 'TW'; number = '+886' + number.slice(3)
  } else if (number.startsWith('+86')) {
    country = 'CN'; number = '+86' + number.slice(3)
  } else if (number.startsWith('+1')) {
    country = 'US'
  } else if (number.startsWith('0')) {
    // 台灣本地格式，補 +886
    country = 'TW'; number = '+886' + number.slice(1)
  }

  // E.164 格式需 URL encode（+ → %2B）
  const encodedNumber = encodeURIComponent(number)
  const res = await request('GET', `/number-check/${country}/${encodedNumber}`, null)
  return normalizePhone(res.body)
}

/** POST /content-check — 截圖風險查詢（非同步，需輪詢）
 *  格式：{ region: 'tw', image: '<純 base64，不含 data: 前綴>' }
 *  status: 0=pending, 1=in-progress, 2=failed, 3=success
 */
async function checkScreenshot(query) {
  // API 需要完整的 data URL（含 data:image/...;base64, 前綴）
  // 若前端已帶前綴則直接用，否則補上 jpeg 前綴
  const image = query.startsWith('data:') ? query : `data:image/jpeg;base64,${query}`

  // 送出任務（region 用大寫 TW）
  const submit = await request('POST', '/content-check', { region: 'TW', image })
  if (submit.status !== 200 && submit.status !== 202) {
    throw new Error(`content-check 送出失敗：HTTP ${submit.status} ${JSON.stringify(submit.body)}`)
  }

  const jobId = submit.body.job_id || submit.body.jobId || submit.body.id
  // 若直接回傳結果（無 job_id）
  if (!jobId) return normalize(submit.body)

  // 輪詢，最多等 60 秒（每 3 秒一次，共 20 次）
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await request('GET', `/content-check/${jobId}`, null)
    const s = poll.body.status

    // status: 3=success
    if (s === 3 || s === 'success' || s === 'done' || s === 'completed') {
      return normalize(poll.body)
    }
    // status: 2=failed
    if (s === 2 || s === 'failed') {
      throw new Error(`截圖分析失敗：${poll.body.message || poll.body.title || '上游服務錯誤'}`)
    }
    // status: 0=pending, 1=in-progress → 繼續等待
  }
  throw new Error('截圖查詢逾時（超過 60 秒）')
}

/** 回報功能（hackathon API 未提供，使用 mock） */
async function report(query) {
  const caseNo = 'HC-' + Date.now().toString(36).toUpperCase()
  return { ok: true, caseNo }
}

module.exports = { checkUrl, checkPhone, checkScreenshot, report, name: 'hackathon' }
