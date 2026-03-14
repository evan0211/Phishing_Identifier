# Integrations — Adapter 介面規範

本目錄存放所有外部 API 整合模組（Adapter）。

## Adapter 介面規範

每個 Adapter 必須匯出以下屬性：

| 屬性 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | Adapter 識別名稱，對應 `.env` 的 `API_PROVIDER` 值 |
| `checkUrl(query)` | `Function → Promise` | 查詢網址風險 |
| `checkPhone(query)` | `Function → Promise` | 查詢電話號碼風險（query 已移除空白與連字號） |
| `checkScreenshot(query)` | `Function → Promise` | 查詢截圖風險 |
| `report(query)` | `Function → Promise` | 回報詐騙案件 |

## 回傳格式

查詢函式（`checkUrl`、`checkPhone`、`checkScreenshot`）回傳：
```json
{
  "level": "safe | promo | warn | scam",
  "score": 0,
  "label": "說明文字",
  "reasons": ["原因 1", "原因 2"]
}
```

回報函式（`report`）回傳：
```json
{
  "ok": true,
  "caseNo": "案件編號"
}
```

缺少的欄位會由 `server.js` 的 `normalize()` 自動補齊預設值。

## 新增 Adapter 步驟

1. 複製 `example-adapter.js` 並命名為 `{your-name}-adapter.js`
2. 實作四個函式，確保回傳符合上述格式的 Promise
3. 在 `Backend/.env` 設定 `API_PROVIDER={your-name}`
4. 重新啟動 server：`node server.js`

## 現有 Adapter

| 檔案 | 名稱 | 說明 |
|------|------|------|
| `mock-adapter.js` | `mock` | 假資料提供者，開發與測試用 |
| `hackathon-adapter.js` | `hackathon` | AWS Hackathon 2026 詐騙識別 API |
| `example-adapter.js` | `example` | 自訂 Adapter 範本 |
