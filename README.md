# 防詐雷達 (AntiFraud Radar)

台灣反詐騙偵測工具，幫助使用者即時辨識可疑網址、電話號碼與截圖。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-built--in%20http-339933?logo=node.js)

---

## 功能特色

- 🔍 **自動偵測輸入類型** — 網址、電話號碼、截圖
- 🎯 **風險等級分析** — `safe` / `promo` / `warn` / `scam`，附分數與原因
- 🤖 **AI 深度分析** — Claude 詐騙手法分類、對策建議、舉報步驟
- 👴 **長輩模式** — 字體放大、介面簡化、隱藏次要資訊
- 🌙 **深色 / 亮色主題** — 自動偵測系統偏好
- 🔊 **語音朗讀 (TTS)** — 滑鼠懸停自動朗讀
- 🌐 **中英雙語** — 繁體中文 / English 即時切換
- 📊 **台灣詐騙統計** — 近 6 個月趨勢圖表

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3 (Composition API + `<script setup>`) |
| 建置工具 | Vite 7 |
| 路由 | Vue Router 4 |
| 圖表 | Chart.js 4 |
| AI 分析 | AWS Bedrock Claude（透過 API Gateway） |
| 詐騙資料庫 | 核心辨識模型 |

---

## 專案結構

```
/
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── App.vue
        ├── style.css          # 全域 CSS 變數（主題色、風險等級色）
        ├── router/
        ├── views/
        │   ├── HomeView.vue   # 首頁輸入 + 統計區
        │   ├── ResultView.vue # 分析結果頁（雙欄）
        │   ├── AiView.vue     # AI 深度分析頁
        │   ├── VisitedView.vue# 詐騙網站警告頁
        │   ├── BlockedView.vue
        │   └── ContributeView.vue
        ├── components/
        │   ├── NavLogo.vue
        │   ├── TTSToggle.vue
        │   ├── LangToggle.vue
        │   ├── PhoneInput.vue
        │   └── OnboardingTour.vue
        └── composables/
            ├── useTheme.js
            ├── useElder.js
            ├── useVoice.js
            ├── useLocale.js
            └── useResult.js
```

---

## 快速開始

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 環境變數（選填）

在 `frontend/.env` 設定 API 端點，預設使用 AWS：

```env
VITE_API_BASE=https://ohep7v33l0.execute-api.us-east-1.amazonaws.com/prod
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查 |
| POST | `/api/check/url` | 檢查網址 |
| POST | `/api/report`（`type: llm`, `subtype: phone`） | Claude 電話風險分析 |
| POST | `/api/check/screenshot` | 檢查截圖 |
| POST | `/api/report` | 通報 / 封鎖 / 提交證據 |

所有 POST body：`{ "query": "<input>" }`
回應格式：`{ level, score, label, reasons }` 或 `{ ok, caseNo }`

---

## 風險等級

| 等級 | 說明 |
|------|------|
| `safe` | 安全 |
| `promo` | 促銷推廣 |
| `warn` | 可疑，請謹慎 |
| `scam` | 詐騙，強烈警告 |

---

## Chrome 擴充功能

下載 `ToF-chrome.zip`，解壓縮後在 Chrome 開啟「開發人員模式」，選擇「載入未封裝項目」即可安裝。

## 開發驗證

```bash
cd frontend
npm test
npm run build
```

介面統一以「核心辨識模型」（Core Recognition Model）顯示辨識來源；為相容既有後端，API 回應的 `ggl` 欄位維持不變。
統計區僅顯示 API 回傳的最新月份資料，月份名稱可由 `monthLabel` 提供；載入失敗時顯示提示，不使用固定數字替代。

電話查詢僅使用 Claude phone handler，結果頁不顯示核心辨識模型分數。後端的 `subtype: phone` 處理器應只呼叫 Claude；此儲存庫僅包含前端，未包含 AWS 後端實作。

電話號碼會保留使用者輸入的格式（僅去除首尾空白），不自動補國碼或移除開頭的 0。需要國碼時請自行輸入。

輸入區提供網址、文字、電話及截圖選項，文字支援中文與多行內容（Ctrl／Command + Enter 送出）。截圖每次分析一張，支援預覽與更換；檔案上限 10 MB，前端會縮放至最長邊 2048 像素並轉成白底 JPEG。
