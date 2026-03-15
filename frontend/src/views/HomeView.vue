<template>
  <div class="page-wrap" :class="{ elder: isElder }">

    <!-- ══ PAGE 1: Main input ══ -->
    <div class="page page-main">

      <!-- API bar -->
      

      <!-- Navbar -->
      <nav class="navbar">
        <span class="nav-title">防詐雷達 DEMO</span>
        <div class="nav-actions">
          <label class="toggle-wrap" :class="{ active: isElder }">
            <input type="checkbox" :checked="isElder" @change="toggleElder" style="display:none">
            <span class="toggle-icon">👴</span>
            <span class="toggle-label">長輩模式</span>
            <span class="toggle-pill"><span class="toggle-knob"></span></span>
          </label>
          <label class="toggle-wrap theme-toggle" :class="{ active: isDark }">
            <input type="checkbox" :checked="isDark" @change="toggleTheme" style="display:none">
            <span class="toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
            <span class="toggle-label">{{ isDark ? '深色' : '亮色' }}</span>
            <span class="toggle-pill"><span class="toggle-knob"></span></span>
          </label>
        </div>
      </nav>

      <!-- Glow bg -->
      <div class="glow-wrap" aria-hidden="true">
        <div class="glow g1"></div>
        <div class="glow g2"></div>
        <div class="glow g3"></div>
      </div>

      <!-- Content -->
      <div class="main-content">
        <header>
          <h1>收到可疑訊息了嗎？<br><span class="sub">把它貼過來，我幫你看看。</span></h1>
        </header>

        <!-- Input card -->
        <div class="input-card" :class="{ focused: isFocused }">

          <!-- Image preview row -->
          <div class="img-row" v-if="images.length > 0">
            <div class="img-thumb" v-for="(img, i) in images" :key="i"
                 @mouseenter="openPreview(img)"
                 @mousemove="updatePreviewPos($event)"
                 @mouseleave="closePreview"
            >
              <img :src="img.src" :alt="img.name">
              <button class="img-remove" @click.stop="closePreview(); removeImage(i)">✕</button>
              <div class="img-expand">🔍</div>
            </div>
          </div>

          <!-- Phone input (vue-tel-input) -->
          <transition name="cc-fade">
            <div class="phone-input-row" v-if="detectedType === 'phone'">
              <PhoneInput
                v-model="inputText"
                :isElder="isElder"
                @valid="onPhoneValid"
              />
            </div>
          </transition>

          <!-- Textarea — hidden when images are uploaded or phone mode -->
          <div class="textarea-wrap" v-if="!images.length && detectedType !== 'phone'">
            <textarea
              ref="textareaRef"
              class="smart-input"
              v-model="inputText"
              :placeholder="''"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @paste="handlePaste"
              @input="autoResize"
              @keydown.enter.prevent="doCheck"
              @keydown.meta.enter.prevent="doCheck"
            ></textarea>
            <!-- Animated placeholder -->
            <div class="animated-placeholder" v-if="!inputText">
              <transition name="ph-slide" mode="out-in">
                <span :key="phIndex">{{ placeholders[phIndex] }}</span>
              </transition>
            </div>
            <!-- Camera button — bottom-right of textarea -->
            <label class="camera-btn" title="上傳圖片">
              <input type="file" accept="image/*" multiple @change="pickFiles" style="display:none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </label>
          </div>

          <!-- Bottom action row: detect badge left, send right -->
          <div class="action-row">
            <div class="action-left">
              <div class="detect-badge" v-if="inputText.trim() || images.length">
                <span class="detect-dot" :class="detectedType"></span>
                <span>{{ detectLabel }}</span>
              </div>
            </div>
            <div class="action-right">
              <button
                class="send-btn"
                :class="{ loading: isLoading, 'elder-pulse': isElder && !isLoading && (inputText.trim() || images.length) }"
                :disabled="isLoading || (!inputText.trim() && !images.length)"
                @click="doCheck">
                <span class="send-spinner" v-if="isLoading"></span>
                <span v-else>🔍</span>
                <span>{{ isLoading ? '分析中…' : '立即檢測' }}</span>
              </button>
            </div>
          </div>

          <div class="elder-arrow-hint" v-if="isElder && (inputText.trim() || images.length)">
            <span class="eah-text">👆 輸入完畢？請按下「立即檢測」</span>
          </div>
        </div>


      </div>

      <!-- Scroll-down arrow -->
      <button class="scroll-arrow" @click="scrollToStats" aria-label="查看詐騙統計">
        <span class="sa-text">台灣詐騙現況</span>
        <span class="sa-icon">↓</span>
      </button>
    </div>

    <!-- ══ PAGE 2: Stats ══ -->
    <div class="page page-stats" ref="statsPage">

      <!-- Glow bg -->
      <div class="glow-wrap" aria-hidden="true">
        <div class="glow gs1"></div>
        <div class="glow gs2"></div>
      </div>

      <div class="stats-header">
        <div class="stats-badge">📊 2024 台灣詐騙現況</div>
        <h2>您必須知道的<span>詐騙數字</span></h2>
        <p>數據來源：內政部警政署、Whoscall、金融監督管理委員會</p>
      </div>

      <div class="stats-grid">
        <div
          class="stat-card"
          v-for="(s, i) in stats" :key="i"
          :class="{ visible: statsVisible }"
          :style="{ transitionDelay: (i * 90) + 'ms' }">
          <div class="stat-icon">{{ s.icon }}</div>
          <div class="stat-num">
            <span class="sn-val" :ref="el => numRefs[i] = el" data-target="">{{ s.num }}</span>
          </div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-chart" v-if="s.pct !== undefined">
            <div class="chart-bar">
              <div class="chart-fill" :class="s.color"
                   :style="{ width: statsVisible ? s.pct + '%' : '0%',
                             transitionDelay: (i * 90 + 300) + 'ms' }"></div>
            </div>
            <span class="chart-pct">{{ s.pct }}%</span>
          </div>
          <div class="stat-source">{{ s.source }}</div>
        </div>
      </div>

      <button class="scroll-up" @click="scrollToMain">↑ 返回頂端</button>
    </div>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible, ok: toastType==='ok', err: toastType==='err' }">{{ toastMsg }}</div>

    <!-- Image hover preview -->
    <transition name="preview-fade">
      <div class="preview-modal" v-if="previewImg" :style="previewStyle" style="pointer-events:none;">
        <div class="preview-box">
          <img :src="previewImg.src" :alt="previewImg.name">
          <div class="preview-name">{{ previewImg.name }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { resultState } from '../composables/useResult.js'
import PhoneInput from '../components/PhoneInput.vue'

const API = 'http://localhost:3001'
const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElder } = useElder()

const isFocused   = ref(false)
const inputText   = ref('')
const images      = ref([])
const isLoading   = ref(false)
const countryCode = ref('+886')
const phoneIsValid = ref(false)
const phoneE164    = ref('')

function onPhoneValid({ isValid, e164 }) {
  phoneIsValid.value = isValid
  phoneE164.value    = e164
}

watch(inputText, (val) => {
  if (!val) {
    phoneIsValid.value = false
    phoneE164.value = ''
  }
})

const FLAG_MAP = {
  '+886': '🇹🇼', '+86': '🇨🇳', '+852': '🇭🇰', '+853': '🇲🇴',
  '+1':   '🇺🇸', '+81': '🇯🇵', '+82':  '🇰🇷', '+65':  '🇸🇬',
  '+60':  '🇲🇾', '+44': '🇬🇧',
}
const currentFlag = computed(() => FLAG_MAP[countryCode.value] || '🌏')
const textareaRef = ref(null)
const statsPage   = ref(null)
const statsVisible = ref(false)
const numRefs     = ref([])

const apiOnline     = ref(false)
const apiStatusText = ref('檢查連線中…')
let healthTimer = null

const toastVisible = ref(false)
const toastMsg     = ref('')
const toastType    = ref('')
let toastTimer = null

// ── Detection ──
const PHONE_RE = /^[\d\s\-+()]{6,15}$/
const URL_RE   = /^(https?:\/\/|www\.|[a-zA-Z0-9]([a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,})/

const detectedType = computed(() => {
  if (images.value.length > 0) return 'screenshot'
  const t = inputText.value.trim()
  if (!t) return 'url'
  if (PHONE_RE.test(t.replace(/[-\s()]/g, ''))) return 'phone'
  if (URL_RE.test(t)) return 'url'
  return 'url'
})
const detectLabel = computed(() => ({ url: '🔗 網址', phone: '📞 電話號碼', screenshot: '📸 截圖' }[detectedType.value]))

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 220) + 'px'
}

// ── Images ──
function pickFiles(e) { Array.from(e.target.files).forEach(addImageFile); e.target.value = '' }
function addImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  const r = new FileReader()
  r.onload = ev => images.value.push({ src: ev.target.result, file, name: file.name })
  r.readAsDataURL(file)
}
function removeImage(i) { images.value.splice(i, 1) }
async function handlePaste(e) {
  const imgs = Array.from(e.clipboardData?.items || []).filter(it => it.type.startsWith('image/'))
  if (imgs.length) { e.preventDefault(); imgs.forEach(it => addImageFile(it.getAsFile())); showToast('📷 圖片已貼上', 'ok') }
}

const previewImg  = ref(null)
const previewStyle = ref({})

const PREVIEW_W = 960
const PREVIEW_H = 840
const OFFSET_X  = 20  // distance from cursor

function openPreview(img) {
  previewImg.value = img
}
function updatePreviewPos(e) {
  const vpW = window.innerWidth
  const vpH = window.innerHeight
  let left = e.clientX + OFFSET_X
  let top  = e.clientY - PREVIEW_H / 2
  // keep within viewport
  if (left + PREVIEW_W > vpW - 8) left = e.clientX - PREVIEW_W - OFFSET_X
  if (top < 8) top = 8
  if (top + PREVIEW_H > vpH - 8) top = vpH - PREVIEW_H - 8
  previewStyle.value = { left: left + 'px', top: top + 'px' }
}
function closePreview() {
  previewImg.value = null
}

// ── Animated placeholder ──
const placeholders = [
  '0912-345-678',
  'https://example.com',
  '0800-123-456',
  'www.suspicious-site.net',
  '+886-912-345-678',
  'http://bit.ly/3xXxXx',
]
const phIndex = ref(0)
let phTimer = null

// ── Check ──
async function doCheck() {
  const type = detectedType.value
  // Validation guard for phone mode
  if (type === 'phone' && !phoneIsValid.value) {
    showToast('⚠️ 請輸入有效的電話號碼', 'err')
    return
  }
  // 截圖模式：取第一張圖的 base64（含 data:image/... 前綴）
  const rawQ = type === 'phone'
    ? (phoneE164.value || (countryCode.value + inputText.value.trim().replace(/[-\s()]/g, '')))
    : type === 'screenshot'
      ? (images.value[0]?.src ?? '')
      : inputText.value.trim()
  if (!rawQ) { showToast('⚠️ 請先輸入內容或上傳圖片', 'err'); return }
  isLoading.value = true
  try {
    const ep = type === 'screenshot' ? '/api/check/screenshot' : type === 'phone' ? '/api/check/phone' : '/api/check/url'
    const res = await fetch(API + ep, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: rawQ }) })
    const data = await res.json()
    if (!res.ok) { showToast(`❌ ${data.error || '查詢失敗'}`, 'err'); return }
    // 截圖模式顯示檔名，避免 base64 字串塞爆結果頁
    const displayInput = type === 'screenshot' ? (images.value[0]?.name ?? '截圖') : rawQ
    resultState.data = data; resultState.lastInput = displayInput; resultState.lastType = type
    router.push('/result')
  } catch { showToast('❌ 無法連接 API — 請確認 server.js 已啟動', 'err') }
  finally { isLoading.value = false }
}

// ── Health ──
async function checkHealth() {
  try {
    const r = await fetch(API + '/api/health', { signal: AbortSignal.timeout(2000) })
    apiOnline.value = r.ok; apiStatusText.value = r.ok ? 'API 連線正常 ✓' : 'API 離線'
  } catch { apiOnline.value = false; apiStatusText.value = 'API 離線 — 請啟動 server.js' }
}

// ── Scroll ──
function scrollToStats() { statsPage.value?.scrollIntoView({ behavior: 'smooth' }) }
function scrollToMain()  { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// ── Stats ──
const stats = [
  { icon:'💸', num:'91.2 億元', label:'2024 全台詐騙損失金額',       source:'內政部警政署 2024', pct:91, color:'red' },
  { icon:'🎣', num:'17.6 萬件', label:'2024 詐騙案件總數（年增 11%）', source:'刑事警察局 2024',  pct:76, color:'orange' },
  { icon:'📞', num:'每 4 分鐘', label:'就有一人接到詐騙電話',          source:'Whoscall 2024',   pct: undefined },
  { icon:'📱', num:'83%',      label:'詐騙透過手機發動',              source:'Whoscall 2024',   pct:83, color:'blue' },
  { icon:'👴', num:'34%',      label:'長者損失佔比，為最高風險族群',   source:'金管會 2024',      pct:34, color:'orange' },
  { icon:'🏦', num:'28%',      label:'假冒金融業，最常見詐騙類型',     source:'金融消費評議中心',  pct:28, color:'red' },
]

// Intersection observer for stats animation
let observer = null
function setupObserver() {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { statsVisible.value = true; observer.disconnect() }
    })
  }, { threshold: 0.15 })
  if (statsPage.value) observer.observe(statsPage.value)
}

function showToast(msg, type='') {
  toastMsg.value = msg; toastType.value = type; toastVisible.value = true
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}

onMounted(() => {
  checkHealth()
  healthTimer = setInterval(checkHealth, 5000)
  nextTick(setupObserver)
  phTimer = setInterval(() => { phIndex.value = (phIndex.value + 1) % placeholders.length }, 2800)
})
onUnmounted(() => {
  clearInterval(healthTimer)
  clearTimeout(toastTimer)
  clearInterval(phTimer)
  observer?.disconnect()
})
</script>

<style scoped>
/* ── Base ── */
.page-wrap { background:var(--bg); color:var(--text); transition:background 0.25s,color 0.25s; overflow-x:hidden; }

/* ── Two full-height pages ── */
.page { min-height:100vh; position:relative; display:flex; flex-direction:column; overflow:hidden; }

/* ── Glow background ── */
.glow-wrap { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0; }
.glow { position:absolute; border-radius:50%; filter:blur(90px); opacity:0; animation:glowIn 1.2s ease forwards; }

/* Page 1 glows */
.g1 { width:500px; height:500px; background:radial-gradient(circle, rgba(45,71,232,0.22) 0%, transparent 70%); top:-100px; left:-80px; animation-delay:0.1s; }
.g2 { width:400px; height:400px; background:radial-gradient(circle, rgba(91,116,245,0.16) 0%, transparent 70%); bottom:60px; right:-60px; animation-delay:0.4s; }
.g3 { width:350px; height:350px; background:radial-gradient(circle, rgba(0,196,122,0.10) 0%, transparent 70%); top:40%; left:55%; animation-delay:0.7s; }

/* Page 2 glows */
.gs1 { width:600px; height:600px; background:radial-gradient(circle, rgba(255,45,45,0.14) 0%, transparent 70%); top:-80px; right:-80px; animation-delay:0.2s; }
.gs2 { width:450px; height:450px; background:radial-gradient(circle, rgba(45,71,232,0.12) 0%, transparent 70%); bottom:-60px; left:-60px; animation-delay:0.5s; }

@keyframes glowIn { from{opacity:0} to{opacity:1} }

/* ── API bar ── */
.api-bar { background:var(--topbar-bg); padding:6px 20px; display:flex; align-items:center; justify-content:space-between; font-size:12px; color:rgba(255,255,255,0.55); font-family:'DM Mono',monospace; position:relative; z-index:10; }
.api-brand { font-weight:700; color:rgba(255,255,255,0.8); }
.api-status { display:flex; align-items:center; gap:6px; }
.api-dot { width:7px; height:7px; border-radius:50%; background:#555; transition:background 0.3s; }
.api-dot.online  { background:#00C47A; box-shadow:0 0 6px #00C47A88; }
.api-dot.offline { background:#FF2D2D; }

/* ── Navbar ── */
.navbar { background:var(--navbar-bg); padding:10px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:200; transition:background 0.25s; }
.nav-title { color:rgba(255,255,255,0.9); font-size:14px; font-weight:700; }
.nav-actions { display:flex; gap:10px; align-items:center; }

/* Toggles */
.toggle-wrap { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.2); border-radius:100px; padding:5px 12px 5px 10px; cursor:pointer; transition:background 0.2s; user-select:none; }
.toggle-wrap:hover { background:rgba(255,255,255,0.2); }
.toggle-wrap.active { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.4); }
.toggle-icon  { font-size:15px; line-height:1; }
.toggle-label { font-size:12px; font-weight:700; color:#fff; white-space:nowrap; }
.toggle-pill  { width:34px; height:18px; border-radius:100px; background:rgba(255,255,255,0.25); position:relative; flex-shrink:0; transition:background 0.25s; }
.toggle-wrap.active .toggle-pill { background:rgba(255,255,255,0.7); }
.toggle-knob  { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.25); transition:transform 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.toggle-wrap.active .toggle-knob { transform:translateX(16px); }
.theme-toggle .toggle-pill { background:rgba(100,120,255,0.4); }
.theme-toggle.active .toggle-pill { background:rgba(60,70,140,0.8); }

/* ── Main content ── */
.main-content { flex:1; display:flex; flex-direction:column; align-items:center; padding:32px 20px 0; gap:14px; position:relative; z-index:1;justify-content: center; }

/* Header */
header { text-align:center; }
header h1 { font-size:28px; font-weight:700; letter-spacing:-0.5px; line-height:1.5; color:var(--text); }
header h1 span { color:var(--primary); }
.page-wrap.elder header h1 { font-size:34px; }

/* Input card */
.input-card { width:100%; max-width:720px; background:var(--surface); border:1.5px solid var(--border); border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.12); transition:background 0.25s; backdrop-filter:blur(12px); }
.page-wrap.elder .input-card { border-width:2.5px; border-color:var(--primary); }

/* Country code */
.country-row { display:flex; align-items:center; gap:12px; padding:12px 18px 0; flex-wrap:wrap; }
.phone-input-row { padding: 12px 14px 0; }
.cc-fade-enter-active { transition:all 0.22s ease; }
.cc-fade-leave-active { transition:all 0.18s ease; }
.cc-fade-enter-from,.cc-fade-leave-to { opacity:0; transform:translateY(-8px); }

.cc-flag-display {
  font-size:28px; line-height:1; flex-shrink:0;
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  display:block;
}
.cc-flag-display:hover { transform:scale(1.2); }

.cc-select {
  border:1.5px solid var(--border); border-radius:12px;
  padding:9px 14px; font-size:15px; font-weight:600;
  color:var(--text); background:var(--surface2);
  outline:none; cursor:pointer;
  transition:border-color 0.2s, background 0.2s;
  min-width:180px;
}
.cc-select:focus { border-color:var(--primary); }
.cc-hint { font-size:12px; color:var(--text-muted); }
.page-wrap.elder .cc-select       { font-size:18px; padding:11px 16px; min-width:220px; }
.page-wrap.elder .cc-flag-display { font-size:36px; }
.page-wrap.elder .cc-hint         { font-size:14px; }

/* Images */
.img-row { display:flex; flex-wrap:wrap; gap:10px; padding:14px 16px 0; }
.img-thumb { position:relative; width:80px; height:80px; border-radius:12px; overflow:hidden; border:1.5px solid var(--border); flex-shrink:0; cursor:pointer; transition:transform 0.15s; }
.img-thumb:hover { transform:scale(1.04); }
.img-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.img-remove { position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,0.65); color:#fff; border:none; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; z-index:2; }
.img-remove:hover { background:var(--scam); }
.img-expand { position:absolute; inset:0; background:rgba(0,0,0,0.38); display:flex; align-items:center; justify-content:center; font-size:18px; opacity:0; transition:opacity 0.15s; }
.img-thumb:hover .img-expand { opacity:1; }

/* Textarea */
.textarea-wrap { padding:14px 18px 44px; position:relative; margin:12px 14px 0; border:1.5px solid var(--border); border-radius:14px; background:var(--surface2); transition:border-color 0.2s, background 0.2s; }
.input-card.focused .textarea-wrap { border-color:var(--primary); background:var(--surface); }
.smart-input { width:100%; resize:none; border:none; outline:none; background:transparent; font-family:'Noto Sans TC',sans-serif; font-size:16px; color:var(--text); line-height:1.7; min-height:68px; max-height:220px; overflow-y:auto; box-sizing:border-box; }
.smart-input::placeholder { color:transparent; }
.page-wrap.elder .smart-input              { font-size:22px; min-height:140px; }
.page-wrap.elder .smart-input::placeholder { font-size:20px; }

/* Animated placeholder — scrolls top→bottom: new enters from top, old exits to bottom */
.animated-placeholder { position:absolute; top:14px; left:18px; right:18px; pointer-events:none; font-size:15px; color:var(--text-muted); line-height:1.7; overflow:hidden; height:1.7em; }
.ph-slide-enter-active { transition:transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease; }
.ph-slide-leave-active { transition:transform 0.3s ease, opacity 0.25s ease; }
.ph-slide-enter-from   { transform:translateY(-100%); opacity:0; }
.ph-slide-leave-to     { transform:translateY(100%); opacity:0; }
.page-wrap.elder .animated-placeholder { font-size:20px; }

/* Camera button — absolute bottom-right inside textarea-wrap */
.camera-btn { position:absolute; bottom:8px; right:10px; width:30px; height:30px; border-radius:8px; background:transparent; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-muted); transition:background 0.2s, color 0.2s, border-color 0.2s; flex-shrink:0; }
.camera-btn:hover { background:var(--primary); color:#fff; border-color:var(--primary); }
.camera-btn svg { width:16px; height:16px; }

/* Action row — detect badge left, send right */
.action-row { display:flex; align-items:center; justify-content:space-between; padding:2px 14px 16px; margin-top:14px; gap:10px; }
.action-left  { display:flex; align-items:center; gap:8px; min-width:0; }
.action-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.detect-badge { display:flex; align-items:center; gap:6px; background:var(--surface2); border:1.5px solid var(--border); border-radius:100px; padding:5px 12px; font-size:13px; font-weight:700; color:var(--text-sub); }
.detect-dot { width:8px; height:8px; border-radius:50%; }
.detect-dot.url        { background:var(--primary); }
.detect-dot.phone      { background:var(--safe); }
.detect-dot.screenshot { background:var(--warn); }

.send-btn { display:flex; align-items:center; justify-content:center; gap:7px; background:var(--primary); color:#fff; border:none; border-radius:12px; padding:8px 18px; font-size:14px; font-weight:900; transition:background 0.2s,transform 0.2s,box-shadow 0.2s; box-shadow:0 3px 14px rgba(45,71,232,0.3); white-space:nowrap; }
.send-btn:hover:not(:disabled) { background:var(--primary-dark); transform:translateY(-1px); box-shadow:0 5px 20px rgba(45,71,232,0.42); }
.send-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; box-shadow:none; }
.page-wrap.elder .send-btn { font-size:17px; padding:11px 22px; border-radius:14px; }
.send-btn.elder-pulse { animation:breathe 1.8s ease-in-out infinite; }
@keyframes breathe {
  0%,100% { box-shadow:0 3px 14px rgba(45,71,232,0.35), 0 0 0 0 rgba(45,71,232,0.45); transform:scale(1); }
  50%      { box-shadow:0 6px 26px rgba(45,71,232,0.55), 0 0 0 12px rgba(45,71,232,0); transform:scale(1.05); }
}
.elder-arrow-hint { padding:0 14px 12px; display:flex; justify-content:flex-end; animation:nudge 1s ease-in-out infinite; }
@keyframes nudge { 0%,100%{transform:translateX(0)} 50%{transform:translateX(6px)} }
.eah-text { font-size:14px; font-weight:900; color:var(--primary); }
.page-wrap.elder .eah-text { font-size:17px; }
.send-spinner { width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }

.page-wrap.elder header h1 { font-size:28px; }

/* ── Scroll arrow ── */
.scroll-arrow {
  position:relative; z-index:1;
  margin: auto auto 28px;
  display:flex; flex-direction:column; align-items:center; gap:4px;
  background:none; border:none; cursor:pointer;
  color:var(--text-muted);
  animation: bounce 2s ease-in-out infinite;
  transition:color 0.2s;
}
.scroll-arrow:hover { color:var(--primary); }
.sa-text { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
.sa-icon { font-size:22px; line-height:1; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

/* ══ PAGE 2: STATS ══ */
.page-stats { background:var(--bg); padding:0 20px 60px; align-items:center; }

.stats-header { text-align:center; padding:56px 20px 36px; position:relative; z-index:1; }
.stats-badge { display:inline-block; background:var(--primary-light); color:var(--primary); border:1.5px solid rgba(45,71,232,0.25); border-radius:100px; padding:6px 18px; font-size:12px; font-weight:700; letter-spacing:1px; margin-bottom:14px; }
.stats-header h2 { font-size:32px; font-weight:900; letter-spacing:-0.5px; line-height:1.2; }
.stats-header h2 span { color:var(--scam); }
.stats-header p  { margin-top:8px; font-size:13px; color:var(--text-muted); }
.page-wrap.elder .stats-header h2 { font-size:38px; }

/* Stats grid */
.stats-grid {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap:16px;
  max-width:1000px;
  width:100%;
  position:relative; z-index:1;
}

.stat-card {
  background:var(--surface);
  border:1.5px solid var(--border);
  border-radius:20px;
  padding:22px 20px 18px;
  display:flex; flex-direction:column; gap:8px;
  box-shadow:0 4px 24px rgba(0,0,0,0.08);
  transition:background 0.25s, border-color 0.25s,
             opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1);
  opacity:0; transform:translateY(28px);
}
.stat-card.visible { opacity:1; transform:translateY(0); }
.stat-card:hover { border-color:var(--primary); box-shadow:0 8px 32px rgba(45,71,232,0.13); transform:translateY(-3px) !important; }

.stat-icon { font-size:32px; line-height:1; }
.stat-num  { font-size:30px; font-weight:900; color:var(--primary); letter-spacing:-1px; line-height:1.1; }
.stat-label{ font-size:14px; color:var(--text-sub); line-height:1.45; }

/* Animated bar */
.stat-chart { display:flex; align-items:center; gap:10px; margin-top:4px; }
.chart-bar  { flex:1; height:8px; background:var(--surface3); border-radius:100px; overflow:hidden; }
.chart-fill { height:100%; border-radius:100px; width:0%; transition:width 1.2s cubic-bezier(0.22,1,0.36,1); }
.chart-fill.red    { background:linear-gradient(90deg,var(--warn),var(--scam)); }
.chart-fill.orange { background:linear-gradient(90deg,#ffb300,var(--warn)); }
.chart-fill.blue   { background:linear-gradient(90deg,var(--primary),#7c93ff); }
.chart-pct { font-size:12px; font-weight:700; color:var(--text-muted); white-space:nowrap; }

.stat-source { font-size:10px; color:var(--text-muted); font-family:'DM Mono',monospace; margin-top:auto; padding-top:6px; border-top:1px solid var(--border); }

.page-wrap.elder .stat-num   { font-size:34px; }
.page-wrap.elder .stat-label { font-size:16px; }

/* Scroll up */
.scroll-up { display:flex; align-items:center; gap:6px; background:none; border:1.5px solid var(--border); border-radius:100px; padding:9px 20px; color:var(--text-sub); font-size:13px; font-weight:700; cursor:pointer; margin-top:32px; transition:all 0.2s; position:relative; z-index:1; }
.scroll-up:hover { border-color:var(--primary); color:var(--primary); }

/* ── Preview modal ── */
.preview-fade-enter-active { transition:opacity 0.18s ease, transform 0.22s cubic-bezier(0.34,1.4,0.64,1); }
.preview-fade-leave-active { transition:opacity 0.14s ease, transform 0.14s ease; }
.preview-fade-enter-from   { opacity:0; transform:scale(0.88) translateY(10px); }
.preview-fade-leave-to     { opacity:0; transform:scale(0.92); }
.preview-modal { position:fixed; z-index:9000; pointer-events:none; }
.preview-box { background:var(--surface); border-radius:18px; overflow:hidden; box-shadow:0 24px 80px rgba(0,0,0,0.55), 0 0 0 1.5px var(--border); max-width:960px; display:flex; flex-direction:column; }
.preview-box img  { max-width:960px; max-height:800px; object-fit:contain; display:block; }
.preview-name     { padding:10px 16px; font-size:12px; color:var(--text-muted); font-family:'DM Mono',monospace; border-top:1px solid var(--border); text-align:center; }

/* ── Toast ── */
.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:#111; color:#fff; border-radius:100px; padding:10px 22px; font-size:14px; font-weight:700; box-shadow:0 6px 28px rgba(0,0,0,0.22); transition:transform 0.3s cubic-bezier(0.34,1.4,0.64,1); z-index:9999; white-space:nowrap; pointer-events:none; }
.toast.show { transform:translateX(-50%) translateY(0); }
.toast.ok  { background:#00C47A; }
.toast.err { background:var(--scam); }

/* ── Mobile ── */
@media (max-width:700px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .stats-header h2 { font-size:24px; }
  .stat-num { font-size:24px; }
  header h1 { font-size:18px; }
  .toggle-label { display:none; }
  .toggle-wrap  { padding:5px 8px; }
}
@media (max-width:440px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
