# 實作計畫：後端 API 整合

## 概覽

本計畫以現有的 `Backend/server.js`、`Backend/integrations/hackathon-adapter.js`、`Backend/integrations/mock-adapter.js` 為基礎，
補齊缺漏功能、修正已知問題，並建立完整的單元測試與屬性測試（fast-check）。

## 任務

- [x] 1. 建立測試環境與基礎設施
  - 在 `Backend/` 目錄下初始化 `package.json`（僅含 `fast-check` 與測試執行器）
  - 建立 `Backend/tests/` 目錄結構
  - 確認 `Backend/.env.example` 包含 `API_PROVIDER`、`API_BASE_URL`、`API_KEY` 三個變數與說明
  - _需求：2.4_

- [x] 2. 補齊 Normalizer 並驗證正確性
  - [x] 2.1 確認 `server.js` 中的 `normalize` 函式涵蓋所有欄位對應規則
    - 補齊 `label` 缺少時預設為 `'查詢完成'`
    - 確認 `reasons` 為字串時轉為陣列、缺少時預設為 `[]`
    - 確認無效 `level` 值時預設為 `'warn'`
    - _需求：9.1、9.2、9.3、9.4、9.5_

  - [ ]* 2.2 撰寫屬性測試：Normalizer 輸出格式一致性（屬性 3）
    - 建立 `Backend/tests/normalizer.property.test.js`
    - **屬性 3：Normalizer 輸出格式一致性**
    - **驗證需求：3.2、4.2、5.2、9.1**
    - 使用 `fc.record` 產生任意物件，驗證輸出必含 `level`、`score`、`label`、`reasons` 且 `reasons` 為陣列

  - [ ]* 2.3 撰寫屬性測試：Normalizer 缺少欄位時的預設值（屬性 4）
    - **屬性 4：Normalizer 缺少欄位時的預設值**
    - **驗證需求：9.2、9.3、9.4、9.5**
    - 驗證缺少 `level` → `'warn'`、缺少 `score` → `50`、缺少 `reasons` → `[]`

  - [ ]* 2.4 撰寫屬性測試：Normalizer 冪等性（屬性 5）
    - **屬性 5：Normalizer 冪等性**
    - **驗證需求：9.6**
    - 驗證 `normalize(normalize(x))` 與 `normalize(x)` 結果完全相同

- [x] 3. 補齊 Mock Adapter 並驗證正確性
  - [x] 3.1 修正 `mock-adapter.js` 中 `checkScreenshot` 與 `report` 的 `query` 參數未使用問題
    - `checkScreenshot` 應依 `query` 內容判斷風險等級（與 `checkUrl` 邏輯一致）
    - `report` 應確保 `caseNo` 格式為 `MOCK-{timestamp}` 非空字串
    - _需求：8.1、8.2、8.3_

  - [ ]* 3.2 撰寫屬性測試：Mock 關鍵字比對邏輯（屬性 9）
    - 建立 `Backend/tests/mock-adapter.property.test.js`
    - **屬性 9：Mock 關鍵字比對邏輯**
    - **驗證需求：8.2**
    - 使用 `fc.constantFrom` 產生含關鍵字的 query，驗證回傳對應的 `level`

  - [ ]* 3.3 撰寫單元測試：Mock Adapter 介面完整性
    - 建立 `Backend/tests/mock-adapter.unit.test.js`
    - 驗證四個函式均存在且為 Function
    - 驗證 `report` 回傳 `{ ok: true, caseNo: <非空字串> }`
    - _需求：8.1、8.3、8.4_

- [x] 4. 驗證 Adapter 介面規範
  - [x] 4.1 確認 `hackathon-adapter.js` 與 `mock-adapter.js` 均匯出 `name` 字串屬性
    - 確認兩個 Adapter 的 `name` 屬性值分別為 `'hackathon'` 與 `'mock'`
    - _需求：1.4_

  - [ ]* 4.2 撰寫屬性測試：Adapter 介面完整性（屬性 1）
    - 建立 `Backend/tests/adapter-interface.property.test.js`
    - **屬性 1：Adapter 介面完整性**
    - **驗證需求：1.4、8.1、8.4**
    - 對 mock 與 hackathon 兩個 Adapter，驗證四個函式均存在且呼叫後回傳 Promise

  - [ ]* 4.3 撰寫屬性測試：動態載入任意合法 Adapter（屬性 2）
    - **屬性 2：動態載入任意合法 Adapter**
    - **驗證需求：1.3**
    - 驗證 `require('./integrations/mock-adapter.js')` 與 `require('./integrations/hackathon-adapter.js')` 不拋出例外

- [x] 5. 補齊 server.js 端點邏輯
  - [x] 5.1 確認電話號碼清理邏輯正確
    - 確認 `POST /api/check/phone` 在呼叫 Adapter 前移除空白與連字號
    - _需求：4.1_

  - [ ]* 5.2 撰寫屬性測試：電話號碼清理（屬性 8）
    - 建立 `Backend/tests/server.property.test.js`
    - **屬性 8：電話號碼清理**
    - **驗證需求：4.1**
    - 使用 `fc.string` 產生含空白/連字號的號碼，驗證清理後僅含數字與國碼字元

  - [ ]* 5.3 撰寫屬性測試：回傳 level 值必為有效 Risk Level（屬性 6）
    - **屬性 6：回傳 level 值必為有效 Risk Level**
    - **驗證需求：3.5**
    - 對任意 query 輸入，驗證 mock adapter 回傳的 `level` 必為 `safe`、`promo`、`warn`、`scam` 之一

  - [ ]* 5.4 撰寫屬性測試：Adapter 失敗時回傳 mock fallback（屬性 7）
    - **屬性 7：Adapter 失敗時回傳 mock fallback**
    - **驗證需求：3.4、4.4、5.3**
    - 模擬 Adapter 拋出例外，驗證 `withFallback` 回傳符合標準格式的 mock 結果

- [x] 6. 補齊 server.js 單元測試
  - [x] 6.1 撰寫單元測試：健康檢查端點
    - 建立 `Backend/tests/server.unit.test.js`
    - 驗證 `GET /api/health` 回傳 `{ ok: true, provider, mock }` 格式
    - 驗證 mock 模式下 `mock: true`、hackathon 模式下 `mock: false`
    - _需求：7.1、7.2、7.3_

  - [x] 6.2 撰寫單元測試：空 query 回傳 HTTP 400
    - 驗證 `POST /api/check/url`、`/api/check/phone`、`/api/report` 在 `query` 為空時回傳 400 與 `{ error: "query 不得為空" }`
    - _需求：3.3、4.3、6.4_

  - [x] 6.3 撰寫單元測試：回報端點回應格式
    - 驗證回報成功時回傳 `{ ok: true, caseNo: <非空字串> }`
    - 驗證回報失敗時回傳 `{ ok: false, caseNo: null }`
    - _需求：6.2、6.3_

  - [x] 6.4 撰寫單元測試：環境設定邊界情況
    - 驗證 `.env` 不存在時使用 mock adapter
    - 驗證 `API_KEY` 為空且 `API_PROVIDER` 不為 `mock` 時 console 輸出警告
    - 驗證 `.env.example` 檔案存在且包含 `API_PROVIDER`、`API_BASE_URL`、`API_KEY`
    - _需求：2.3、2.4、2.5_

- [x] 7. 建立 example-adapter.js 範本
  - 在 `Backend/integrations/` 建立 `example-adapter.js`，包含四個函式的骨架與 JSDoc 說明
  - 確認 `Backend/integrations/README.md` 說明 Adapter 介面規範與實作步驟
  - _需求：1.1、1.2_

- [x] 8. 最終檢查點 — 確認所有測試通過
  - 執行 `node --test Backend/tests/` 確認所有測試通過，如有問題請提出。

## 備註

- 標有 `*` 的子任務為選填，可跳過以加速 MVP 開發
- 每個任務均對應具體需求條款，確保可追溯性
- 屬性測試使用 `fast-check`，每個屬性最少執行 100 次迭代
- 測試檔案使用 Node.js 內建 `node:test` 模組搭配 `fast-check`，無需額外測試框架
![alt text]