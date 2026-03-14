# 需求文件：後端 API 整合

## 簡介

「防詐雷達」後端目前以 Node.js 內建 `http` 模組運行於 port 3001，所有查詢結果皆為硬編碼的 mock 資料。
本功能旨在將後端升級為可對接真實外部 API 的架構，同時保留 mock fallback 機制，
並提供清楚的擴充點（整合資料夾 + 介面規範），讓開發者能夠輕鬆接入任何第三方詐騙偵測服務。

---

## 詞彙表

- **Server**：`Backend/server.js`，以 Node.js 內建 `http` 模組運行的 API 伺服器
- **Adapter**：位於 `Backend/integrations/` 目錄下的整合模組，負責呼叫外部 API 並將回應正規化
- **Normalizer**：將外部 API 回應轉換為前端期望格式 `{ level, score, label, reasons }` 的函式
- **Mock_Provider**：內建的假資料提供者，在無真實 API 時作為 fallback
- **Health_Check**：`GET /api/health` 端點，回傳伺服器與 API 連線狀態
- **Risk_Level**：風險等級，值為 `safe`、`promo`、`warn`、`scam` 之一
- **Config**：環境設定，透過 `Backend/.env` 或環境變數提供 API 金鑰與 base URL
- **Report_Result**：回報端點的回應格式 `{ ok: boolean, caseNo: string }`

---

## 需求

### 需求 1：整合資料夾與 Adapter 介面規範

**使用者故事：** 身為開發者，我希望有一個專屬資料夾放置真實 API 整合程式碼，
並有清楚的介面規範，讓我能夠快速接入任何第三方詐騙偵測服務。

#### 驗收標準

1. THE Server SHALL 在 `Backend/integrations/` 目錄下提供範例 Adapter 檔案 `example-adapter.js`
2. THE Server SHALL 在 `Backend/integrations/` 目錄下提供 `README.md`，說明 Adapter 介面規範與實作步驟
3. WHEN 開發者建立新的 Adapter 檔案，THE Server SHALL 能夠透過 `require()` 動態載入該 Adapter
4. THE Server SHALL 要求每個 Adapter 匯出以下函式：`checkUrl(query)`、`checkPhone(query)`、`checkScreenshot(query)`、`report(query)`
5. WHEN Adapter 函式被呼叫，THE Adapter SHALL 回傳符合 `{ level, score, label, reasons }` 格式的 Promise

---

### 需求 2：環境設定與 API 金鑰管理

**使用者故事：** 身為開發者，我希望透過環境變數管理 API 金鑰與設定，
避免敏感資訊硬編碼在原始碼中。

#### 驗收標準

1. THE Server SHALL 從 `Backend/.env` 檔案或系統環境變數讀取 API 設定
2. THE Server SHALL 支援以下環境變數：`API_BASE_URL`、`API_KEY`、`API_PROVIDER`（指定使用哪個 Adapter）
3. WHEN `Backend/.env` 檔案不存在，THE Server SHALL 以 Mock_Provider 作為預設提供者並繼續正常運行
4. THE Server SHALL 在 `Backend/` 目錄下提供 `.env.example` 範本檔案，列出所有可用的環境變數與說明
5. IF `API_KEY` 環境變數為空且 `API_PROVIDER` 不為 `mock`，THEN THE Server SHALL 在啟動時於 console 輸出警告訊息

---

### 需求 3：URL 查詢端點

**使用者故事：** 身為使用者，我希望提交可疑網址後能得到真實的風險分析結果，
而非固定的假資料。

#### 驗收標準

1. WHEN `POST /api/check/url` 收到 `{ "query": "<url>" }`，THE Server SHALL 呼叫已設定的 Adapter 的 `checkUrl` 函式
2. WHEN Adapter 回傳結果，THE Server SHALL 透過 Normalizer 將結果轉換為 `{ level, score, label, reasons }` 格式後回傳
3. IF `query` 欄位為空字串，THEN THE Server SHALL 回傳 HTTP 400 與錯誤訊息 `{ error: "query 不得為空" }`
4. IF Adapter 呼叫失敗，THEN THE Server SHALL 回傳 Mock_Provider 的 fallback 結果，並在 console 記錄錯誤
5. WHEN 回傳結果，THE Server SHALL 確保 `level` 欄位值為 `safe`、`promo`、`warn`、`scam` 之一

---

### 需求 4：電話號碼查詢端點

**使用者故事：** 身為使用者，我希望提交可疑電話號碼後能得到真實的風險分析結果。

#### 驗收標準

1. WHEN `POST /api/check/phone` 收到 `{ "query": "<phone>" }`，THE Server SHALL 移除 query 中的空白與連字號後呼叫 Adapter 的 `checkPhone` 函式
2. WHEN Adapter 回傳結果，THE Server SHALL 透過 Normalizer 將結果轉換為標準格式後回傳
3. IF `query` 欄位為空字串，THEN THE Server SHALL 回傳 HTTP 400 與錯誤訊息 `{ error: "query 不得為空" }`
4. IF Adapter 呼叫失敗，THEN THE Server SHALL 回傳 Mock_Provider 的 fallback 結果，並在 console 記錄錯誤

---

### 需求 5：截圖查詢端點

**使用者故事：** 身為使用者，我希望上傳截圖後能得到真實的風險分析結果。

#### 驗收標準

1. WHEN `POST /api/check/screenshot` 收到 `{ "query": "<base64_or_text>" }`，THE Server SHALL 呼叫 Adapter 的 `checkScreenshot` 函式
2. WHEN Adapter 回傳結果，THE Server SHALL 透過 Normalizer 將結果轉換為標準格式後回傳
3. IF Adapter 呼叫失敗，THEN THE Server SHALL 回傳 Mock_Provider 的 fallback 結果，並在 console 記錄錯誤

---

### 需求 6：回報端點

**使用者故事：** 身為使用者，我希望能夠回報詐騙案件並取得案件編號，以便後續追蹤。

#### 驗收標準

1. WHEN `POST /api/report` 收到 `{ "query": "<content>" }`，THE Server SHALL 呼叫 Adapter 的 `report` 函式
2. WHEN Adapter 回傳結果，THE Server SHALL 回傳 `{ ok: true, caseNo: "<case_number>" }` 格式的回應
3. IF Adapter 呼叫失敗，THEN THE Server SHALL 回傳 `{ ok: false, caseNo: null }` 並在 console 記錄錯誤
4. IF `query` 欄位為空字串，THEN THE Server SHALL 回傳 HTTP 400 與錯誤訊息 `{ error: "query 不得為空" }`

---

### 需求 7：健康檢查端點

**使用者故事：** 身為開發者，我希望能夠透過健康檢查端點確認伺服器與 API 連線狀態。

#### 驗收標準

1. WHEN `GET /api/health` 被呼叫，THE Server SHALL 回傳 `{ ok: true, provider: "<adapter_name>", mock: <boolean> }` 格式的回應
2. WHILE Server 使用 Mock_Provider，THE Server SHALL 在健康檢查回應中設定 `mock: true`
3. WHILE Server 使用真實 Adapter，THE Server SHALL 在健康檢查回應中設定 `mock: false` 與 `provider` 名稱

---

### 需求 8：Mock Provider（Fallback 機制）

**使用者故事：** 身為開發者，我希望在尚未接入真實 API 時，後端仍能正常運作並回傳合理的假資料，
讓前端開發不受阻礙。

#### 驗收標準

1. THE Mock_Provider SHALL 提供 `checkUrl`、`checkPhone`、`checkScreenshot`、`report` 四個函式，符合 Adapter 介面規範
2. WHEN Mock_Provider 的 `checkUrl` 被呼叫，THE Mock_Provider SHALL 根據 query 內容回傳對應的預設 Risk_Level 結果
3. WHEN Mock_Provider 的 `report` 被呼叫，THE Mock_Provider SHALL 回傳包含隨機產生的 `caseNo` 的結果
4. THE Mock_Provider SHALL 與真實 Adapter 共用相同的介面，使兩者可無縫切換

---

### 需求 9：Normalizer（回應格式正規化）

**使用者故事：** 身為開發者，我希望有一個集中的正規化函式，
讓不同外部 API 的回應格式都能被統一轉換為前端期望的格式。

#### 驗收標準

1. THE Normalizer SHALL 接受任意外部 API 回應物件，並回傳 `{ level, score, label, reasons }` 格式
2. WHEN 外部 API 回應缺少 `level` 欄位，THE Normalizer SHALL 將 `level` 預設為 `warn`
3. WHEN 外部 API 回應缺少 `score` 欄位，THE Normalizer SHALL 將 `score` 預設為 `50`
4. WHEN 外部 API 回應缺少 `reasons` 欄位，THE Normalizer SHALL 將 `reasons` 預設為空陣列 `[]`
5. IF 正規化後的 `level` 不屬於 `safe`、`promo`、`warn`、`scam`，THEN THE Normalizer SHALL 將 `level` 設為 `warn`
6. FOR ALL 有效的外部 API 回應，THE Normalizer 正規化後再次正規化 SHALL 產生相同結果（冪等性）
