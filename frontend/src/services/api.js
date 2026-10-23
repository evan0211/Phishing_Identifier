const API_BASE = import.meta.env.VITE_API_BASE
  ?? 'https://ohep7v33l0.execute-api.us-east-1.amazonaws.com/prod'

async function post(path, payload, signal) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    signal,
  })
  let data = await res.json()
  const status = Number(data?.statusCode ?? res.status)
  if (typeof data?.body === 'string') {
    try { data = JSON.parse(data.body) } catch {
      if (!res.ok || status >= 400) throw new Error(`HTTP ${status}`)
      throw new Error('Invalid API response')
    }
  }
  if (!res.ok || status >= 400) throw new Error(data?.error ?? data?.message ?? `HTTP ${status}`)
  return data
}

export function checkUrl(url) {
  return post('/api/check/url', { type: 'url', query: url })
}

// Phone analysis uses the Claude phone handler; the core model cannot verify numbers.
export function checkPhone(phone, countryCode = '+886', signal, lang = 'zh') {
  return post('/api/report', {
    type: 'llm', subtype: 'phone', query: normalizePhone(phone, countryCode), lang,
    context: { queryType: 'phone' },
  }, signal)
}

export function checkScreenshot(base64) {
  return post('/api/check/screenshot', { type: 'screenshot', query: base64 })
}

export function report(query, queryType) {
  return post('/api/report', { type: 'report', query, queryType })
}

export function getStats() {
  return post('/api/stats', { type: 'stats' })
}

export function getChartData() {
  return post('/api/report', { type: 'chart' })
}

// 取得統計資料並轉換成前端 periods 格式（含趨勢）
export async function getStatsPeriods() {
  const data = await getStats()

  // 今日數據（獨立小卡，不參與月份切換）
  const todayCards = [
    {
      icon: 'calendar', title: '今日詐騙案件數',
      current: `${data.todayCases?.toLocaleString()} 件`,
      currentRaw: data.todayCases, last: null, lastRaw: null, change: null, color: 'orange',
    },
    {
      icon: 'wallet', title: '今日損失金額',
      current: `${Math.round(data.todayLosses).toLocaleString()} 萬元`,
      currentRaw: data.todayLosses, last: null, lastRaw: null, change: null, color: 'red',
    },
    {
      icon: 'alert', title: '累計詐騙通報件數',
      current: `${Number(data.reportCount).toLocaleString()} 件`,
      currentRaw: Number(data.reportCount), last: null, lastRaw: null, change: null, color: 'blue',
    },
    {
      icon: 'trophy', title: '今日最常見詐騙手法',
      current: data.topFraud || '網路購物詐騙',
      currentRaw: null, last: null, lastRaw: null, change: null, color: 'orange',
    },
  ]

  // 本月英雄卡
  const makeHeroCards = (losses, lossesLast, lossesChange, cases, casesLast, casesChange) => [
    {
      icon: 'wallet',
      title: '本月財產損失金額（元）',
      current: `${Math.floor(Math.round(losses) / 10000)} 億 ${(Math.round(losses) % 10000).toLocaleString()} 萬`,
      currentRaw: losses,
      last: `${Math.floor(Math.round(lossesLast) / 10000)} 億 ${(Math.round(lossesLast) % 10000).toLocaleString()} 萬`,
      lastRaw: lossesLast,
      change: lossesChange,
      color: 'red',
    },
    {
      icon: 'shield',
      title: '本月案件受理數（件）',
      current: `${cases?.toLocaleString()}`,
      currentRaw: cases,
      last: `${casesLast?.toLocaleString()}`,
      lastRaw: casesLast,
      change: casesChange,
      color: 'orange',
    },
  ]

  return {
    raw: data,
    todayCards,
    periods: [
      {
        label: data.monthLabel || '最新月份',
        cards: [
          ...makeHeroCards(
            data.monthLosses, data.monthLossesLast, data.monthLossesChange,
            data.monthCases,  data.monthCasesLast,  data.monthCasesChange
          ),
        ],
      },
    ],
  }
}

// Preserve the entered phone number; do not infer a country or rewrite prefixes.
export function normalizePhone(query) {
  return query.trim()
}

export function autoCheck(query, type, countryCode = '+886', signal, lang = 'zh') {
  // 截圖：走原本 核心辨識模型 截圖分析
  if (type === 'image' || type === 'screenshot') return post('/api/check/screenshot', { type: 'screenshot', query, lang }, signal)

  // 電話只走 Claude phone handler；網址維持綜合辨識流程。
  if (type === 'phone') {
    return checkPhone(query, countryCode, signal, lang)
  }
  return post('/api/report', { type: 'llm', subtype: 'full', query, lang, context: { queryType: type === 'text' ? 'text' : 'url' } }, signal)
}

// ════════════════════════════════════════════
// LLM 分析功能（Bedrock Claude）
// ════════════════════════════════════════════

/**
 * LLM 文字分析（LINE/簡訊詐騙偵測）
 * @param {string} text - 要分析的文字內容
 */
export function analyzeLLMText(text) {
  return post('/api/report', { type: 'llm', subtype: 'full', query: text, context: { queryType: 'text' } })
}

/**
 * LLM 截圖分析增強（Claude Vision）
 * @param {string} base64 - base64 編碼的圖片（含 data:image/... 前綴）
 */
export function analyzeLLMImage(base64) {
  return post('/api/report', { type: 'llm', subtype: 'image', query: base64 })
}

/**
 * LLM 詐騙對策建議
 * @param {string} query - 查詢內容（網址或電話）
 * @param {object} context - 已知的詐騙資訊 { level, fraud_type, reasons }
 */
export function getLLMAdvice(query, context = {}) {
  return post('/api/report', { type: 'llm', subtype: 'advice', query, context })
}
