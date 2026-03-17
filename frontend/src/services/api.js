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
  return {
    raw: data,
    periods: [
      {
        label: '本月統計',
        cards: [
          {
            icon: '💸',
            title: '本月財產損失金額（元）',
            current: `${(data.monthLosses / 10000).toFixed(0)} 億 ${Math.round(data.monthLosses % 10000).toLocaleString()} 萬`,
            currentRaw: data.monthLosses,
            last: `${(data.monthLossesLast / 10000).toFixed(0)} 億 ${Math.round(data.monthLossesLast % 10000).toLocaleString()} 萬`,
            lastRaw: data.monthLossesLast,
            change: data.monthLossesChange,
            color: 'red',
          },
          {
            icon: '🎣',
            title: '本月案件受理數（件）',
            current: `${data.monthCases?.toLocaleString()}`,
            currentRaw: data.monthCases,
            last: `${data.monthCasesLast?.toLocaleString()}`,
            lastRaw: data.monthCasesLast,
            change: data.monthCasesChange,
            color: 'orange',
          },
          {
            icon: '📅',
            title: '今日詐騙案件數',
            current: `${data.todayCases?.toLocaleString()} 件`,
            currentRaw: data.todayCases,
            last: null,
            lastRaw: null,
            change: null,
            color: 'orange',
          },
          {
            icon: '💰',
            title: '今日損失金額',
            current: `${Math.round(data.todayLosses).toLocaleString()} 萬元`,
            currentRaw: data.todayLosses,
            last: null,
            lastRaw: null,
            change: null,
            color: 'red',
          },
          {
            icon: '🚨',
            title: '累計詐騙通報件數',
            current: `${Number(data.reportCount).toLocaleString()} 件`,
            currentRaw: Number(data.reportCount),
            last: null,
            lastRaw: null,
            change: null,
            color: 'blue',
          },
          {
            icon: '🏆',
            title: '今日最常見詐騙手法',
            current: data.topFraud || '網路購物詐騙',
            currentRaw: null,
            last: null,
            lastRaw: null,
            change: null,
            color: 'orange',
          },
        ],
      },
    ],
  }
}

export function autoCheck(query, type, countryCode = '+886') {
  if (type === 'phone') {
    const phone = query.startsWith('+') ? query : `${countryCode}${query.replace(/^0/, '')}`
    return checkPhone(phone)
  }
  if (type === 'image' || type === 'screenshot') return checkScreenshot(query)
  return checkUrl(query)
}
