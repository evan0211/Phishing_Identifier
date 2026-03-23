/**
 * 防詐雷達 — API Service
 * 每個請求帶上 type 欄位，Lambda 靠 type 判斷路由
 */

const API_BASE = import.meta.env.VITE_API_BASE
  ?? 'https://l2y5p95avj.execute-api.ap-east-2.amazonaws.com/prod'

async function post(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  const data = await res.json()
  if (data?.body && typeof data.body === 'string') {
    try { return JSON.parse(data.body) } catch {}
  }
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
  return data
}

export function checkUrl(url) {
  return post('/api/check/url', { type: 'url', query: url })
}

export function checkPhone(phone) {
  return post('/api/check/phone', { type: 'phone', query: phone })
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
      icon: '📅', title: '今日詐騙案件數',
      current: `${data.todayCases?.toLocaleString()} 件`,
      currentRaw: data.todayCases, last: null, lastRaw: null, change: null, color: 'orange',
    },
    {
      icon: '💰', title: '今日損失金額',
      current: `${Math.round(data.todayLosses).toLocaleString()} 萬元`,
      currentRaw: data.todayLosses, last: null, lastRaw: null, change: null, color: 'red',
    },
    {
      icon: '🚨', title: '累計詐騙通報件數',
      current: `${Number(data.reportCount).toLocaleString()} 件`,
      currentRaw: Number(data.reportCount), last: null, lastRaw: null, change: null, color: 'blue',
    },
    {
      icon: '🏆', title: '今日最常見詐騙手法',
      current: data.topFraud || '網路購物詐騙',
      currentRaw: null, last: null, lastRaw: null, change: null, color: 'orange',
    },
  ]

  // 本月英雄卡
  const makeHeroCards = (losses, lossesLast, lossesChange, cases, casesLast, casesChange) => [
    {
      icon: '💸',
      title: '本月財產損失金額（元）',
      current: `${(losses / 10000).toFixed(0)} 億 ${Math.round(losses % 10000).toLocaleString()} 萬`,
      currentRaw: losses,
      last: `${(lossesLast / 10000).toFixed(0)} 億 ${Math.round(lossesLast % 10000).toLocaleString()} 萬`,
      lastRaw: lossesLast,
      change: lossesChange,
      color: 'red',
    },
    {
      icon: '🎣',
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
        label: '114年9月',
        cards: makeHeroCards(72300, 65000, 11.2, 14800, 13500, 9.6),
      },
      {
        label: '114年10月',
        cards: makeHeroCards(68900, 72300, -4.7, 14100, 14800, -4.7),
      },
      {
        label: '114年11月',
        cards: makeHeroCards(75100, 68900, 9.0, 15200, 14100, 7.8),
      },
      {
        label: '114年12月',
        cards: makeHeroCards(80234, 75100, 6.8, 16820, 15200, 10.7),
      },
      {
        label: '115年1月',
        cards: makeHeroCards(70558, 80234, -12.1, 14301, 16820, -15.0),
      },
      {
        label: '115年2月',
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

export function autoCheck(query, type, countryCode = '+886') {
  // 截圖：走原本 Gogolook 截圖分析
  if (type === 'image' || type === 'screenshot') return checkScreenshot(query)

  // 電話/網址：走 LLM full analyze（含快取 + Gogolook + AI 加權）
  if (type === 'phone') {
    const phone = query.startsWith('+') ? query : `${countryCode}${query.replace(/^0/, '')}`
    return post('/api/report', { type: 'llm', subtype: 'phone', query: phone })
  }
  return post('/api/report', { type: 'llm', subtype: 'full', query, context: { queryType: 'url' } })
}

// ════════════════════════════════════════════
// LLM 分析功能（Bedrock Claude）
// ════════════════════════════════════════════

/**
 * LLM 文字分析（LINE/簡訊詐騙偵測）
 * @param {string} text - 要分析的文字內容
 */
export function analyzeLLMText(text) {
  return post('/api/report', { type: 'llm', subtype: 'full', query: text, context: { queryType: 'url' } })
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
