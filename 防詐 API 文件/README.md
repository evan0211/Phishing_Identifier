# AWS Hackathon 2026 詐騙識別防範 參賽者文件

本目錄包含 AWS Hackathon 2026 詐騙識別防範 API 的參賽者文件，提供三個工具型 API 供各隊使用。

活動官網：[AWS Hackathon 2026 詐騙識別防範](https://www.ai-expo.tw/kiro_hackathon_2026/index.asp)

---

## 取得 API Key

API Key 將透過 **email** 寄送至各隊聯絡信箱。

收到後請妥善保管，**請勿將 API Key 公開或上傳至版本控制系統**。

---

## 可用 API

| API | Endpoint | 狀態 | 說明 |
|-----|----------|------|------|
| 網址網域風險查詢 | `POST /url-check` | ✅ 已上線 | 查詢指定 URL 的信譽分析 |
| 電話號碼查詢 | `GET /number-check/{country}/{number}` | ✅ 已上線 | 查詢電話號碼資訊 |
| 內容風險 (截圖) 查詢 | `POST /content-check`、`GET /content-check/{job_id}` | ✅ 已上線 | 上傳截圖並查詢風險結果 |

**Base URL**：`https://hljaj2f6gf.execute-api.ap-northeast-1.amazonaws.com/prod`

---

## API 文件

每個 API 各有一份詳細說明，包含請求格式、錯誤碼、Rate Limit 說明：

- [url_check.md](api_doc/url_check.md) — 網址網域風險查詢（✅ 已上線）
- [number_check.md](api_doc/number_check.md) — 電話號碼查詢（✅ 已上線）
- [content_check.md](api_doc/content_check.md) — 內容風險 (截圖) 查詢（✅ 已上線）

---

## Postman Collection

提供 Postman Collection 檔案，可直接匯入使用：

1. 開啟 Postman → Import → 選擇下方對應 `.json` 檔案
2. 匯入後，在 Collection 的 **Variables** 分頁將 `api_key` 改為你的 API Key
3. 即可執行各請求

| 檔案 | 對應 API |
|------|----------|
| [url_check.postman_collection.json](postman/url_check.postman_collection.json) | 網址網域風險查詢 |
| [number_check.postman_collection.json](postman/number_check.postman_collection.json) | 電話號碼查詢 |
| [content_check.postman_collection.json](postman/content_check.postman_collection.json) | 內容風險 (截圖) 查詢 |

---

## 快速範例

```bash
# 網址網域風險查詢
curl -X POST "https://hljaj2f6gf.execute-api.ap-northeast-1.amazonaws.com/prod/url-check" \
  -H "x-api-key: <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://aws.amazon.com"}'
```

---

## Rate Limit 總覽

| API | 穩定速率 | Burst |
|-----|----------|-------|
| `/url-check` | 1 RPS | 2 |
| `/number-check` | 1 RPS | 2 |
| `/content-check` | 20 RPM | 3 |

超過限制時回傳 `429 Too Many Requests`，稍待後可重試。

---

## 除錯

每個 response 都包含 `x-adapter-request-id` header，值為此次請求的唯一 ID。

若遇到問題，請將此 ID 附上回報給主辦方，以便協助追蹤問題。
