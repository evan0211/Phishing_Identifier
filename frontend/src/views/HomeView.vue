<template>
  <div :class="['page-wrap', { 'panel-open': isPanelOpen, 'elder': isElder }, mode + '-mode']">

    <!-- API 狀態列 -->
    <div class="api-bar">
      <div class="api-status">
        <div class="api-dot" :class="apiOnline ? 'online' : 'offline'"></div>
        <span>{{ apiStatusText }}</span>
        <span class="api-url">localhost:3001</span>
      </div>
    </div>

    <!-- 長輩模式列 -->
    <div class="elder-bar">
      <span>防詐雷達 本地 DEMO</span>
      <button class="elder-toggle" @click="toggleElder">
        <span>👴</span><span>{{ isElder ? '關閉長輩模式' : '長輩模式' }}</span>
      </button>
    </div>

    <!-- HEADER -->
    <header>
      <div class="shield">🛡️</div>
      <h1>防詐<span>雷達</span></h1>
      <p>貼上連結、輸入電話、或上傳截圖<br>即時分析風險，守護您的數位安全</p>
    </header>

    <!-- SCENE -->
    <div class="scene">
      <div class="cols-wrap">

        <!-- LEFT COLUMN -->
        <div class="left-col">

          <!-- Input card -->
          <div class="input-card">
            <div class="tabs">
              <div class="tab" :class="{ active: currentTab === 0 }" @click="switchTab(0)">
                <span class="ti">🔗</span>貼上連結
              </div>
              <div class="tab" :class="{ active: currentTab === 1 }" @click="switchTab(1)">
                <span class="ti">📞</span>輸入號碼
              </div>
              <div class="tab" :class="{ active: currentTab === 2 }" @click="switchTab(2)">
                <span class="ti">📸</span>上傳截圖
              </div>
            </div>

            <!-- Tab 0: URL -->
            <div class="panel" :class="{ active: currentTab === 0 }">
              <div class="plabel">⬇ 步驟一：貼上可疑連結或訊息</div>
              <div class="input-wrap">
                <textarea class="big-input" v-model="urlInput" rows="3"
                  placeholder="把可疑的網址或訊息貼到這裡&#10;例如：https://bank-tw-login.verify-now.xyz/confirm?id=88321"></textarea>
                <button class="paste-btn" @click="doPaste">📋 貼上</button>
              </div>
              <div class="chips">
                <div class="chip" @click="demo('url','scam')">🚨 詐騙範例</div>
                <div class="chip" @click="demo('url','promo')">📣 推銷範例</div>
                <div class="chip" @click="demo('url','safe')">✅ 安全範例</div>
              </div>
              <button class="check-btn" :class="{ loading: loadingUrl }" :disabled="loadingUrl" @click="check('url')">
                <div class="btn-spinner"></div>
                <span class="btn-text">🔍 立即檢測</span>
              </button>
            </div>

            <!-- Tab 1: Phone -->
            <div class="panel" :class="{ active: currentTab === 1 }">
              <div class="plabel">⬇ 步驟一：輸入可疑電話號碼</div>
              <div class="phone-row">
                <div class="ctag">🇹🇼 +886</div>
                <input class="phone-input" v-model="phoneInput" type="tel" placeholder="0912-345-678" maxlength="12">
              </div>
              <div class="chips">
                <div class="chip" @click="demo('phone','scam')">🚨 詐騙範例</div>
                <div class="chip" @click="demo('phone','warn')">⚠️ 可疑範例</div>
                <div class="chip" @click="demo('phone','safe')">✅ 安全範例</div>
              </div>
              <button class="check-btn" :class="{ loading: loadingPhone }" :disabled="loadingPhone" @click="check('phone')">
                <div class="btn-spinner"></div>
                <span class="btn-text">🔍 立即檢測</span>
              </button>
            </div>

            <!-- Tab 2: Screenshot -->
            <div class="panel" :class="{ active: currentTab === 2 }">
              <div class="plabel">⬇ 步驟一：上傳可疑截圖</div>
              <div class="upload-zone" :class="{ drag: isDragging }"
                   @dragover.prevent="isDragging = true"
                   @dragleave="isDragging = false"
                   @drop="dropFile">
                <input type="file" accept="image/*" @change="pickFile">
                <div class="uicon">📷</div>
                <div class="utitle">點擊或拖曳截圖到此</div>
                <div class="usub">支援 JPG、PNG、WEBP，最大 10MB</div>
                <div class="uprev" v-if="previewSrc">
                  <img :src="previewSrc" alt="">
                </div>
              </div>
              <button class="check-btn" :class="{ loading: loadingSS }" :disabled="loadingSS" @click="check('screenshot')">
                <div class="btn-spinner"></div>
                <span class="btn-text">🔍 立即分析截圖</span>
              </button>
            </div>

          </div><!-- /input-card -->

          <!-- Next steps card -->
          <div class="next-card">
            <div class="np-title">🧭 下一步建議</div>
            <div class="next-steps-grid">
              <div class="nsi" v-for="(s, i) in nextSteps" :key="i">
                <span class="nsi-icon">{{ s.i }}</span>
                <span class="nsi-text">
                  <strong>{{ s.t }}</strong>
                  <span>{{ s.s }}</span>
                </span>
              </div>
            </div>
          </div>

        </div><!-- /left-col -->

        <!-- RIGHT COLUMN -->
        <div class="right-col">
          <div class="result-card" :class="mode">

            <div class="rc-banner">
              <button class="rc-close" @click="closePanel">✕</button>
              <div class="rc-badge">
                <span class="b-icon">{{ ICONS[mode] || '⚠️' }}</span>
                <span class="b-score">{{ result.score }}</span>
              </div>
              <div class="rc-info">
                <div class="rc-tag">{{ TAGS[mode] || mode }}</div>
                <div class="rc-title">{{ result.label }}</div>
                <div class="rc-input-lbl">{{ lastInput }}</div>
              </div>
            </div>

            <div class="rc-bar-wrap">
              <div class="rc-bar-labels"><span>安全 0</span><span>100 高風險</span></div>
              <div class="rc-bar-track">
                <div class="rc-bar-fill" :style="{ width: barWidth + '%' }"></div>
              </div>
            </div>

            <div class="rc-reasons-wrap">
              <div class="sec-title">📋 分析原因</div>
              <ul class="reasons">
                <li v-for="(r, i) in result.reasons" :key="i">
                  <span class="ri">{{ RI(mode) }}</span>{{ r }}
                </li>
              </ul>
            </div>

            <div class="rc-visit-wrap" v-if="currentTab === 0">
              <div class="visit-warning" :class="{ show: mode === 'scam' }">
                ⚠️ <strong>警告：</strong>此網站已被標記為詐騙，強烈不建議前往。
              </div>
              <button class="visit-btn show" :class="{ 'safe-visit': mode === 'safe' }" @click="confirmVisit">
                {{ mode === 'safe' ? '🔗 前往此網站' : '⚠️ 仍要前往此網站（不建議）' }}
              </button>
            </div>

            <div class="rc-actions-wrap">
              <div class="sec-title">⚡ 立即行動</div>
              <div class="rc-actions">
                <button class="act-btn btn-block"    @click="doAction('block')">
                  <span class="ai">🚫</span>
                  <span class="act-t">一鍵封鎖</span>
                  <span class="act-s">加入黑名單，下次自動攔截</span>
                </button>
                <button class="act-btn btn-report"   @click="doAction('report')">
                  <span class="ai">📢</span>
                  <span class="act-t">一鍵通報</span>
                  <span class="act-s">通報至 165 反詐騙資料庫</span>
                </button>
                <button class="act-btn btn-evidence" @click="doAction('evidence')">
                  <span class="ai">📁</span>
                  <span class="act-t">一鍵回報證據</span>
                  <span class="act-s">截圖上傳，協助案件調查</span>
                </button>
              </div>
            </div>

            <!-- Confirm overlay -->
            <div class="confirm-overlay" :class="{ show: showConfirmOverlay }">
              <div class="confirm-icon">⚠️</div>
              <div class="confirm-title">{{ confirmData.title }}</div>
              <div class="confirm-sub">{{ confirmData.sub }}</div>
              <div class="confirm-btns">
                <button class="confirm-cancel" @click="closeConfirm">取消</button>
                <button class="confirm-ok" @click="confirmData.cb && confirmData.cb()">{{ confirmData.ok }}</button>
              </div>
            </div>

          </div><!-- /result-card -->
        </div><!-- /right-col -->

      </div><!-- /cols-wrap -->
    </div><!-- /scene -->

    <!-- Mobile dim overlay -->
    <div class="mobile-dim" @click="closePanel"></div>

    <!-- Toast -->
    <div class="toast" :class="['toast', { show: toastVisible }, toastType]">{{ toastMsg }}</div>

    <!-- FULLSCREEN SCAM WARNING -->
    <div class="scam-fullscreen" :class="{ show: showScamFullscreen }">
      <div class="sf-stripes"></div>
      <div class="sf-inner">
        <span class="sf-siren">🚨</span>
        <div class="sf-badge">⛔ 詐騙網站警告</div>
        <div class="sf-title">您即將進入<span>詐騙網站</span></div>
        <div class="sf-url">{{ lastInput }}</div>
        <div class="sf-risks">
          <div class="sf-risk-item"><span class="ricon">💳</span>您的銀行帳號、密碼可能被竊取</div>
          <div class="sf-risk-item"><span class="ricon">🪪</span>個人身分資料可能遭冒用</div>
          <div class="sf-risk-item"><span class="ricon">📱</span>裝置可能被植入惡意程式</div>
          <div class="sf-risk-item"><span class="ricon">💸</span>財產損失風險極高</div>
        </div>
        <div class="sf-btns">
          <button class="sf-cancel" @click="closeScamFullscreen">✅ 離開，保護自己</button>
          <div class="sf-slider-wrap" ref="sliderWrap" :class="{ completed: sliderCompleted }">
            <div class="sf-slider-fill"  ref="sliderFill"></div>
            <div class="sf-slider-track-label">← 向右滑動以仍要前往（不建議）</div>
            <div class="sf-slider-thumb" ref="sliderThumb"
                 @mousedown="sliderMouseDown"
                 @touchstart="sliderTouchStart">⚠️</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// ── 常數 ──────────────────────────────────────────────
const API = 'http://localhost:3001'

const ICONS = { safe: '✅', promo: '📣', warn: '⚠️', scam: '🚨' }
const TAGS  = { safe: '安全', promo: '推銷（安全）', warn: '推銷（可疑）', scam: '詐騙' }
const RI    = lv => lv === 'scam' ? '🔴' : lv === 'warn' ? '🟡' : '🟢'
const NEXT  = {
  safe:  [{ i: '✅', t: '可以安全瀏覽',       s: '此來源無詐騙紀錄，請放心。' }],
  promo: [{ i: '📋', t: '確認是否為您主動訂閱', s: '若非本人訂閱，可封鎖。' },
          { i: '🔕', t: '不需要可直接封鎖',    s: '點選一鍵封鎖加入黑名單。' }],
  warn:  [{ i: '⛔', t: '不要點擊連結',       s: '可疑推銷常隱藏惡意導向。' },
          { i: '👨‍👩‍👧', t: '詢問家人或朋友確認', s: '讓信任的人幫你確認。' },
          { i: '📢', t: '建議通報',           s: '協助保護其他可能受害者。' }],
  scam:  [{ i: '🚫', t: '立即停止任何操作',   s: '不要點擊、不要輸入資料。' },
          { i: '💳', t: '立刻聯絡銀行',       s: '撥卡片背面號碼申請凍結。' },
          { i: '📞', t: '撥打 165 反詐騙',   s: '24 小時，由專人協助。' },
          { i: '👮', t: '向警察局報案',       s: '保留截圖向派出所報案。' }],
}
const DEMOS = {
  url:   { scam: 'https://bank-tw-login.verify-now.xyz/confirm?id=88321', promo: 'http://lin.ee/abc123-gift-claim-free', safe: 'https://www.esun.com.tw/index.html' },
  phone: { scam: '0200-123-456', warn: '0900-456-789', safe: '0800-221-314' },
}
const ACT = {
  block:    { title: '確認封鎖？',     sub: '此來源將加入黑名單，下次自動攔截。',        ok: '確認封鎖' },
  report:   { title: '確認通報？',     sub: '將通報至 165 反詐騙資料庫，保護其他用戶。', ok: '確認通報' },
  evidence: { title: '確認上傳證據？', sub: '將截圖與相關資訊上傳至案件資料庫。',        ok: '確認上傳' },
}

// ── Router ────────────────────────────────────────────
const router = useRouter()

// ── 狀態 ──────────────────────────────────────────────
const isPanelOpen  = ref(false)
const mode         = ref('')           // 'safe' | 'promo' | 'warn' | 'scam'
const isElder      = ref(false)
const currentTab   = ref(0)

// API 狀態
const apiOnline    = ref(false)
const apiStatusText = ref('檢查連線中…')
let healthTimer    = null

// 輸入欄位
const urlInput     = ref('')
const phoneInput   = ref('')
const previewSrc   = ref('')
const isDragging   = ref(false)
const hasFile      = ref(false)

// Loading 狀態（各 tab 各自一個）
const loadingUrl   = ref(false)
const loadingPhone = ref(false)
const loadingSS    = ref(false)

// 結果
const result       = ref({ score: 0, label: '', reasons: [] })
const lastInput    = ref('')
const barWidth     = ref(0)
const nextSteps    = ref([])

// Toast
const toastVisible = ref(false)
const toastMsg     = ref('')
const toastType    = ref('')
let toastTimer     = null

// Confirm overlay
const showConfirmOverlay = ref(false)
const confirmData = ref({ title: '', sub: '', ok: '', cb: null })

// Scam fullscreen
const showScamFullscreen = ref(false)

// Slider refs
const sliderWrap  = ref(null)
const sliderFill  = ref(null)
const sliderThumb = ref(null)
const sliderCompleted = ref(false)
let sliderDone = false

// ── API 健康檢查 ───────────────────────────────────────
async function checkHealth() {
  try {
    const r = await fetch(API + '/api/health', { signal: AbortSignal.timeout(2000) })
    apiOnline.value = r.ok
    apiStatusText.value = r.ok ? 'API 連線正常 ✓' : 'API 離線'
  } catch {
    apiOnline.value = false
    apiStatusText.value = 'API 離線 — 請啟動 server.js'
  }
}

// ── Tab 切換 ──────────────────────────────────────────
function switchTab(i) {
  currentTab.value = i
}

// ── 貼上 ──────────────────────────────────────────────
async function doPaste() {
  try {
    urlInput.value = await navigator.clipboard.readText()
    showToast('✅ 已貼上', 'ok')
  } catch {
    showToast('請手動貼上', 'err')
  }
}

// ── Demo 範例 ─────────────────────────────────────────
function demo(t, l) {
  if (t === 'url') {
    urlInput.value = DEMOS.url[l]
    check('url')
  } else {
    phoneInput.value = DEMOS.phone[l]
    check('phone')
  }
}

// ── 截圖上傳 ──────────────────────────────────────────
function dropFile(e) {
  e.preventDefault()
  isDragging.value = false
  showPreview(e.dataTransfer.files[0])
}
function pickFile(e) {
  showPreview(e.target.files[0])
}
function showPreview(f) {
  if (!f) return
  const r = new FileReader()
  r.onload = e => { previewSrc.value = e.target.result }
  r.readAsDataURL(f)
  hasFile.value = true
  showToast('📷 截圖已載入', 'ok')
}

// ── 檢測 ──────────────────────────────────────────────
async function check(type) {
  const q = type === 'url'   ? urlInput.value.trim()
          : type === 'phone' ? phoneInput.value.trim()
          : hasFile.value    ? '(screenshot)' : ''

  if (!q) { showToast('⚠️ 請先輸入內容', 'err'); return }

  // 設定 loading
  if (type === 'url')        loadingUrl.value = true
  else if (type === 'phone') loadingPhone.value = true
  else                       loadingSS.value = true

  try {
    const ep = type === 'screenshot' ? '/api/check/screenshot'
             : type === 'phone'      ? '/api/check/phone'
             : '/api/check/url'
    const res  = await fetch(API + ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })
    const data = await res.json()
    lastInput.value = q
    openPanel(data)
  } catch {
    showToast('❌ 無法連接 API — 請確認 server.js 已啟動', 'err')
  } finally {
    if (type === 'url')        loadingUrl.value = false
    else if (type === 'phone') loadingPhone.value = false
    else                       loadingSS.value = false
  }
}

// ── Panel 開關 ────────────────────────────────────────
function openPanel(data) {
  result.value = {
    score:   data.score   || 0,
    label:   data.label   || '',
    reasons: data.reasons || [],
  }
  mode.value = data.level
  nextSteps.value = NEXT[data.level] || []
  showConfirmOverlay.value = false
  isPanelOpen.value = true

  // 進度條動畫
  barWidth.value = 0
  setTimeout(() => { barWidth.value = data.score }, 80)
}

function closePanel() {
  isPanelOpen.value = false
  mode.value = ''
}

// ── 前往網站 ──────────────────────────────────────────
function confirmVisit() {
  if (mode.value === 'safe') {
    window.open(lastInput.value, '_blank', 'noopener')
    return
  }
  if (mode.value === 'scam') {
    openScamFullscreen()
    return
  }
  showConfirm('⚠️ 確定前往此網站？', '此網站被標記為可疑，前往請謹慎。', '仍要前往', () => {
    window.open(lastInput.value, '_blank', 'noopener')
    closeConfirm()
  })
}

// ── Scam 全螢幕警告 ───────────────────────────────────
function openScamFullscreen() {
  showScamFullscreen.value = true
  document.body.style.overflow = 'hidden'
  initSlider()
}
function closeScamFullscreen() {
  showScamFullscreen.value = false
  document.body.style.overflow = ''
  resetSlider()
}
function proceedToScam() {
  closeScamFullscreen()
  router.push({ path: '/visited', query: { url: lastInput.value } })
}

// ── Slider ────────────────────────────────────────────
function initSlider() {
  sliderCompleted.value = false
  sliderDone = false
  if (sliderThumb.value) sliderThumb.value.style.left = '4px'
  if (sliderFill.value)  sliderFill.value.style.width = '0%'
}

function sliderMouseDown(e) {
  e.preventDefault()
  document.addEventListener('mousemove', onSliderMouseMove)
  document.addEventListener('mouseup', onSliderMouseUp)
}
function sliderTouchStart() {
  document.addEventListener('touchmove', onSliderTouchMove, { passive: true })
  document.addEventListener('touchend', onSliderTouchEnd)
}

function onSliderMouseMove(e) { sliderMove(e.clientX) }
function onSliderTouchMove(e) { sliderMove(e.touches[0].clientX) }
function onSliderMouseUp()  { sliderCleanup(); if (!sliderDone) resetSlider() }
function onSliderTouchEnd() { sliderCleanup(); if (!sliderDone) resetSlider() }

function sliderCleanup() {
  document.removeEventListener('mousemove', onSliderMouseMove)
  document.removeEventListener('mouseup',   onSliderMouseUp)
  document.removeEventListener('touchmove', onSliderTouchMove)
  document.removeEventListener('touchend',  onSliderTouchEnd)
}

function sliderMove(clientX) {
  if (sliderDone || !sliderWrap.value) return
  const thumbW = sliderThumb.value.offsetWidth
  const trackW = sliderWrap.value.offsetWidth - thumbW - 8
  const rect = sliderWrap.value.getBoundingClientRect()
  let x = clientX - rect.left - 22
  x = Math.max(4, Math.min(x, trackW + 4))
  sliderThumb.value.style.left = x + 'px'
  const pct = ((x - 4) / trackW) * 100
  sliderFill.value.style.width = pct + '%'
  if (pct >= 98) sliderComplete()
}

function sliderComplete() {
  if (sliderDone) return
  sliderDone = true
  sliderCompleted.value = true
  setTimeout(proceedToScam, 400)
}

function resetSlider() {
  if (!sliderThumb.value) return
  sliderThumb.value.style.transition = 'left 0.3s ease'
  sliderFill.value.style.transition  = 'width 0.3s ease'
  sliderThumb.value.style.left = '4px'
  sliderFill.value.style.width = '0%'
  sliderCompleted.value = false
  setTimeout(() => {
    if (sliderThumb.value) sliderThumb.value.style.transition = ''
    if (sliderFill.value)  sliderFill.value.style.transition  = ''
  }, 300)
}

// ── 行動按鈕（封鎖、通報、回報） ──────────────────────
async function doAction(type) {
  const c = ACT[type]
  showConfirm(c.title, c.sub, c.ok, async () => {
    closeConfirm()
    try {
      const res = await fetch(API + '/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, input: lastInput.value, level: mode.value }),
      })
      const d = await res.json()
      const msgs = {
        block:    '🚫 已封鎖 — ' + d.caseNo,
        report:   '📢 已通報 165，案號 ' + d.caseNo,
        evidence: '📁 證據已上傳，案號 ' + d.caseNo,
      }
      showToast(msgs[type], 'ok')
    } catch {
      showToast('❌ 操作失敗', 'err')
    }
  })
}

// ── Confirm overlay ───────────────────────────────────
function showConfirm(title, sub, ok, cb) {
  confirmData.value = { title, sub, ok, cb }
  showConfirmOverlay.value = true
}
function closeConfirm() {
  showConfirmOverlay.value = false
}

// ── 長輩模式 ──────────────────────────────────────────
function toggleElder() {
  isElder.value = !isElder.value
  showToast(isElder.value ? '👴 長輩模式已開啟' : '長輩模式已關閉', 'ok')
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg, type = '') {
  toastMsg.value = msg
  toastType.value = type
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}

// ── 生命週期 ──────────────────────────────────────────
onMounted(() => {
  checkHealth()
  healthTimer = setInterval(checkHealth, 5000)
})

onUnmounted(() => {
  clearInterval(healthTimer)
  clearTimeout(toastTimer)
  sliderCleanup()
  document.body.style.overflow = ''
})
</script>

<style>
  :root {
    --bg: #F0F4FF;
    --surface: #FFFFFF;
    --surface2: #EEF2FF;
    --border: #D6DFFF;
    --primary: #2D47E8;
    --primary-dark: #1A2FC7;
    --primary-light: #E8ECFF;
    --text: #111827;
    --text-sub: #4B5563;
    --text-muted: #9CA3AF;
    --safe:  #00C47A; --safe-bg:  #EDFFF6; --safe-text:  #007A4C;
    --promo: #2D87E8; --promo-bg: #EEF6FF; --promo-text: #1255B0;
    --warn:  #FF8C00; --warn-bg:  #FFF8EC; --warn-text:  #A05500;
    --scam:  #FF2D2D; --scam-bg:  #FFF0F0; --scam-text:  #B00000;
    --radius: 20px;
    --left-w: 560px;
    --right-w: 460px;
    --gap: 16px;
    --anim: 0.42s cubic-bezier(0.32, 0.72, 0, 1);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page-wrap { font-family: 'Noto Sans TC', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  /* ── TOP BARS ── */
  .api-bar {
    background: #1a1f35; padding: 7px 20px;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; color: rgba(255,255,255,0.55);
  }
  .api-status { display: flex; align-items: center; gap: 6px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .api-dot { width: 7px; height: 7px; border-radius: 50%; background: #555; transition: background 0.3s; }
  .api-dot.online  { background: #00C47A; box-shadow: 0 0 6px #00C47A88; }
  .api-dot.offline { background: #FF2D2D; }
  .api-url { font-family: 'DM Mono', monospace; color: rgba(255,255,255,0.3); }
  .elder-bar {
    background: var(--primary); padding: 9px 20px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 200;
  }
  .elder-bar > span { color: rgba(255,255,255,0.8); font-size: 13px; }
  .elder-toggle {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.3);
    border-radius: 100px; padding: 5px 14px;
    color: #fff; font-size: 13px; font-weight: 700;
    cursor: pointer; user-select: none; transition: background 0.2s;
  }
  .elder-toggle:hover { background: rgba(255,255,255,0.25); }

  /* ── HEADER — always centered ── */
  header { text-align: center; padding: 36px 24px 24px; }
  .shield {
    width: 68px; height: 68px; background: var(--primary); border-radius: 20px;
    display: flex; align-items: center; justify-content: center; font-size: 34px;
    margin: 0 auto 14px; box-shadow: 0 8px 30px rgba(45,71,232,0.28);
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  header h1 { font-size: 30px; font-weight: 900; letter-spacing: -0.5px; }
  header h1 span { color: var(--primary); }
  header p { margin-top: 6px; font-size: 14px; color: var(--text-sub); line-height: 1.6; }

  /* ══════════════════════════════════════
     TWO-COLUMN LAYOUT
     cols-wrap = exactly left-col wide → flex-centers it.
     right-col is position:absolute so it never affects layout.
     When panel opens, cols-wrap shifts left by half of
     (right-w + gap) so the pair is centered together.
     ══════════════════════════════════════ */
  .scene {
    display: flex;
    justify-content: center;
    padding: 0 24px 48px;
    overflow: hidden;   /* clip the right-col while it's sliding */
  }

  .cols-wrap {
    position: relative;
    width: var(--left-w);   /* only as wide as left col → auto-centers */
    transition: transform var(--anim);
    transform: translateX(0);
  }
  .page-wrap.panel-open .cols-wrap {
    transform: translateX(calc((var(--right-w) + var(--gap)) * -0.5));
  }

  /* ── LEFT COLUMN ── */
  .left-col {
    width: var(--left-w);
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    position: relative;
    z-index: 2;
  }

  /* ── RIGHT COLUMN — absolute, never affects layout width ── */
  .right-col {
    position: absolute;
    top: 0;
    left: calc(var(--left-w) + var(--gap));
    width: var(--right-w);
    /* match left-col height */
    bottom: 0;
    display: flex;
    flex-direction: column;
    /* Hidden: slide it back behind left col */
    transform: translateX(calc(-1 * (var(--right-w) + var(--gap) + var(--left-w))));
    opacity: 0;
    pointer-events: none;
    transition: transform var(--anim), opacity 0.28s ease;
    z-index: 1;
  }
  .page-wrap.panel-open .right-col {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* ── INPUT CARD ── */
  .input-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    box-shadow: 0 4px 32px rgba(45,71,232,0.07);
    overflow: hidden;
    transition: box-shadow var(--anim);
  }
  .page-wrap.panel-open .input-card {
    box-shadow: -4px 4px 24px rgba(45,71,232,0.10);
  }

  /* ── NEXT STEPS CARD ── */
  .next-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    box-shadow: 0 4px 24px rgba(45,71,232,0.06);
    padding: 18px 20px;
    /* Hidden until result opens */
    opacity: 0;
    transform: translateY(14px);
    pointer-events: none;
    transition: opacity 0.32s ease 0.08s, transform 0.32s ease 0.08s;
    flex: 1;  /* grows to fill remaining left-col height */
    display: flex;
    flex-direction: column;
  }
  .page-wrap.panel-open .next-card {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .np-title {
    font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;
  }
  .next-steps-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    flex: 1;
  }
  .nsi {
    display: flex; align-items: flex-start; gap: 9px;
    background: var(--surface2); border-radius: 12px;
    padding: 10px 12px;
    border-left: 3px solid transparent;
  }
  .page-wrap.safe-mode  .nsi { border-left-color: var(--safe); }
  .page-wrap.promo-mode .nsi { border-left-color: var(--promo); }
  .page-wrap.warn-mode  .nsi { border-left-color: var(--warn); }
  .page-wrap.scam-mode  .nsi { border-left-color: var(--scam); }
  .nsi-icon { font-size: 18px; flex-shrink: 0; }
  .nsi-text strong { display: block; font-size: 13px; color: var(--text); line-height: 1.3; }
  .nsi-text span   { display: block; font-size: 11px; color: var(--text-sub); margin-top: 2px; line-height: 1.4; }

  /* ── RESULT CARD ── */
  .result-card {
    flex: 1;   /* stretches to same height as left-col */
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    box-shadow: 0 4px 32px rgba(45,71,232,0.07);
    overflow: hidden;
    position: relative;
  }
  .page-wrap.panel-open .result-card {
    box-shadow: 6px 6px 40px rgba(45,71,232,0.12);
  }

  /* Result card coloured banner */
  .rc-banner {
    padding: 18px 18px 14px;
    display: flex; align-items: center; gap: 13px;
    flex-shrink: 0; position: relative;
  }
  .result-card.safe  .rc-banner { background: var(--safe-bg);  border-bottom: 2px solid var(--safe); }
  .result-card.promo .rc-banner { background: var(--promo-bg); border-bottom: 2px solid var(--promo); }
  .result-card.warn  .rc-banner { background: var(--warn-bg);  border-bottom: 2px solid var(--warn); }
  .result-card.scam  .rc-banner { background: var(--scam-bg);  border-bottom: 2px solid var(--scam); }
  .rc-close {
    position: absolute; top: 12px; right: 12px;
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(0,0,0,0.06); border: 1.5px solid rgba(0,0,0,0.08);
    font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; color: var(--text-sub);
  }
  .rc-close:hover { background: rgba(0,0,0,0.13); }

  .rc-badge {
    width: 58px; height: 58px; border-radius: 15px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1px; flex-shrink: 0; color: #fff;
  }
  .result-card.safe  .rc-badge { background: var(--safe); }
  .result-card.promo .rc-badge { background: var(--promo); }
  .result-card.warn  .rc-badge { background: var(--warn); }
  .result-card.scam  .rc-badge { background: var(--scam); }
  .rc-badge .b-icon  { font-size: 23px; line-height: 1; }
  .rc-badge .b-score { font-size: 12px; font-weight: 900; }

  .rc-info { flex: 1; min-width: 0; padding-right: 30px; }
  .rc-tag {
    display: inline-block; border-radius: 100px; padding: 2px 9px;
    font-size: 10px; font-weight: 900; letter-spacing: 1px;
    text-transform: uppercase; margin-bottom: 4px;
  }
  .result-card.safe  .rc-tag { background: rgba(0,196,122,0.15);  color: var(--safe-text); }
  .result-card.promo .rc-tag { background: rgba(45,135,232,0.15); color: var(--promo-text); }
  .result-card.warn  .rc-tag { background: rgba(255,140,0,0.15);  color: var(--warn-text); }
  .result-card.scam  .rc-tag { background: rgba(255,45,45,0.15);  color: var(--scam-text); }
  .rc-title { font-size: 18px; font-weight: 900; line-height: 1.3; }
  .rc-input-lbl {
    margin-top: 3px; font-size: 10px; color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Risk bar */
  .rc-bar-wrap {
    padding: 10px 18px 12px;
    background: #fafbff; border-bottom: 1.5px solid var(--border); flex-shrink: 0;
  }
  .rc-bar-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 5px; }
  .rc-bar-track  { height: 6px; background: #e5e7eb; border-radius: 100px; overflow: hidden; }
  .rc-bar-fill   { height: 100%; border-radius: 100px; width: 0%; transition: width 1s 0.3s cubic-bezier(0.25,1,0.5,1); }
  .result-card.safe  .rc-bar-fill { background: var(--safe); }
  .result-card.promo .rc-bar-fill { background: var(--promo); }
  .result-card.warn  .rc-bar-fill { background: linear-gradient(90deg,#ffb300,var(--warn)); }
  .result-card.scam  .rc-bar-fill { background: linear-gradient(90deg,var(--warn),var(--scam)); }

  /* Reasons */
  .rc-reasons-wrap { padding: 14px 18px; border-bottom: 1.5px solid var(--border); flex-shrink: 0; }
  .sec-title {
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--text-muted); margin-bottom: 9px;
  }
  .reasons { list-style: none; }
  .reasons li {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 5px 0; font-size: 13px; line-height: 1.5;
    border-bottom: 1px solid var(--border);
  }
  .reasons li:last-child { border-bottom: none; }
  .ri { font-size: 13px; flex-shrink: 0; margin-top: 2px; }

  /* Visit site */
  .rc-visit-wrap { padding: 12px 18px 0; flex-shrink: 0; }
  .visit-warning {
    background: var(--scam-bg); border: 1.5px solid #ffb3b3; border-radius: 9px;
    padding: 8px 12px; font-size: 11px; color: var(--scam-text);
    display: none; margin-bottom: 8px; line-height: 1.5;
  }
  .visit-warning.show { display: block; }
  .visit-btn {
    width: 100%; border: 2px solid var(--border); border-radius: 10px;
    padding: 10px 13px; background: #fff;
    font-size: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    font-family: 'Noto Sans TC', sans-serif; transition: all 0.18s; color: var(--text-sub);
  }
  .visit-btn.show { display: flex; }
  .visit-btn:hover { border-color: var(--scam); color: var(--scam); background: var(--scam-bg); }
  /* Safe level: green style */
  .visit-btn.safe-visit { border-color: var(--safe); color: var(--safe-text); background: var(--safe-bg); }
  .visit-btn.safe-visit:hover { background: var(--safe); color: #fff; border-color: var(--safe); }

  /* ── ACTION BUTTONS — SINGLE ROW ── */
  .rc-actions-wrap {
    padding: 12px 18px 16px;
    flex-shrink: 0;
  }
  .rc-actions {
    display: flex;
    gap: 8px;
  }
  .act-btn {
    flex: 1;
    border: none; border-radius: 13px; padding: 12px 8px;
    cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
    font-family: 'Noto Sans TC', sans-serif; transition: all 0.18s;
    text-align: center;
  }
  .act-btn .ai  { font-size: 20px; }
  .act-btn .act-t { font-size: 12px; font-weight: 900; line-height: 1.2; }
  .act-btn .act-s { font-size: 10px; opacity: 0.72; line-height: 1.3; }
  .act-btn:active { transform: scale(0.97); }

  .btn-block    { background: #FFF0F0; color: var(--scam); }
  .btn-block:hover    { background: var(--scam); color: #fff; }
  .btn-report   { background: #FFF8EC; color: var(--warn); }
  .btn-report:hover   { background: var(--warn); color: #fff; }
  .btn-evidence { background: var(--primary-light); color: var(--primary); }
  .btn-evidence:hover { background: var(--primary); color: #fff; }

  /* Confirm overlay */
  .confirm-overlay {
    display: none; position: absolute; inset: 0;
    background: rgba(255,255,255,0.97); z-index: 10;
    flex-direction: column; align-items: center; justify-content: center;
    padding: 28px 22px; text-align: center;
    animation: fadeIn 0.18s ease; border-radius: var(--radius);
  }
  .confirm-overlay.show { display: flex; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* ── FULLSCREEN SCAM WARNING ── */
  .scam-fullscreen {
    display: none;
    position: fixed; inset: 0; z-index: 9000;
    background: #0a0a0a;
    flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 40px 32px;
    animation: scamIn 0.35s cubic-bezier(0.32,0.72,0,1);
  }
  .scam-fullscreen.show { display: flex; }
  @keyframes scamIn {
    from { opacity: 0; transform: scale(1.04); }
    to   { opacity: 1; transform: scale(1); }
  }
  .sf-stripes {
    position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
    background: repeating-linear-gradient(
      -45deg,
      rgba(255,45,45,0.07) 0px, rgba(255,45,45,0.07) 24px,
      transparent 24px, transparent 48px
    );
  }
  .sf-inner { position: relative; z-index: 1; max-width: 520px; }
  .sf-siren { font-size: 80px; animation: sirenspin 0.6s ease-in-out infinite alternate; display: block; margin-bottom: 16px; }
  @keyframes sirenspin { from{transform:rotate(-8deg) scale(1)} to{transform:rotate(8deg) scale(1.08)} }
  .sf-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--scam); color: #fff;
    border-radius: 100px; padding: 6px 18px;
    font-size: 13px; font-weight: 900; letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 20px;
  }
  .sf-title {
    font-size: 36px; font-weight: 900; color: #fff;
    line-height: 1.2; margin-bottom: 12px; letter-spacing: -1px;
  }
  .sf-title span { color: var(--scam); }
  .sf-url {
    font-family: 'DM Mono', monospace; font-size: 13px;
    color: rgba(255,255,255,0.35); margin-bottom: 28px;
    word-break: break-all; max-width: 420px; margin-left: auto; margin-right: auto;
  }
  .sf-risks {
    display: flex; flex-direction: column; gap: 10px;
    background: rgba(255,45,45,0.10); border: 1.5px solid rgba(255,45,45,0.25);
    border-radius: 16px; padding: 18px 22px; margin-bottom: 32px; text-align: left;
  }
  .sf-risk-item { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.8); font-size: 14px; }
  .sf-risk-item .ricon { font-size: 18px; flex-shrink: 0; }
  .sf-btns { display: flex; flex-direction: column; gap: 14px; width: 100%; }

  /* Green leave button — normal size */
  .sf-cancel {
    background: var(--safe); color: #fff; border: none;
    border-radius: 14px; padding: 14px 20px; font-size: 15px; font-weight: 900;
    cursor: pointer; font-family: 'Noto Sans TC', sans-serif;
    transition: background 0.18s; display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .sf-cancel:hover { background: #00a868; }

  /* Red slide-to-proceed control */
  .sf-slider-wrap {
    position: relative; height: 52px; border-radius: 100px;
    background: rgba(255,45,45,0.18); border: 1.5px solid rgba(255,45,45,0.35);
    overflow: hidden; cursor: pointer; user-select: none;
  }
  .sf-slider-track-label {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.4);
    pointer-events: none; letter-spacing: 0.5px;
    transition: opacity 0.2s;
  }
  .sf-slider-fill {
    position: absolute; top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, rgba(255,45,45,0.5), rgba(255,45,45,0.2));
    width: 0%; pointer-events: none; transition: width 0.05s;
  }
  .sf-slider-thumb {
    position: absolute; top: 4px; left: 4px;
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--scam); display: flex; align-items: center; justify-content: center;
    font-size: 20px; box-shadow: 0 2px 12px rgba(255,45,45,0.5);
    transition: left 0.05s; cursor: grab;
  }
  .sf-slider-thumb:active { cursor: grabbing; }
  .sf-slider-wrap.completed .sf-slider-thumb { background: #c00; }
  .sf-slider-wrap.completed .sf-slider-track-label { opacity: 0; }
  .confirm-icon  { font-size: 44px; margin-bottom: 10px; }
  .confirm-title { font-size: 17px; font-weight: 900; margin-bottom: 5px; }
  .confirm-sub   { font-size: 13px; color: var(--text-sub); line-height: 1.55; margin-bottom: 18px; }
  .confirm-btns  { display: flex; gap: 9px; width: 100%; }
  .confirm-ok {
    flex: 1; background: var(--primary); color: #fff; border: none;
    border-radius: 11px; padding: 12px; font-size: 14px; font-weight: 900;
    cursor: pointer; font-family: 'Noto Sans TC', sans-serif;
  }
  .confirm-cancel {
    flex: 1; background: var(--surface2); color: var(--text-sub); border: 1.5px solid var(--border);
    border-radius: 11px; padding: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Noto Sans TC', sans-serif;
  }

  /* ── INPUT CARD INTERNALS ── */
  .tabs { display: flex; background: var(--surface2); border-bottom: 1.5px solid var(--border); }
  .tab {
    flex: 1; padding: 14px 8px; text-align: center; font-size: 13px; font-weight: 700;
    color: var(--text-muted); cursor: pointer; border-bottom: 3px solid transparent;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: all 0.2s; user-select: none;
  }
  .tab .ti { font-size: 22px; }
  .tab.active { color: var(--primary); border-bottom-color: var(--primary); background: var(--surface); }
  .tab:hover:not(.active) { color: var(--text-sub); background: #E8ECFF44; }
  .panel { display: none; padding: 22px; }
  .panel.active { display: block; }
  .plabel { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); margin-bottom: 10px; }
  .input-wrap { position: relative; }
  .big-input {
    width: 100%; border: 2px solid var(--border); border-radius: 14px;
    padding: 15px 62px 15px 15px; font-size: 15px;
    font-family: 'DM Mono', monospace; color: var(--text);
    background: var(--surface2); outline: none; resize: none; min-height: 74px;
    transition: border 0.2s, box-shadow 0.2s, background 0.2s; line-height: 1.6;
  }
  .big-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(45,71,232,0.10); background: #fff; }
  .big-input::placeholder { color: var(--text-muted); font-family: 'Noto Sans TC', sans-serif; font-size: 13px; }
  .paste-btn {
    position: absolute; right: 10px; top: 13px;
    background: var(--primary-light); border: none; border-radius: 9px;
    padding: 6px 10px; font-size: 11px; color: var(--primary); font-weight: 700;
    cursor: pointer; transition: background 0.2s;
  }
  .paste-btn:hover { background: #d0d8ff; }
  .phone-row { display: flex; gap: 10px; }
  .ctag {
    background: var(--surface2); border: 2px solid var(--border); border-radius: 13px;
    padding: 13px; font-size: 15px; font-weight: 700; color: var(--text-sub);
    white-space: nowrap; display: flex; align-items: center;
  }
  .phone-input {
    flex: 1; border: 2px solid var(--border); border-radius: 13px;
    padding: 13px 15px; font-size: 24px; font-family: 'DM Mono', monospace; font-weight: 500;
    color: var(--text); background: var(--surface2); outline: none; letter-spacing: 3px;
    transition: border 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .phone-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(45,71,232,0.10); background: #fff; }
  .phone-input::placeholder { letter-spacing: 1px; font-size: 15px; color: var(--text-muted); }
  .upload-zone {
    border: 2.5px dashed var(--border); border-radius: 14px;
    padding: 30px 20px; text-align: center; cursor: pointer;
    background: var(--surface2); position: relative; transition: all 0.2s;
  }
  .upload-zone:hover, .upload-zone.drag { border-color: var(--primary); background: var(--primary-light); }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .uicon { font-size: 38px; margin-bottom: 8px; }
  .utitle { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .usub { font-size: 12px; color: var(--text-muted); }
  .uprev { display: none; margin-top: 12px; border-radius: 10px; overflow: hidden; max-height: 140px; }
  .uprev img { width: 100%; object-fit: cover; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
  .chip {
    background: var(--surface2); border: 1.5px solid var(--border); border-radius: 100px;
    padding: 5px 13px; font-size: 11px; color: var(--text-sub);
    cursor: pointer; transition: all 0.15s; user-select: none;
  }
  .chip:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
  .check-btn {
    width: 100%; margin-top: 16px;
    background: var(--primary); color: #fff; border: none;
    border-radius: 14px; padding: 18px;
    font-size: 18px; font-weight: 900;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.2s; box-shadow: 0 4px 20px rgba(45,71,232,0.25);
    font-family: 'Noto Sans TC', sans-serif;
  }
  .check-btn:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 7px 28px rgba(45,71,232,0.35); }
  .check-btn:active { transform: translateY(0); }
  .check-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
  .btn-spinner {
    width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: none; flex-shrink: 0;
  }
  .check-btn.loading .btn-spinner { display: block; }
  .check-btn.loading .btn-text { opacity: 0.7; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #111; color: #fff; border-radius: 100px; padding: 10px 20px;
    font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 6px 28px rgba(0,0,0,0.2);
    transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1);
    z-index: 9999; white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
  .toast.ok  { background: #00C47A; }
  .toast.err { background: var(--scam); }

  /* ── ELDER ── */
  .page-wrap.elder .big-input   { font-size: 17px; }
  .page-wrap.elder .phone-input { font-size: 28px; }
  .page-wrap.elder .check-btn   { font-size: 21px; padding: 20px; }
  .page-wrap.elder .tab .ti     { font-size: 26px; }
  .page-wrap.elder .tab         { font-size: 14px; }
  .page-wrap.elder .chip        { font-size: 13px; padding: 7px 14px; }
  .page-wrap.elder .rc-title    { font-size: 21px; }
  .page-wrap.elder .reasons li  { font-size: 15px; }
  .page-wrap.elder .act-btn     { min-height: 84px; font-size: 14px; }
  .page-wrap.elder .act-btn .ai { font-size: 24px; }
  .page-wrap.elder .nsi-text strong { font-size: 14px; }

  /* ══════════════════════════════════════
     MOBILE — ≤ 640px
     Result card slides UP from the bottom
     instead of sliding in from the right.
     ══════════════════════════════════════ */
  @media (max-width: 640px) {

    /* Hide desktop api bar URL */
    .api-url { display: none; }
    .api-bar  { font-size: 11px; padding: 5px 12px; }

    /* Smaller header */
    header { padding: 20px 16px 14px; }
    .shield { width: 52px; height: 52px; font-size: 26px; border-radius: 14px; margin-bottom: 10px; }
    header h1 { font-size: 22px; }
    header p  { font-size: 12px; }

    /* Scene: single column, full width, no horizontal overflow clip needed */
    .scene { padding: 0 12px 40px; overflow: visible; }

    /* cols-wrap: full width, stacked, no translate trick */
    .cols-wrap {
      width: 100%;
      flex-direction: column;
      display: flex;
      gap: 0;
      transform: none !important;  /* disable horizontal shift */
    }

    /* left-col full width */
    .left-col {
      width: 100%;
      gap: 10px;
    }

    /* ── Result card: fixed bottom sheet, slides UP ── */
    .right-col {
      position: fixed;
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 90dvh;
      /* reset desktop transform — use Y instead */
      transform: translateY(110%) !important;
      opacity: 1 !important;
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -8px 40px rgba(45,71,232,0.18);
      z-index: 500;
      pointer-events: none;
      transition: transform var(--anim) !important;
      overflow-y: auto;
    }
    .page-wrap.panel-open .right-col {
      transform: translateY(0) !important;
      pointer-events: auto;
    }

    /* Result card fills the sheet */
    .result-card {
      border-radius: 24px 24px 0 0;
      height: auto;
      min-height: unset;
    }

    /* Drag handle on the result card top */
    .result-card::before {
      content: '';
      display: block;
      width: 36px; height: 4px;
      background: rgba(0,0,0,0.15);
      border-radius: 100px;
      margin: 10px auto 2px;
    }

    /* Dim overlay behind bottom sheet */
    .mobile-dim {
      display: none;
      position: fixed; inset: 0; z-index: 499;
      background: rgba(0,0,0,0.4);
      animation: dimIn 0.28s ease;
    }
    @keyframes dimIn { from{opacity:0} to{opacity:1} }
    .page-wrap.panel-open .mobile-dim { display: block; }

    /* next-card: single column grid */
    .next-steps-grid { grid-template-columns: 1fr; }

    /* Hide next-card on mobile — info is in result sheet */
    .next-card { display: none; }

    /* Tabs: smaller text */
    .tab { font-size: 11px; padding: 10px 4px; }
    .tab .ti { font-size: 20px; }

    /* Input panels */
    .panel { padding: 16px; }

    /* Prevent any input/textarea from overflowing the card */
    .panel input,
    .panel textarea,
    .big-input,
    .phone-input { box-sizing: border-box; width: 100%; min-width: 0; }

    .big-input    { font-size: 14px; min-height: 60px; letter-spacing: 0; }
    .phone-row    { gap: 8px; }
    .ctag         { padding: 10px 10px; font-size: 13px; flex-shrink: 0; }
    .phone-input  { font-size: 18px; letter-spacing: 2px; padding: 12px 10px; min-width: 0; }
    .phone-input::placeholder { font-size: 13px; letter-spacing: 0.5px; }
    .check-btn { font-size: 16px; padding: 15px; }

    /* Action buttons: wrap if needed */
    .rc-actions { flex-wrap: wrap; }
    .act-btn { min-width: calc(50% - 4px); }

    /* Fullscreen scam warning: smaller text */
    .sf-title { font-size: 26px; }
    .sf-inner { max-width: 100%; }
    .sf-risks { padding: 14px 16px; }
    .sf-risk-item { font-size: 13px; }

    /* Bigger, easier-to-swipe slider on mobile */
    .sf-slider-wrap {
      height: 64px;
      touch-action: none;   /* prevents page scroll while dragging */
    }
    .sf-slider-thumb {
      width: 56px; height: 56px;
      font-size: 26px;
      top: 4px;
      box-shadow: 0 3px 18px rgba(255,45,45,0.6);
    }
    .sf-slider-track-label { font-size: 14px; }

    /* Elder bar */
    .elder-bar > span { font-size: 12px; }
    .elder-toggle { font-size: 12px; padding: 5px 10px; }
  }
</style>