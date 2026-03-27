import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
// import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { createHash } from 'crypto'

const BASE_URL = 'https://hljaj2f6gf.execute-api.ap-northeast-1.amazonaws.com/prod'
const API_KEY  = process.env.GOGOLOOK_API_KEY
const TABLE    = 'AWS_ToF-Cache'
const TTL_SEC  = 72 * 60 * 60  // 72 小時

const dynamo = new DynamoDBClient({})

// Bedrock 使用跨區域推理設定檔（ap-east-2）
// const bedrock = new BedrockRuntimeClient({ region: 'ap-east-2' })
// const BEDROCK_MODEL = 'arn:aws:bedrock:ap-east-2:688525135640:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0'

function hashKey(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function resp(statusCode, body) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) }
}

/* ── DynamoDB 快取 ── */
async function cacheGet(key) {
  try {
    const res = await dynamo.send(new GetItemCommand({
      TableName: TABLE,
      Key: { cacheKey: { S: key } },
    }))
    if (!res.Item) return null
    return JSON.parse(res.Item.data.S)
  } catch (e) {
    console.warn('[Cache GET error]', e.message)
    return null
  }
}

async function cacheSet(key, data) {
  try {
    await dynamo.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        cacheKey: { S: key },
        data:     { S: JSON.stringify(data) },
        expireAt: { N: String(Math.floor(Date.now() / 1000) + TTL_SEC) },
      },
    }))
  } catch (e) {
    console.warn('[Cache SET error]', e.message)
  }
}

async function gFetch(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'x-api-key':       API_KEY,
      'Content-Type':    'application/json',
      'Accept-Language': 'zh-TW',
      ...(options.headers ?? {}),
    },
  })
}

/* ════════════════════════════════════════════
   1. URL 查詢
   ════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   LINE 連結偵測
   符合條件 → 強制 ggl level = 'promo'，AI 決定子等級
   ════════════════════════════════════════════ */
const LINE_DOMAINS = [
  'line.me', 'lin.ee', 'liff.line.me',
  'line.naver.jp', 'lineapp.com',
]

function isLineUrl(url) {
  try {
    const hostname = new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`
    ).hostname.toLowerCase().replace(/^www\./, '')
    return LINE_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch { return false }
}

async function checkUrl(url) {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
  const cacheKey = `url#${target.toLowerCase()}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    console.log('[CACHE_HIT]', cacheKey)
    return cached
  }

  let res = await gFetch('/url-check-cache', {
    method: 'POST',
    body:   JSON.stringify({ url: target }),
  })
  if (res.status === 404 || res.status === 503) {
    res = await gFetch('/url-check', {
      method: 'POST',
      body:   JSON.stringify({ url: target }),
    })
  }
  if (res.status === 404) {
    return {
      level:   'warn',
      score:   60,
      label:   '無法查詢此網域，請謹慎',
      reasons: ['此網域不在資料庫中，或已列入封鎖清單'],
    }
  }
  const raw = await res.json()
  const result = normalizeUrl(raw)

  await cacheSet(cacheKey, result)
  return result
}

function normalizeUrl(raw) {
  const trust = raw?.score ?? raw?.attributes?.score ?? raw?.primarydomain?.score ?? null
  const score = trust !== null ? Math.round(100 - trust) : 50

  let level
  if      (score >= 80) level = 'scam'
  else if (score >= 50) level = 'warn'
  else if (score >= 20) level = 'promo'
  else                  level = 'safe'

  const reasons = []
  if (trust !== null)
    reasons.push(`ScamAdviser 信任分數：${trust} / 100`)
  if (raw?.blacklisted)
    reasons.push('此網域已被列入詐騙封鎖清單')
  if (raw?.whois?.registration_created)
    reasons.push(`網域註冊日期：${raw.whois.registration_created}`)
  if (raw?.whois?.registrant?.country)
    reasons.push(`網域註冊國家：${raw.whois.registrant.country}`)
  if (raw?.ssl?.valid === false)
    reasons.push('無有效 SSL 憑證')
  if (raw?.popularity?.rank && raw.popularity.rank <= 10000)
    reasons.push(`全球流量排名：第 ${raw.popularity.rank} 名`)
  const tagNames = raw?.tags?.tags?.map(t => t.name).filter(Boolean) ?? []
  if (tagNames.length > 0)
    reasons.push(`標籤：${tagNames.slice(0, 3).join('、')}`)
  if (reasons.length === 0)
    reasons.push('已完成網域信譽掃描')

  return { level, score, label: levelToLabel(level), reasons }
}

/* ════════════════════════════════════════════
   2. 電話查詢
   ════════════════════════════════════════════ */
async function checkPhone(query) {
  const { country, number } = parsePhone(query)
  const cacheKey = `phone#${hashKey(number)}`

  const cached = await cacheGet(cacheKey)
  if (cached) {
    console.log('[CACHE_HIT]', cacheKey)
    return cached
  }

  const res = await gFetch(`/number-check/${country}/${encodeURIComponent(number)}`)
  if (res.status === 429) throw new Error('查詢頻率過高，請稍後再試')
  if (!res.ok) {
    return {
      level:   'warn',
      score:   50,
      label:   '查無此號碼資訊',
      reasons: ['無法取得此號碼的詳細資訊，請謹慎接聽'],
    }
  }
  const result = normalizePhone(await res.json())

  await cacheSet(cacheKey, result)
  return result
}

function parsePhone(query) {
  const cleaned = query.replace(/[\s\-\(\)]/g, '')
  const map = [
    ['+886', 'TW'], ['+852', 'HK'], ['+853', 'MO'],
    ['+86',  'CN'], ['+81',  'JP'], ['+82',  'KR'],
    ['+65',  'SG'], ['+60',  'MY'], ['+66',  'TH'],
    ['+1',   'US'],
  ]
  for (const [prefix, country] of map) {
    if (cleaned.startsWith(prefix)) return { country, number: cleaned }
  }
  const number = cleaned.startsWith('0')
    ? `+886${cleaned.slice(1)}`
    : `+886${cleaned}`
  return { country: 'TW', number }
}

function normalizePhone(raw) {
  const data    = raw?.data ?? {}
  const reasons = []
  let level, score

  if (data.spam_category) {
    level = 'scam'
    score = 90
    reasons.push(`詐騙標記類型：${data.spam_category}`)
    reasons.push('此號碼已被多名使用者回報為可疑電話')
  } else if (data.name) {
    level = 'safe'
    score = 5
    reasons.push(`已知號碼：${data.name}`)
    if (data.business_categories?.length)
      reasons.push(`分類：${data.business_categories.join('、')}`)
    if (data.region)
      reasons.push(`地區：${data.region}`)
  } else {
    level = 'unknown'
    score = null  // ★ 查無資料，不給預設分數
    reasons.push('此號碼在資料庫中無詳細資訊')
    reasons.push('目前無法判斷風險，請謹慎接聽')
  }

  return { level, score, label: levelToLabel(level), reasons }
}

/* ════════════════════════════════════════════
   3. 截圖分析（不快取）
   ════════════════════════════════════════════ */
async function checkScreenshot(imageBase64, locale = 'zh') {
  // Gogolook 和 Claude Vision 並行分析，加快速度
  const [gglResult, aiResult] = await Promise.allSettled([
    // 1. Gogolook 截圖分析
    (async () => {
      const uploadRes = await gFetch('/content-check', {
        method: 'POST',
        body:   JSON.stringify({ region: 'TW', image: imageBase64 }),
      })
      if (!uploadRes.ok) throw new Error(`截圖上傳失敗 (${uploadRes.status})`)
      const { job_id } = await uploadRes.json()
      if (!job_id) throw new Error('未取得 job_id')
      const result = await pollJob(job_id)
      return normalizeScreenshot(result)
    })(),

    // 2. Claude Vision 分析
    (async () => {
      const isEn = locale === 'en'
      const FRAUD_TYPES = isEn
        ? 'Fake bank/financial institution, Investment scam, Romance scam, Fake government agency, Online shopping scam, Phishing site, Fake lottery, Fake customer service, Fake e-commerce platform, Personal data theft'
        : '假冒銀行/金融機構、假投資詐騙、假交友/感情詐騙、假冒政府機關、網路購物詐騙、釣魚網站、假中獎通知、假客服詐騙、假冒電商平台、個資竊取'
      const system = isEn
        ? `You are a Taiwan anti-scam visual analysis expert specializing in identifying scam screenshots.
Key indicators: brand impersonation, fake domains, abnormal discounts, unauthorized celebrity endorsements, countdown pressure, phishing forms, fake government notices, fake investment ads.
Choose fraud_type from: ${FRAUD_TYPES}
Output ONLY pure JSON: {"score":integer 0-100,"fraud_type":"null if safe, otherwise specific type","detected_elements":["suspicious elements"],"suggestion":"one-sentence tip for user","reasoning":"2-3 sentence basis"}`
        : `你是台灣反詐騙視覺分析專家，專門識別詐騙截圖。
分析重點：假冒品牌、仿冒網域、異常折扣、名人代言（未授權）、倒數計時壓力、釣魚表單、假政府通知、假投資廣告。
可疑/詐騙請從以下選擇 fraud_type：${FRAUD_TYPES}
只輸出純 JSON：{"score":整數0到100,"fraud_type":"安全則null，否則填具體類型","detected_elements":["偵測到的可疑元素"],"suggestion":"給使用者的一句話提醒","reasoning":"判斷依據2到3句"}`

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const mediaType = imageBase64.startsWith('data:image/png') ? 'image/png'
                      : imageBase64.startsWith('data:image/gif') ? 'image/gif' : 'image/jpeg'

      const text = await invokeBedrock([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: isEn ? 'Analyze this screenshot for scam content, output JSON.' : '請分析這張截圖是否為詐騙內容，輸出 JSON。' }
        ]
      }], system)

      const p = parseJSON(text)
      return {
        score:             Math.min(100, Math.max(0, p.score ?? 50)),
        fraud_type:        p.fraud_type ?? null,
        detected_elements: p.detected_elements ?? [],
        suggestion:        p.suggestion ?? '',
        reasoning:         p.reasoning ?? '',
      }
    })(),
  ])

  // 取得各結果（失敗則用預設值）
  const ggl = gglResult.status === 'fulfilled' ? gglResult.value : { level: 'unknown', score: null, reasons: ['Gogolook 截圖分析失敗'] }
  const ai  = aiResult.status === 'fulfilled'  ? aiResult.value  : null

  // ★ 截圖中偵測到 LINE 連結 → 強制 promo
  const screenshotUrls = ggl.reasons?.filter(r => r.includes('截圖中偵測到的連結'))?.join('') ?? ''
  const aiElements     = (ai?.detected_elements ?? []).join(' ')
  const hasLineInShot  = LINE_DOMAINS.some(d =>
    screenshotUrls.includes(d) || aiElements.toLowerCase().includes('line')
  )
  let gglForCalc = ggl
  if (hasLineInShot && ggl.level !== 'scam') {
    gglForCalc = { ...ggl, level: 'promo', label: '行銷推廣內容' }
  }

  // ★ 動態加權（截圖同樣套用）
  const gglScore   = gglForCalc.score ?? null
  const aiScore    = ai?.score ?? 50
  const gglLevelSc = gglForCalc.level ?? 'unknown'
  let weightedScore, displayScore

  if (gglLevelSc === 'unknown') {
    weightedScore = aiScore
    displayScore  = null
  } else {
    const { gglW, aiW } = calcWeights(gglLevelSc, aiScore)
    weightedScore = Math.round((gglScore ?? 50) * gglW + aiScore * aiW)
    displayScore  = weightedScore
  }

  // 等級判定
  const finalLevel = computeLevel(gglLevelSc, gglScore ?? 50, aiScore)

  // 合併分析原因
  const reasons = [
    ...(ggl.reasons ?? []),
    ...(ai?.detected_elements ?? []),
  ].filter(Boolean)

  let advice = null
  if (['suspect_high', 'suspect_low', 'scam', 'promo_scam', 'promo_warn', 'unknown'].includes(finalLevel)) {
    advice = await aiAdvice(
      isEn ? 'Screenshot content' : '截圖內容',
      finalLevel,
      ai?.fraud_type ?? null,
      reasons.slice(0, 4),
      locale
    )
  }

  return {
    ggl:     { level: gglForCalc.level, score: gglScore, reasons: ggl.reasons ?? [] },
    ai:      ai ? { score: aiScore, fraud_type: ai.fraud_type, detected_elements: ai.detected_elements, suggestion: ai.suggestion, reasoning: ai.reasoning } : null,
    level:   finalLevel,
    score:   displayScore,
    label:   levelToLabelNew(finalLevel),
    reasons: reasons.length > 0 ? reasons : ['截圖分析完成'],
    advice,
  }
}

async function pollJob(jobId, maxRetries = 12, intervalMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    await sleep(i === 0 ? 2000 : intervalMs)
    const res = await gFetch(`/content-check/${jobId}`)
    if (!res.ok) continue
    const data = await res.json()
    if (data.status === 3) return data
    if (data.status === 2) throw new Error('截圖分析失敗（上游錯誤）')
  }
  throw new Error('截圖分析逾時，請稍後再試')
}

function normalizeScreenshot(raw) {
  const categoryMap = {
    SCAM:            { level: 'scam',  score: 92 },
    POTENTIAL_SCAM:  { level: 'warn',  score: 65 },
    NO_RISK_FOR_NOW: { level: 'promo', score: 25 },
    SAFE:            { level: 'safe',  score: 3  },
  }
  const { level, score } = categoryMap[raw.category] ?? { level: 'warn', score: 50 }
  const reasons = []

  if (raw.title)                    reasons.push(raw.title)
  if (Array.isArray(raw.content))   reasons.push(...raw.content)
  if (raw.kindly_reminder)          reasons.push(raw.kindly_reminder)
  if (Array.isArray(raw.urls) && raw.urls.length > 0) {
    reasons.push(`截圖中偵測到的連結：${raw.urls.map(u => `${u.url}（${u.level ?? '?'}）`).join('、')}`)
  }
  if (Array.isArray(raw.numbers) && raw.numbers.length > 0) {
    reasons.push(`截圖中偵測到的電話：${raw.numbers.join('、')}`)
  }

  return {
    level,
    score,
    label:   levelToLabel(level),
    reasons: reasons.length > 0 ? reasons : ['截圖分析完成'],
  }
}

/* ── 工具 ── */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function levelToLabel(level) {
  return {
    scam:    '此為詐騙內容',
    warn:    '可疑內容，請謹慎',
    promo:   '行銷推廣內容',
    safe:    '安全無虞',
    unknown: '查無資料',
  }[level] ?? '未知'
}

function genCaseNo() {
  return 'RPT-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

/* ════════════════════════════════════════════
   4. 165 統計數據
   ════════════════════════════════════════════ */
async function getStats() {
  const now = new Date()

  const todayUTC8 = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  todayUTC8.setUTCHours(16, 0, 0, 0)
  todayUTC8.setUTCDate(todayUTC8.getUTCDate() - 1)
  const dailyDate = todayUTC8.toISOString().split('.')[0] + 'Z'

  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 16, 0, 0, 0))
  const monthlyDate = lastMonth.toISOString().split('.')[0] + 'Z'

  const [counterRes, dailyRes, monthlyRes, cityStatsRes] = await Promise.all([
    fetch('https://165dashboard.tw/CIB_DWS_API/api/Dashboard/GetCounter'),
    fetch(`https://165dashboard.tw/CIB_DWS_API/api/Dashboard/GetDailyFraudMethodRanking?date=${dailyDate}&sort=case`),
    fetch(`https://165dashboard.tw/CIB_DWS_API/api/Dashboard/GetMonthlyFraudMethodRanking?date=${monthlyDate}&sort=case`),
    fetch(`https://165dashboard.tw/CIB_DWS_API/api/Dashboard/GetMonthlyCityCaseStatistics?date=${monthlyDate}`),
  ])

  const [counterData, dailyData, monthlyData, cityStatsData] = await Promise.all([
    counterRes.json(),
    dailyRes.json(),
    monthlyRes.json(),
    cityStatsRes.json(),
  ])

  const cityStats = cityStatsData?.body ?? {}

  return {
    reportCount:          counterData?.body ?? 0,
    todayCases:           dailyData?.body?.TotalCases ?? 0,
    todayLosses:          dailyData?.body?.TotalLosses ?? 0,
    topFraud:             dailyData?.body?.TopFive?.[0]?.Name ?? '',
    monthCases:           cityStats?.Cases?.Amount ?? 0,
    monthCasesLast:       cityStats?.Cases?.LastAmount ?? 0,
    monthCasesChange:     cityStats?.Cases?.ChangePercentage ?? 0,
    monthLosses:          cityStats?.Losses?.Amount ?? 0,
    monthLossesLast:      cityStats?.Losses?.LastAmount ?? 0,
    monthLossesChange:    cityStats?.Losses?.ChangePercentage ?? 0,
    topCaseCity:          cityStats?.CasePopulationRatio?.Name ?? '',
    topCaseCityAmount:    cityStats?.CasePopulationRatio?.Amount ?? 0,
    topLossCity:          cityStats?.LossesPopulationRatio?.Name ?? '',
    topLossCityAmount:    cityStats?.LossesPopulationRatio?.Amount ?? 0,
    updatedAt:            new Date().toISOString(),
  }
}

/* ════════════════════════════════════════════
   5. 折線圖數據（過去 6 個月）
   ════════════════════════════════════════════ */
async function getChartData() {
  const now = new Date()

  // 產生過去 6 個月的月底日期（UTC+8 16:00）
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 0, 16, 0, 0, 0))
    months.push(d.toISOString().split('.')[0] + 'Z')
  }

  const results = await Promise.all(
    months.map(date =>
      fetch(`https://165dashboard.tw/CIB_DWS_API/api/Dashboard/GetMonthlyFraudMethodRanking?date=${date}&sort=case`)
        .then(r => r.json())
        .then(d => ({
          date,
          label:  `${new Date(date).getUTCMonth() + 1}月`,
          cases:  d.body?.TotalCases  ?? 0,
          losses: d.body?.TotalLosses ?? 0,
        }))
        .catch(() => ({ date, label: '?', cases: 0, losses: 0 }))
    )
  )

  // 去除重複數據點（如 1月和 2月一樣，代表最新月份尚未更新）
  const unique = results.filter((item, i, arr) =>
    i === 0 || item.cases !== arr[i - 1].cases || item.losses !== arr[i - 1].losses
  )

  return { months: unique }
}

/* ════════════════════════════════
   Lambda Handler
   ════════════════════════════════ */

/* ════════════════════════════════════════════
   6. 等級系統（新）
   ════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   加權工具
   ════════════════════════════════════════════ */

// 分類輔助
const SAFE_LEVELS    = ['safe', 'safe_high', 'safe_low', 'promo_safe', 'promo']
const SCAM_LEVELS    = ['scam', 'promo_scam']

function classifyLevel(level) {
  if (SAFE_LEVELS.includes(level))  return 'safe'
  if (SCAM_LEVELS.includes(level))  return 'scam'
  return 'suspect'
}

function aiScoreToCategory(aiScore) {
  if (aiScore >= 80) return 'scam'
  if (aiScore >= 35) return 'suspect'
  return 'safe'
}

/**
 * 動態加權：根據雙方判斷決定 ggl / AI 的權重
 * 回傳 { gglW, aiW }
 */
function calcWeights(gglLevel, aiScore) {
  const gglCat = classifyLevel(gglLevel)
  const aiCat  = aiScoreToCategory(aiScore)

  // ggl unknown → AI 全權，不計算加權（呼叫端直接用 AI 分數）
  if (gglLevel === 'unknown') return { gglW: 0, aiW: 1 }

  // 雙方都安全 → ggl 55 / AI 45
  if (gglCat === 'safe' && aiCat === 'safe')    return { gglW: 0.55, aiW: 0.45 }

  // 雙方都詐騙 → 50 / 50
  if (gglCat === 'scam' && aiCat === 'scam')    return { gglW: 0.50, aiW: 0.50 }

  // ggl 詐騙，AI 安全 → ggl 65 / AI 35（有紀錄的詐騙不容易洗白）
  if (gglCat === 'scam' && aiCat === 'safe')    return { gglW: 0.65, aiW: 0.35 }

  // ggl 詐騙，AI 可疑 → 50 / 50（雙方都見危，等權）
  if (gglCat === 'scam' && aiCat === 'suspect') return { gglW: 0.50, aiW: 0.50 }

  // ggl 安全，AI 可疑或詐騙 → ggl 40 / AI 60（AI 發現新手法，稍信 AI）
  if (gglCat === 'safe' && aiCat !== 'safe')    return { gglW: 0.40, aiW: 0.60 }

  // 雙方皆可疑 → ggl 45 / AI 55（AI 語意理解稍主導）
  return { gglW: 0.45, aiW: 0.55 }
}

/**
 * 動態偏移：依 ggl 分數區間限制 AI 能偏移多少
 * ggl 越篤定（極高或極低）→ AI 偏移越小
 * ggl 中性 → AI 空間最大
 */
function clampAiScore(rawAiScore, gglScore) {
  let maxUp, maxDown
  if      (gglScore <= 20) { maxUp = 20; maxDown = 20 }  // 很安全：對稱，AI 不能亂拉高
  else if (gglScore <= 40) { maxUp = 25; maxDown = 20 }  // 安全偏低：AI 稍可拉高警示
  else if (gglScore <= 60) { maxUp = 30; maxDown = 25 }  // 中性：最大空間
  else if (gglScore <= 80) { maxUp = 20; maxDown = 15 }  // 高風險：AI 難往下拉
  else                     { maxUp = 10; maxDown = 10 }  // 詐騙：幾乎鎖死

  const max = Math.min(100, gglScore + maxUp)
  const min = Math.max(0,   gglScore - maxDown)
  return Math.min(max, Math.max(min, rawAiScore))
}

/* ════════════════════════════════════════════
   6. 等級系統
   ════════════════════════════════════════════ */
function computeLevel(gglLevel, gglScore, aiScore) {
  // ★ ggl unknown → AI 全權判定
  if (gglLevel === 'unknown') {
    if (aiScore >= 80) return 'scam'
    if (aiScore >= 60) return 'suspect_high'
    if (aiScore >= 35) return 'suspect_low'
    if (aiScore >= 15) return 'safe_low'
    return 'safe_high'
  }
  if (gglLevel === 'scam') return 'scam'
  if (aiScore > 80)        return 'scam'
  if (gglLevel === 'promo') {
    if (aiScore < 35) return 'promo_safe'
    if (aiScore < 60) return 'promo_warn'
    return 'promo_scam'
  }
  if (gglLevel === 'warn') return aiScore < 15 ? 'suspect_low' : 'suspect_high'
  // safe
  if (aiScore < 15) return 'safe_high'
  if (aiScore < 35) return 'safe_low'
  if (aiScore < 60) return 'suspect_low'
  return 'suspect_high'
}

function levelToLabelNew(level) {
  return {
    safe_high:    '完全安全',
    safe_low:     '安全（低風險）',
    suspect_low:  '輕度可疑',
    suspect_high: '高度可疑',
    scam:         '此為詐騙內容',
    promo_safe:   '行銷推廣（安全）',
    promo_warn:   '行銷推廣（可疑）',
    promo_scam:   '行銷推廣（詐騙）',
    unknown:      '查無資料',
  }[level] ?? '未知'
}

/* ════════════════════════════════════════════
   7. LLM 快取（永久，key: llm#xxx）
   ════════════════════════════════════════════ */
async function llmCacheGet(key) {
  try {
    const res = await dynamo.send(new GetItemCommand({
      TableName: TABLE,
      Key: { cacheKey: { S: 'llm#' + key } },
    }))
    if (!res.Item) return null
    return JSON.parse(res.Item.data.S)
  } catch (e) { console.warn('[LLM Cache GET]', e.message); return null }
}

async function llmCacheSet(key, data) {
  try {
    await dynamo.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        cacheKey: { S: 'llm#' + key },
        data:     { S: JSON.stringify(data) },
        // 不設 expireAt = 永久保存
      },
    }))
  } catch (e) { console.warn('[LLM Cache SET]', e.message) }
}

/* ════════════════════════════════════════════
   8. LLM 分析（Bedrock / Anthropic）
   ════════════════════════════════════════════ */
async function invokeBedrock(messages, systemPrompt) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 512, system: systemPrompt, messages }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.content?.[0]?.text ?? ''
      }
    } catch (e) { console.warn('[Anthropic API failed]', e.message) }
  }
  // ── Bedrock fallback 已暫時停用 ──
  // const payload = { anthropic_version: 'bedrock-2023-05-31', max_tokens: 512, system: systemPrompt, messages }
  // const cmd = new InvokeModelCommand({
  //   modelId: BEDROCK_MODEL, contentType: 'application/json', accept: 'application/json',
  //   body: JSON.stringify(payload),
  // })
  // const res = await bedrock.send(cmd)
  // const body = JSON.parse(new TextDecoder().decode(res.body))
  // return body.content?.[0]?.text ?? ''
  throw new Error('AI 分析暫時無法使用：Bedrock 已停用，請設定 ANTHROPIC_API_KEY 環境變數')
}

function parseJSON(text) {
  let t = text.trim().replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  return JSON.parse(t)
}

/* ════════════════════════════════════════════
   爬蟲：抓取網頁文字內容
   ════════════════════════════════════════════ */
async function crawlUrl(url) {
  try {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const res = await fetch(target, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null

    const html = await res.text()

    // 萃取標題
    const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // 移除 script / style / svg，取純文字
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2500)  // 最多 2500 字，避免超過 token 限制

    return { title, text, finalUrl: res.url }
  } catch (e) {
    console.warn('[Crawl]', e.message)
    return null
  }
}

async function aiAssist(query, queryType, gglResult, pageContent = null, locale = 'zh') {
  const isEn = locale === 'en'
  const hasGglData = gglResult && gglResult.reasons?.length > 0 &&
    !gglResult.reasons[0]?.includes('無詳細資訊') &&
    !gglResult.reasons[0]?.includes('無法判斷') &&
    !gglResult.reasons[0]?.includes('查無')

  let systemPrompt, userMsg
  const FRAUD_TYPES = isEn
    ? 'Fake bank/financial institution, Investment scam, Romance scam, Fake government agency, Online shopping scam, Phishing site, Fake lottery, Fake customer service, Fake e-commerce platform, Personal data theft'
    : '假冒銀行/金融機構、假投資詐騙、假交友/感情詐騙、假冒政府機關、網路購物詐騙、釣魚網站、假中獎通知、假客服詐騙、假冒電商平台、個資竊取'
  const JSON_FORMAT = isEn
    ? 'Output ONLY pure JSON (no explanation): {"score":integer 0-100,"fraud_type":"null if safe, otherwise specific type","suggestion":"one-sentence tip for user","reasoning":"2-3 sentence basis for score"}'
    : '只輸出純 JSON（不加任何說明）：{"score":整數0到100,"fraud_type":"安全則null，可疑/詐騙則填具體類型","suggestion":"給使用者的一句話提醒","reasoning":"評分依據2到3句"}'

  const crawlSection = pageContent
    ? isEn
      ? `\n=== Web Page Content (crawled) ===\nTitle: ${pageContent.title || '(none)'}\nContent: ${pageContent.text}\n`
      : `\n=== 網頁內容（爬蟲擷取）===\n標題：${pageContent.title || '（無）'}\n內容：${pageContent.text}\n`
    : ''

  if (hasGglData) {
    const riskHint = isEn
      ? (gglResult.level === 'scam' || gglResult.score >= 70)
          ? '⚠️ Gogolook flagged as high risk. Identify the specific scam pattern.'
          : (gglResult.level === 'safe' && gglResult.score <= 20)
            ? '✅ Gogolook rated safe. Maintain low risk score unless clear scam signs exist.'
            : ''
      : (gglResult.level === 'scam' || gglResult.score >= 70)
          ? '⚠️ Gogolook 已標記高風險，請識別具體詐騙模式。'
          : (gglResult.level === 'safe' && gglResult.score <= 20)
            ? '✅ Gogolook 評為安全，除非有明確詐騙特徵，請維持低風險評分。'
            : ''

    systemPrompt = isEn
      ? `You are a Taiwan anti-scam assistant analyzing based on Gogolook's initial result.
Scoring rule: If Gogolook rates safe, your score must not exceed Gogolook score+25. If Gogolook rates dangerous, your score must not be below Gogolook score-30.
For fraud_type choose from: ${FRAUD_TYPES}.
${JSON_FORMAT}`
      : `你是台灣反詐騙輔助分析系統，負責根據 Gogolook 初步結果進行深度評估。
評分原則：Gogolook 評安全時你的分數不超過其分數+25；Gogolook 評危險時你的分數不低於其分數-30。
可疑/詐騙等級必須從以下選擇 fraud_type：${FRAUD_TYPES}。
${JSON_FORMAT}`

    userMsg = isEn
      ? `=== Gogolook Result ===
Query: ${query} (${queryType === 'phone' ? 'phone' : 'URL'})
Risk level: ${gglResult.level} (${gglResult.score}/100)
Reasons: ${gglResult.reasons.join(', ')}
${riskHint}
${crawlSection}
Output JSON.`
      : `=== Gogolook 分析結果 ===
查詢內容：${query}（${queryType === 'phone' ? '電話' : '網址'}）
風險等級：${gglResult.level}（${gglResult.score}/100）
原因：${gglResult.reasons.join('、')}
${riskHint}
${crawlSection}
請輸出 JSON。`

  } else {
    systemPrompt = isEn
      ? `You are a Taiwan anti-scam analysis system evaluating content not found in Gogolook.
Key principle: No record ≠ scam. Most phone numbers/URLs are not in the database. Score objectively.
Give high score only if clear scam features exist (brand impersonation, VoIP number, phishing page, etc.). Otherwise give low score.
For fraud_type choose from: ${FRAUD_TYPES}.
${JSON_FORMAT}`
      : `你是台灣反詐騙分析系統，負責對 Gogolook 查無紀錄的內容進行獨立評估。
重要原則：查無資料≠詐騙，大多數電話/網址都不在資料庫中，請客觀評分。
若發現明確詐騙特徵（仿冒知名品牌、虛擬號碼格式、釣魚頁面等）如實給高分；反之無特徵則給低分，不要因為查無資料就自動給高分。
若判定可疑請從以下選擇 fraud_type：${FRAUD_TYPES}。
${JSON_FORMAT}`

    userMsg = isEn
      ? `=== Query Info ===
Content: ${query}
Type: ${queryType === 'phone' ? 'Phone number' : 'URL'}
Gogolook status: Not found in database (this is normal, judge from content itself)
${crawlSection}
Output JSON.`
      : `=== 查詢資訊 ===
查詢內容：${query}
類型：${queryType === 'phone' ? '電話號碼' : '網址'}
Gogolook 狀態：資料庫查無紀錄（這很正常，請從內容本身判斷）
${crawlSection}
請輸出 JSON。`
  }
  const text = await invokeBedrock([{ role: 'user', content: userMsg }], systemPrompt)
  try {
    const p = parseJSON(text)
    let aiScore = Math.min(100, Math.max(0, p.score ?? 50))

    // ★ ggl 有資料時用動態偏移限制 AI 分數
    if (hasGglData) {
      aiScore = clampAiScore(aiScore, gglResult.score ?? 50)  // gglScore null 時用 50 做計算基準
    }
    // ggl unknown 時 AI 全權，不限制

    return { score: aiScore, fraud_type: p.fraud_type ?? null, suggestion: p.suggestion ?? '', reasoning: p.reasoning ?? '', autonomous: !hasGglData }
  } catch {
    return { score: gglResult?.score ?? 50, fraud_type: null, suggestion: '', reasoning: '', autonomous: !hasGglData }
  }
}

async function aiAdvice(query, level, fraudType, reasons, locale = 'zh') {
  const isEn = locale === 'en'
  const system = isEn
    ? 'You are a Taiwan anti-scam protection expert. Output ONLY pure JSON: {"immediate_actions":["action1","action2"],"avoid_actions":["avoid1"],"report_steps":["step1","step2"],"recovery_tips":"recovery advice"}'
    : '你是台灣詐騙防護專家。只輸出純 JSON：{"immediate_actions":["行動1","行動2"],"avoid_actions":["禁止1"],"report_steps":["步驟1","步驟2"],"recovery_tips":"補救建議"}'
  const userMsg = isEn
    ? `Risk level: ${level}\nScam type: ${fraudType ?? 'unknown'}\nReasons: ${reasons.join(', ')}\nQuery: ${query}\n\nProvide protective advice.`
    : `詐騙等級：${level}\n手法：${fraudType ?? '未知'}\n原因：${reasons.join('、')}\n查詢：${query}\n\n請提供對策建議。`
  const text = await invokeBedrock([{ role: 'user', content: userMsg }], system)
  try {
    const p = parseJSON(text)
    return { immediate_actions: p.immediate_actions ?? [], avoid_actions: p.avoid_actions ?? [], report_steps: p.report_steps ?? [], recovery_tips: p.recovery_tips ?? '' }
  } catch {
    return { immediate_actions: [], avoid_actions: [], report_steps: [], recovery_tips: '' }
  }
}

async function fullAnalyze(query, queryType, locale = 'zh') {
  // 1. 查 LLM 快取（含 locale 前綴）
  const cacheKey = queryType === 'phone'
    ? `phone#${locale}#${hashKey(query)}`
    : `url#${locale}#${query.toLowerCase()}`
  const cached = await llmCacheGet(cacheKey)
  if (cached) { console.log('[LLM CACHE_HIT]', cacheKey); return cached }

  // 2. Gogolook + 爬蟲 並行（URL 才爬，電話不用）
  let gglResult = null
  let pageContent = null
  if (queryType === 'phone') {
    try { gglResult = await checkPhone(query) } catch (e) { console.warn('[Gogolook failed]', e.message) }
  } else {
    const [gglRes, crawlRes] = await Promise.allSettled([
      checkUrl(query),
      crawlUrl(query),
    ])
    if (gglRes.status === 'fulfilled')   gglResult   = gglRes.value
    else console.warn('[Gogolook failed]', gglRes.reason?.message)
    if (crawlRes.status === 'fulfilled') pageContent = crawlRes.value
    if (pageContent) console.log('[Crawl] 取得網頁內容，標題:', pageContent.title?.slice(0, 50))
    else             console.log('[Crawl] 未取得網頁內容')
  }

  // LINE 連結 → 強制 ggl level = 'promo'
  const isLine = queryType !== 'phone' && isLineUrl(query)
  if (isLine && gglResult) {
    gglResult = {
      ...gglResult,
      level:   'promo',
      label:   '行銷推廣內容',
      reasons: ['偵測到 LINE 官方連結，屬行銷推廣性質', ...gglResult.reasons],
    }
  }

  // 3. AI 輔助分析（帶入網頁內容）
  const aiResult = await aiAssist(query, queryType, gglResult, pageContent, locale)

  // 4. ★ 動態加權
  const gglScore = gglResult?.score ?? null  // null = ggl 查無資料
  const gglLevel = gglResult?.level ?? 'unknown'
  let weightedScore, displayScore

  if (gglLevel === 'unknown') {
    // ggl 查無資料 → AI 全權，score 顯示 null（前端顯示 ?）
    weightedScore = aiResult.score
    displayScore  = null
  } else {
    const { gglW, aiW } = calcWeights(gglLevel, aiResult.score)
    weightedScore = Math.round((gglScore ?? 50) * gglW + aiResult.score * aiW)
    displayScore  = weightedScore
  }

  // 5. 等級判定
  const finalLevel = computeLevel(gglLevel, gglScore ?? 50, aiResult.score)

  // 6. ★ 對策建議（unknown / suspect_low 也生成）
  let advice = null
  if (['suspect_high', 'suspect_low', 'scam', 'promo_scam', 'promo_warn', 'unknown'].includes(finalLevel)) {
    advice = await aiAdvice(query, finalLevel, aiResult.fraud_type, gglResult?.reasons ?? [], locale)
  }

  const result = {
    ggl:     { level: gglLevel, score: gglScore, label: levelToLabel(gglLevel), reasons: gglResult?.reasons ?? [] },  // score 可為 null
    ai:      { score: aiResult.score, fraud_type: aiResult.fraud_type, suggestion: aiResult.suggestion, reasoning: aiResult.reasoning, autonomous: aiResult.autonomous },
    level:   finalLevel,
    score:   displayScore,
    label:   levelToLabelNew(finalLevel),
    reasons: gglResult?.reasons ?? [],
    advice,
    cachedAt: new Date().toISOString(),
  }

  // 7. 永久快取
  await llmCacheSet(cacheKey, result)
  return result
}

async function llmAnalyze(subtype, query, context = {}, locale = 'zh') {
  if (subtype === 'text' || subtype === 'full') {
    return fullAnalyze(query, context.queryType ?? 'url', locale)
  }
  if (subtype === 'phone') {
    return fullAnalyze(query, 'phone')
  }
  if (subtype === 'image') {
    const gglResult = context.gglResult ?? null
    const system = '你是台灣詐騙偵測專家，分析截圖。只輸出純 JSON：{"score":0到100整數,"fraud_type":"手法或null","detected_elements":["可疑元素"],"suggestion":"建議","reasoning":"依據"}'
    const base64Data = query.replace(/^data:image\/\w+;base64,/, '')
    const mediaType = query.startsWith('data:image/png') ? 'image/png' : query.startsWith('data:image/gif') ? 'image/gif' : 'image/jpeg'
    const gglCtx = gglResult ? `Gogolook：${gglResult.level}（${gglResult.score}分），${gglResult.reasons?.join('、')}` : '無Gogolook資料'
    const text = await invokeBedrock([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }, { type: 'text', text: `${gglCtx}\n\n請分析截圖詐騙風險。` }] }], system)
    try {
      const p = parseJSON(text)
      const aiScore    = Math.min(100, Math.max(0, p.score ?? 50))
      const gglScore   = gglResult?.score ?? 50
      const gglLevelLm = gglResult?.level ?? 'safe'
      let weightedScore, displayScore
      if (gglLevelLm === 'unknown') {
        weightedScore = aiScore; displayScore = null
      } else {
        const { gglW, aiW } = calcWeights(gglLevelLm, aiScore)
        weightedScore = Math.round(gglScore * gglW + aiScore * aiW)
        displayScore  = weightedScore
      }
      const finalLevel = computeLevel(gglLevelLm, gglScore, aiScore)
      return { ggl: gglResult, ai: { score: aiScore, fraud_type: p.fraud_type, detected_elements: p.detected_elements ?? [], suggestion: p.suggestion }, level: finalLevel, score: displayScore, label: levelToLabelNew(finalLevel), reasons: [...(gglResult?.reasons ?? []), ...(p.detected_elements ?? [])] }
    } catch {
      return { level: gglResult?.level ?? 'unknown', score: gglResult?.score ?? 50, label: levelToLabel(gglResult?.level ?? 'unknown'), reasons: gglResult?.reasons ?? [] }
    }
  }
  if (subtype === 'advice') {
    return aiAdvice(query, context.level ?? 'unknown', context.fraud_type, context.reasons ?? [], locale)
  }
  throw new Error(`Unknown LLM subtype: ${subtype}`)
}


export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  let body = {}
  try {
    body = event.body ? JSON.parse(event.body) : event
  } catch {
    body = event
  }

  const type  = body.type ?? (event.path || event.rawPath || '').split('/').pop()
  const query = body.query

  try {
    if (type === 'url') {
      if (!query) return resp(400, { error: 'query is required' })
      return resp(200, await checkUrl(query))
    }
    if (type === 'phone') {
      if (!query) return resp(400, { error: 'query is required' })
      return resp(200, await checkPhone(query))
    }
    if (type === 'screenshot' || type === 'image') {
      if (!query) return resp(400, { error: 'query (base64 image) is required' })
      return resp(200, await checkScreenshot(query, body.locale ?? 'zh'))
    }
    if (type === 'report') {
      const caseNo    = genCaseNo()
      const queryType = body.queryType ?? 'url'
      const reportKey = `report#${caseNo}`

      await cacheSet(reportKey, {
        caseNo,
        query:      query ?? '',
        queryType,
        reportedAt: new Date().toISOString(),
      })

      if (query) {
        let cacheKey
        if (queryType === 'phone') {
          const { country, number } = parsePhone(query)
          cacheKey = `phone#${hashKey(number)}`
        } else {
          const target = /^https?:\/\//i.test(query) ? query : `https://${query}`
          cacheKey = `url#${target.toLowerCase()}`
        }

        const existing = await cacheGet(cacheKey)
        if (existing) {
          const reportCount = (existing.reportCount ?? 0) + 1

          let increment = 5
          if (reportCount >= 3 && reportCount <= 4) increment = 3
          if (reportCount >= 5) increment = 1

          const boostedScore = existing.score != null ? Math.min(90, existing.score + increment) : null

          let level = existing.level
          if (reportCount >= 3 && boostedScore != null && boostedScore >= 60) level = 'warn'
          if (reportCount >= 5 && boostedScore != null && boostedScore >= 75) level = 'scam'

          const boosted = {
            ...existing,
            score:       boostedScore,
            level,
            label:       levelToLabel(level),
            reportCount,
            reasons: reportCount >= 3
              ? [`⚠️ 已被 ${reportCount} 名用戶舉報`, ...existing.reasons.filter(r => !r.startsWith('⚠️ 已被'))]
              : existing.reasons.filter(r => !r.startsWith('⚠️ 已被')),
          }
          await cacheSet(cacheKey, boosted)
        }
      }

      return resp(200, { caseNo })
    }
    if (type === 'stats') {
      return resp(200, await getStats())
    }
    if (type === 'chart') {
      return resp(200, await getChartData())
    }
    if (type === 'llm') {
      const subtype = body.subtype ?? 'text'
      const context = body.context ?? {}
      if (!query) return resp(400, { error: 'query is required' })
      return resp(200, await llmAnalyze(subtype, query, context, body.locale ?? 'zh'))
    }

    console.log('[Debug] unknown type:', type, 'body:', JSON.stringify(body))
    return resp(400, {
      error: `Unknown type: "${type}". Send { type: 'url'|'phone'|'screenshot'|'report'|'stats'|'chart'|'llm', query: '...' }`,
    })

  } catch (err) {
    console.error('[Lambda Error]', err.message)
    return resp(500, { error: err.message })
  }
}
