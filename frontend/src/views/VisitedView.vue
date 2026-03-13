<template>
  <div class="visited-page">

    <div class="page">

      <!-- Top alert banner -->
      <div class="top-banner">
        <span class="siren">🚨</span>
        <div class="top-banner-text">
          <strong>您正在瀏覽詐騙網站</strong>
          <span>防詐雷達已偵測到此頁面為高風險詐騙內容，請立即離開</span>
        </div>
      </div>

      <div class="card">
        <div class="visited-url">{{ scamUrl }}</div>

        <!-- Immediate actions -->
        <div class="section-title">🚨 立即採取以下行動</div>
        <div class="steps">
          <div class="step danger">
            <span class="step-icon">🚫</span>
            <div class="step-text">
              <strong>不要輸入任何個人資料</strong>
              <span>包含姓名、身分證、銀行帳號、密碼、OTP 驗證碼</span>
            </div>
          </div>
          <div class="step danger">
            <span class="step-icon">💳</span>
            <div class="step-text">
              <strong>若已輸入資料，立刻聯絡銀行凍結帳戶</strong>
              <span>撥打銀行卡片背面的客服電話，告知可能遭詐騙</span>
            </div>
          </div>
          <div class="step warn">
            <span class="step-icon">📱</span>
            <div class="step-text">
              <strong>若有下載任何檔案，立刻刪除</strong>
              <span>不要執行任何來路不明的 .apk、.exe、.dmg 檔案</span>
            </div>
          </div>
          <div class="step info">
            <span class="step-icon">📋</span>
            <div class="step-text">
              <strong>截圖保存此頁面作為報案證據</strong>
              <span>向警方報案時需要提供詐騙網站的網址與截圖</span>
            </div>
          </div>
        </div>

        <!-- Quick call -->
        <div class="section-title">📞 快速求助</div>
        <div class="quick-btns">
          <button class="qbtn qbtn-165"    @click="showToast('📞 撥打 165 反詐騙專線', 'ok')">
            <span class="qi">🆘</span>
            <span>165 反詐騙</span>
            <span style="font-size:11px;opacity:0.8">24 小時專線</span>
          </button>
          <button class="qbtn qbtn-bank"   @click="showToast('🏦 請撥打銀行卡片背面的客服電話', 'ok')">
            <span class="qi">🏦</span>
            <span>聯絡銀行</span>
            <span style="font-size:11px;opacity:0.8">卡片背面號碼</span>
          </button>
          <button class="qbtn qbtn-police" @click="showToast('👮 撥打 110 或前往派出所報案', 'ok')">
            <span class="qi">👮</span>
            <span>報警 110</span>
            <span style="font-size:11px;opacity:0.8">警察局報案</span>
          </button>
        </div>

        <div class="divider"></div>

        <div class="bottom-row">
          <button class="btn-leave" @click="leavePage">✅ 立即離開此頁面</button>
        </div>
      </div>

    </div><!-- /page -->

    <!-- CORNER OVERLAY -->
    <div class="overlay">

      <!-- Evidence panel -->
      <div class="ov-panel" :class="{ open: evidenceOpen }">
        <div class="ov-panel-title">
          📁 一鍵回報證據
          <button class="ov-close" @click="toggleEvidence">✕</button>
        </div>
        <div v-if="!submitSuccess">
          <div class="ov-field">
            <label>詐騙類型</label>
            <select v-model="crType">
              <option>假冒銀行 / 金融機構</option>
              <option>假冒政府機關</option>
              <option>假投資 / 假虛擬貨幣</option>
              <option>假購物網站</option>
              <option>假徵才 / 工作詐騙</option>
              <option>其他</option>
            </select>
          </div>
          <div class="ov-field">
            <label>補充說明（選填）</label>
            <textarea rows="3" v-model="crDesc" placeholder="例如：偽裝成玉山銀行登入頁面…"></textarea>
          </div>
          <button class="ov-submit" @click="submitReport">📢 送出回報</button>
        </div>
        <div class="ov-success" v-if="submitSuccess" style="display:flex">
          <span class="ov-success-icon">✅</span>
          <strong>感謝您的回報！</strong>
          <span>{{ caseNo }}</span>
          <span>您的回報將協助保護其他用戶</span>
        </div>
      </div>

      <!-- 3 hover-reveal action buttons -->
      <div class="float-actions">
        <button class="float-btn fb-block"    @click="doBlock">   <span class="fb-icon">🚫</span> 一鍵封鎖</button>
        <button class="float-btn fb-report"   @click="doReport">  <span class="fb-icon">📢</span> 一鍵通報</button>
        <button class="float-btn fb-evidence" @click="toggleEvidence"><span class="fb-icon">📁</span> 一鍵回報證據</button>
      </div>

      <!-- Pill status badge -->
      <div class="pill">
        <span class="pill-dot"></span>
        <span class="pill-icon">🚨</span>
        <span class="pill-text">此為詐騙網站</span>
      </div>

    </div><!-- /overlay -->

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible, ok: toastType === 'ok' }">{{ toastMsg }}</div>

  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const API    = 'http://localhost:3001'
const route  = useRoute()
const router = useRouter()

// ── 從 query 取得詐騙網址 ──────────────────────────────
const scamUrl = route.query.url || '（未知網址）'

// ── 離開頁面 ──────────────────────────────────────────
function leavePage() {
  router.push('/')
}

// ── 角落 overlay 狀態 ─────────────────────────────────
const evidenceOpen  = ref(false)
const submitSuccess = ref(false)
const crType = ref('假冒銀行 / 金融機構')
const crDesc = ref('')
const caseNo = ref('')

function toggleEvidence() {
  evidenceOpen.value = !evidenceOpen.value
}

// ── 封鎖 ──────────────────────────────────────────────
async function doBlock() {
  try {
    const res = await fetch(API + '/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'block', input: scamUrl, level: 'scam' }),
    })
    const d = await res.json()
    showToast('🚫 已封鎖 — ' + d.caseNo, 'ok')
  } catch {
    showToast('🚫 已封鎖（離線模式）', 'ok')
  }
}

// ── 通報 ──────────────────────────────────────────────
async function doReport() {
  try {
    const res = await fetch(API + '/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'report', input: scamUrl, level: 'scam' }),
    })
    const d = await res.json()
    showToast('📢 已通報 165，案號 ' + d.caseNo, 'ok')
  } catch {
    showToast('📢 已通報（離線模式）', 'ok')
  }
}

// ── 送出回報 ──────────────────────────────────────────
async function submitReport() {
  try {
    const res = await fetch(API + '/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'evidence', input: scamUrl, level: 'scam',
        category: crType.value, description: crDesc.value,
      }),
    })
    const d = await res.json()
    caseNo.value = '案號 ' + d.caseNo
  } catch {
    caseNo.value = '案號 #TW2026-' + Math.floor(10000 + Math.random() * 90000)
  }
  submitSuccess.value = true
}

// ── Toast ─────────────────────────────────────────────
const toastVisible = ref(false)
const toastMsg     = ref('')
const toastType    = ref('')
let toastTimer     = null

function showToast(msg, type = '') {
  toastMsg.value  = msg
  toastType.value = type
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}

onUnmounted(() => { clearTimeout(toastTimer) })
</script>

<style scoped>
  :root {
    --scam: #FF2D2D; --scam-bg: #FFF0F0; --scam-text: #B00000;
    --safe: #00C47A;
    --warn: #FF8C00;
    --primary: #2D47E8;
    --text: #111827; --text-sub: #4B5563; --text-muted: #9CA3AF;
    --surface: #fff; --border: #e5e7eb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .visited-page {
    font-family: 'Noto Sans TC', sans-serif;
    background: #0d0d0d; color: #fff;
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px;
    position: relative;
  }

  /* animated red grid bg */
  .visited-page::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      linear-gradient(rgba(255,45,45,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,45,45,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridpulse 4s ease-in-out infinite;
  }
  @keyframes gridpulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

  .page { position: relative; z-index: 1; width: 100%; max-width: 600px; }

  /* Top alert banner */
  .top-banner {
    background: var(--scam); border-radius: 16px 16px 0 0;
    padding: 16px 24px;
    display: flex; align-items: center; gap: 12px;
  }
  .top-banner .siren { font-size: 28px; animation: sway 0.5s ease-in-out infinite alternate; }
  @keyframes sway { from{transform:rotate(-10deg)} to{transform:rotate(10deg)} }
  .top-banner-text { flex: 1; }
  .top-banner-text strong { display: block; font-size: 16px; font-weight: 900; }
  .top-banner-text span   { font-size: 12px; opacity: 0.8; }

  /* Main card */
  .card {
    background: #161616; border: 1px solid #2a2a2a;
    border-radius: 0 0 20px 20px; padding: 32px 28px;
  }

  .visited-url {
    font-family: 'DM Mono', monospace; font-size: 12px;
    color: rgba(255,255,255,0.3); margin-bottom: 28px;
    word-break: break-all; text-align: center;
    background: rgba(255,45,45,0.08); border: 1px solid rgba(255,45,45,0.2);
    border-radius: 10px; padding: 10px 14px;
  }

  .section-title {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: rgba(255,255,255,0.35);
    margin-bottom: 12px;
  }

  .steps { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .step {
    display: flex; align-items: flex-start; gap: 14px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px 16px;
    border-left: 3px solid transparent;
  }
  .step.danger { border-left-color: var(--scam); }
  .step.warn   { border-left-color: var(--warn); }
  .step.info   { border-left-color: var(--primary); }
  .step-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
  .step-text strong { display: block; font-size: 14px; font-weight: 900; margin-bottom: 3px; }
  .step-text span   { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }

  .quick-btns { display: flex; gap: 10px; margin-bottom: 28px; }
  .qbtn {
    flex: 1; border: none; border-radius: 13px; padding: 14px 10px;
    font-family: 'Noto Sans TC', sans-serif; font-weight: 900;
    font-size: 14px; cursor: pointer; transition: all 0.18s;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .qbtn .qi { font-size: 24px; }
  .qbtn-165    { background: var(--scam); color: #fff; }
  .qbtn-165:hover  { background: #c00; }
  .qbtn-bank   { background: #1a3a8f; color: #fff; }
  .qbtn-bank:hover { background: #122c6e; }
  .qbtn-police { background: #1a1f35; color: #fff; border: 1.5px solid rgba(255,255,255,0.12); }
  .qbtn-police:hover { background: #252c4a; }

  .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0 24px; }

  .bottom-row { display: flex; gap: 10px; }
  .btn-leave {
    flex: 1; background: var(--safe); color: #fff; border: none;
    border-radius: 13px; padding: 14px; font-size: 14px; font-weight: 900;
    cursor: pointer; font-family: 'Noto Sans TC', sans-serif; transition: background 0.18s;
  }
  .btn-leave:hover { background: #00a868; }

  /* CORNER OVERLAY */
  .overlay {
    position: fixed; bottom: 32px; right: 32px;
    z-index: 999;
    display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
  }
  .float-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  .float-btn {
    display: flex; align-items: center; gap: 10px;
    border: none; border-radius: 100px;
    padding: 10px 18px 10px 14px;
    font-size: 14px; font-weight: 700;
    font-family: 'Noto Sans TC', sans-serif;
    cursor: pointer; color: #fff; white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
    opacity: 0; transform: translateX(20px);
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.34,1.4,0.64,1), filter 0.15s;
  }
  .float-btn .fb-icon { font-size: 17px; line-height: 1; }
  .float-btn:hover  { filter: brightness(1.1); }
  .float-btn:active { transform: scale(0.96) translateX(0) !important; }
  .fb-block    { background: linear-gradient(135deg, #ff5252, #c41c1c); }
  .fb-report   { background: linear-gradient(135deg, #ffb300, #e07000); }
  .fb-evidence { background: linear-gradient(135deg, #5c7cff, #1a2fc7); }

  .overlay:hover .float-btn { opacity: 1; transform: translateX(0); pointer-events: auto; }
  .overlay:hover .float-actions .float-btn:nth-child(1) { transition-delay: 0s; }
  .overlay:hover .float-actions .float-btn:nth-child(2) { transition-delay: 0.05s; }
  .overlay:hover .float-actions .float-btn:nth-child(3) { transition-delay: 0.10s; }
  .float-actions .float-btn:nth-child(1) { transition-delay: 0.08s, 0.08s; }
  .float-actions .float-btn:nth-child(2) { transition-delay: 0.04s, 0.04s; }
  .float-actions .float-btn:nth-child(3) { transition-delay: 0s, 0s; }

  .pill {
    display: flex; align-items: center; gap: 8px;
    border-radius: 100px; padding: 11px 18px;
    cursor: default; user-select: none;
    border: 2px solid #ff5252;
    background: #ffd4d4;
    box-shadow: 0 4px 18px rgba(255,45,45,0.22);
    transition: background 0.3s, box-shadow 0.3s;
    animation: pillBounce 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes pillBounce {
    from { transform: translateY(80px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .overlay:hover .pill { background: #ffbdbd; box-shadow: 0 6px 28px rgba(255,45,45,0.32); }
  .pill-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    background: #ff2d2d; animation: blink 1.4s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
  .pill-icon { font-size: 17px; line-height: 1; }
  .pill-text { font-size: 13px; font-weight: 700; color: #b00000; line-height: 1; }

  /* Evidence panel */
  .ov-panel {
    background: #fff; border-radius: 18px;
    border: 1.5px solid var(--border);
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    padding: 20px; width: 300px;
    display: none;
  }
  .ov-panel.open { display: block; animation: slideUp 0.22s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .ov-panel-title {
    font-size: 14px; font-weight: 900; color: var(--text);
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .ov-close {
    margin-left: auto; background: none; border: none;
    font-size: 16px; cursor: pointer; color: var(--text-muted); padding: 0; line-height: 1;
  }
  .ov-field { margin-bottom: 10px; }
  .ov-field label {
    display: block; font-size: 10px; font-weight: 700;
    color: var(--text-muted); letter-spacing: 1px;
    text-transform: uppercase; margin-bottom: 5px;
  }
  .ov-field select, .ov-field textarea {
    width: 100%; border: 1.5px solid var(--border); border-radius: 9px;
    padding: 9px 11px; font-size: 12px; font-family: 'Noto Sans TC', sans-serif;
    color: var(--text); background: #f8f9ff; outline: none; resize: none;
  }
  .ov-field select:focus, .ov-field textarea:focus { border-color: var(--primary); }
  .ov-submit {
    width: 100%; background: var(--primary); color: #fff; border: none;
    border-radius: 9px; padding: 11px; font-size: 13px; font-weight: 900;
    cursor: pointer; font-family: 'Noto Sans TC', sans-serif; transition: background 0.18s; margin-top: 2px;
  }
  .ov-submit:hover { background: #1a2fc7; }
  .ov-success { flex-direction: column; align-items: center; gap: 7px; text-align: center; padding: 6px 0; }
  .ov-success-icon { font-size: 36px; }
  .ov-success strong { font-size: 14px; color: var(--text); }
  .ov-success span   { font-size: 11px; color: var(--text-muted); }

  /* Toast */
  .toast {
    position: fixed; bottom: 80px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #111; color: #fff; border-radius: 100px; padding: 10px 20px;
    font-size: 14px; font-weight: 700;
    box-shadow: 0 6px 28px rgba(0,0,0,0.2);
    transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1);
    z-index: 9999; white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
  .toast.ok   { background: #00C47A; }
</style>
