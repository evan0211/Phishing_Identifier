# Tech Stack

## Frontend
- Vue 3 (Composition API with `<script setup>`)
- Vue Router 4
- Vite 7 (build tool)
- No CSS framework — all styles are scoped per-component using CSS custom properties
- Web Speech API for TTS (`window.speechSynthesis`)

## Backend
- Node.js with the built-in `http` module (no Express)
- Mock API only — data is hardcoded in `URL_DB` and `PHONE_DB` objects
- Runs on port 3001

## Common Commands

```bash
# Frontend (run from /frontend)
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview production build

# Backend (run from /Backend)
node server.js    # start mock API on http://localhost:3001
```

## API Endpoints (Mock)
- `GET  /api/health` — health check
- `POST /api/check/url` — check a URL
- `POST /api/check/phone` — check a phone number
- `POST /api/check/screenshot` — check a screenshot (always returns scam result)
- `POST /api/report` — report/block/evidence submission (returns a case number)

All POST bodies: `{ "query": "<input>" }`
All responses: `{ level, score, label, reasons }` or `{ ok, caseNo }` for reports

## Risk Levels
`safe` | `promo` | `warn` | `scam`
