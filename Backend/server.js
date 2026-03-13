/**
 * 防詐雷達 Mock API Server
 * 執行：node server.js
 * Port：3001
 */
const http = require('http')

const URL_DB = {
  'bank-tw-login.verify-now.xyz': { level:'scam',  score:96, label:'此為詐騙網站',     reasons:['域名偽裝成銀行官網','近期大量用戶回報為詐騙','HTTPS 憑證僅 2 天前申請','頁面要求輸入銀行帳號密碼'] },
  'lin.ee':                        { level:'promo', score:35, label:'推銷訊息（安全）',  reasons:['為 LINE 官方短網址服務','無詐騙紀錄','可能含促銷或廣告內容'] },
  'esun.com.tw':                   { level:'safe',  score:2,  label:'安全網站',          reasons:['為台灣上市銀行官網','憑證有效且由知名機構簽發','無任何詐騙回報紀錄'] },
}
const PHONE_DB = {
  '0200123456': { level:'scam',  score:97, label:'已知詐騙電話',   reasons:['已被 165 列入詐騙名單','近一週超過 200 次回報','偽裝成銀行客服撥打'] },
  '0900456789': { level:'warn',  score:62, label:'可疑電話號碼',   reasons:['多次被標記為騷擾電話','無法確認來源身分'] },
  '0800221314': { level:'safe',  score:2,  label:'安全號碼',       reasons:['為官方客服專線','無詐騙回報紀錄'] },
}

function match(db, query) {
  const key = Object.keys(db).find(k => query.includes(k))
  return key ? db[key] : { level:'warn', score:55, label:'未知來源，請謹慎', reasons:['查無相關紀錄','建議保持警覺','如有疑慮可撥打 165 查詢'] }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url = req.url

  if (req.method === 'GET' && url === '/api/health') {
    res.writeHead(200, {'Content-Type':'application/json'})
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      const { query } = JSON.parse(body || '{}')
      let result

      if (url === '/api/check/url') {
        result = match(URL_DB, query)
      } else if (url === '/api/check/phone') {
        result = match(PHONE_DB, query.replace(/[-\s]/g,''))
      } else if (url === '/api/check/screenshot') {
        result = { level:'scam', score:88, label:'截圖含詐騙內容', reasons:['畫面中偵測到假冒銀行登入頁','要求輸入 OTP 驗證碼','網址列顯示非官方域名'] }
      } else if (url === '/api/report') {
        const caseNo = '#TW2026-' + Math.floor(10000 + Math.random()*90000)
        result = { ok: true, caseNo }
      } else {
        res.writeHead(404); res.end('Not found'); return
      }

      res.writeHead(200, {'Content-Type':'application/json'})
      res.end(JSON.stringify(result))
    })
    return
  }

  res.writeHead(404); res.end()
})

server.listen(3001, () => console.log('✅ Mock API running → http://localhost:3001'))
