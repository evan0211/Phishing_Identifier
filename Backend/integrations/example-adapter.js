/**
 * Example Adapter — 自訂 API 整合範本
 *
 * 使用方式：
 *   1. 複製此檔案，命名為 `{your-name}-adapter.js`
 *   2. 實作下方四個函式
 *   3. 在 .env 設定 API_PROVIDER={your-name}
 *
 * 所有函式必須回傳 Promise，解析值符合 RawResult 格式：
 *   { level?, score?, label?, reasons? }
 *
 * server.js 的 normalize() 會自動補齊缺少的欄位預設值。
 */

'use strict'

/**
 * 查詢網址風險
 * @param {string} query - 待查詢的網址
 * @returns {Promise<{level?: string, score?: number, label?: string, reasons?: string[]}>}
 */
async function checkUrl(query) {
  // TODO: 呼叫你的 API，回傳風險結果
  // 範例：
  // const res = await fetch(`https://your-api.com/check?url=${encodeURIComponent(query)}`)
  // const data = await res.json()
  // return { level: data.risk, score: data.score, label: data.summary, reasons: data.details }
  throw new Error('尚未實作 checkUrl')
}

/**
 * 查詢電話號碼風險
 * @param {string} query - 待查詢的電話號碼（已移除空白與連字號）
 * @returns {Promise<{level?: string, score?: number, label?: string, reasons?: string[]}>}
 */
async function checkPhone(query) {
  // TODO: 呼叫你的 API，回傳風險結果
  throw new Error('尚未實作 checkPhone')
}

/**
 * 查詢截圖風險
 * @param {string} query - 截圖的 base64 字串或文字描述
 * @returns {Promise<{level?: string, score?: number, label?: string, reasons?: string[]}>}
 */
async function checkScreenshot(query) {
  // TODO: 呼叫你的 API，回傳風險結果
  throw new Error('尚未實作 checkScreenshot')
}

/**
 * 回報詐騙案件
 * @param {string} query - 回報內容
 * @returns {Promise<{ok: boolean, caseNo: string}>}
 */
async function report(query) {
  // TODO: 呼叫你的 API 回報案件，或產生本地案件編號
  // 範例（本地產生）：
  // const caseNo = 'MY-' + Date.now().toString(36).toUpperCase()
  // return { ok: true, caseNo }
  throw new Error('尚未實作 report')
}

module.exports = {
  name: 'example',   // 對應 .env 的 API_PROVIDER 值
  checkUrl,
  checkPhone,
  checkScreenshot,
  report,
}
