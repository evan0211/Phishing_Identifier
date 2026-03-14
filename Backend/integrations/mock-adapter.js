/**
 * Mock Adapter — 假資料提供者
 * 在沒有真實 API 時作為 fallback 使用
 */

// 根據 query 內容判斷風險等級（簡單關鍵字比對）
function guessLevel(query) {
  const q = (query || '').toLowerCase()
  if (q.includes('scam') || q.includes('詐騙') || q.includes('phish')) return 'scam'
  if (q.includes('warn') || q.includes('警告') || q.includes('suspicious')) return 'warn'
  if (q.includes('promo') || q.includes('廣告') || q.includes('ad')) return 'promo'
  return 'safe'
}

const LEVEL_META = {
  safe:  { score: 5,  label: '安全',     reasons: ['此網址未發現詐騙紀錄', '域名信譽良好'] },
  promo: { score: 30, label: '廣告/促銷', reasons: ['此號碼可能為行銷電話', '非詐騙但建議謹慎'] },
  warn:  { score: 65, label: '可疑',     reasons: ['此內容有可疑特徵', '建議進一步確認'] },
  scam:  { score: 95, label: '高風險詐騙', reasons: ['已被多人回報為詐騙', '請勿點擊或回撥'] },
}

async function checkUrl(query) {
  const level = guessLevel(query)
  return { level, ...LEVEL_META[level] }
}

async function checkPhone(query) {
  const level = guessLevel(query)
  return { level, ...LEVEL_META[level] }
}

async function checkScreenshot(query) {
  // 依 query 內容判斷風險等級（與 checkUrl 邏輯一致）
  const level = guessLevel(query)
  return { level, ...LEVEL_META[level] }
}

async function report(query) {
  // 產生唯一案件編號：timestamp + 隨機後綴，確保連續呼叫不重複
  const ts     = Date.now().toString(36).toUpperCase()
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase()
  const caseNo = `MOCK-${ts}-${rand}`
  return { ok: true, caseNo }
}

module.exports = { checkUrl, checkPhone, checkScreenshot, report, name: 'mock' }
