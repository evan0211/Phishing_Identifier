<template>
  <div class="page-wrap" :class="{ elder: isElder }">

    <!-- Navbar — 在 page-wrap 頂層，window scroll 才能控制 -->
    <nav class="navbar" :class="{ hidden: navbarHidden }">
      <span class="nav-title" @click="scrollToMain" style="cursor:pointer">防詐雷達 DEMO</span>
      <div class="nav-actions">
        <!-- 設定按鈕 -->
        <div class="settings-wrap" ref="settingsWrap">
          <button class="settings-btn" :class="{ active: menuOpen }" @click="menuOpen = !menuOpen" aria-label="設定">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span class="settings-label">設定</span>
          </button>

          <!-- 下拉選單 -->
          <transition name="menu-drop">
            <div class="settings-menu" v-if="menuOpen">
              <!-- 長輩模式 -->
              <button class="menu-row" :class="{ active: isElder }" @click="toggleElder">
                <span class="menu-icon">👴</span>
                <span class="menu-text">長輩模式</span>
                <span class="menu-pill" :class="{ on: isElder }"><span class="menu-knob"></span></span>
              </button>
              <!-- 深色/亮色 -->
              <button class="menu-row" :class="{ active: isDark }" @click="toggleTheme">
                <span class="menu-icon">{{ isDark ? '🌙' : '☀️' }}</span>
                <span class="menu-text">{{ isDark ? '深色模式' : '亮色模式' }}</span>
                <span class="menu-pill" :class="{ on: isDark }"><span class="menu-knob"></span></span>
              </button>
              <!-- TTS -->
              <button class="menu-row" :class="{ active: isTTSEnabled }" @click="toggleTTS">
                <span class="menu-icon">🔊</span>
                <span class="menu-text">語音朗讀</span>
                <span class="menu-pill" :class="{ on: isTTSEnabled }"><span class="menu-knob"></span></span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </nav>

    <!-- ══ PAGE 1: Main input ══ -->
    <div class="page page-main">

      <!-- Glow bg -->
      <div class="glow-wrap" aria-hidden="true">
        <div class="glow g1"></div>
        <div class="glow g2"></div>
        <div class="glow g3"></div>
      </div>

      <!-- Content -->
      <div class="main-content">
        <div class="content-inner">
        <header>
          <h1>收到可疑訊息了嗎？<br><span class="sub">把它貼過來，我幫你看看。</span></h1>
        </header>

        <!-- Input card -->
        <div class="input-card" :class="{ focused: isFocused }">

          <!-- Image preview row -->
          <div class="img-row" v-if="images.length > 0">
            <div class="img-thumb" v-for="(img, i) in images" :key="i"
                 @click="openPreview(img)"
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
                :initialValue="inputText"
                :isElder="isElder"
                @update:modelValue="onPhoneInput"
                @submit="doCheck"
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
            <!-- 清除按鈕 — 右上角，有內容才顯示 -->
            <button
              v-if="inputText"
              class="clear-btn"
              title="清除輸入"
              @click="clearInput">
              ✕
            </button>
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
              <transition name="ph-slide" mode="out-in">
                <div class="type-chips" v-if="inputText.trim() || images.length" key="chips">
                  <template v-if="images.length">
                    <span class="type-chip active screenshot">📸 截圖</span>
                  </template>
                  <template v-else>
                    <button
                      v-for="t in typeOptions" :key="t.value"
                      class="type-chip"
                      :class="{ active: detectedType === t.value }"
                      :data-type="t.value"
                      @click="setForcedType(t.value)">
                      {{ t.label }}
                    </button>
                  </template>
                </div>
              </transition>
            </div>
            <div class="action-right">
              <!-- 取消按鈕：檢測進行中才顯示，含 loading 提示 -->
              <button
                v-if="isLoading"
                class="cancel-btn"
                @click="cancelCheck">
                <span class="send-spinner"></span>
                <span>分析中… 取消</span>
              </button>
              <button
                v-else
                class="send-btn"
                :class="{ 'elder-pulse': isElder && (inputText.trim() || images.length) }"
                :disabled="!inputText.trim() && !images.length"
                @click="doCheck">
                <span>🔍</span>
                <span>立即檢測</span>
              </button>
            </div>
          </div>

          <div class="elder-arrow-hint" v-if="isElder && (inputText.trim() || images.length)">
            <span class="eah-text">👆 輸入完畢？請按下「立即檢測」</span>
          </div>
        </div><!-- /input-card -->
        </div><!-- /content-inner -->
      </div><!-- /main-content -->

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
        <h2>您必須知道的<span>詐騙數字</span></h2>
        <!-- 期別 tab 切換 -->
        <div class="stats-tabs" v-if="statsPeriods.length > 1">
          <button
            v-for="(p, i) in statsPeriods" :key="i"
            class="stats-tab"
            :class="{ active: statsTabIndex === i }"
            @click="statsTabIndex = i">
            {{ p.label }}
          </button>
        </div>
        <p>數據來源：<a href="https://165dashboard.tw" target="_blank" rel="noopener" class="stats-source-link">165打詐儀表板</a></p>
      </div>

      <!-- 兩張大英雄卡：本月損失 + 本月案件 -->
      <div class="hero-cards" v-if="cards.length">
        <div
          v-for="(s, i) in cards.filter(c => c.lastRaw !== null)"
          :key="'hero-'+i"
          class="hero-card"
          :class="['hero-card--' + s.color, { visible: statsVisible }, i === 0 ? 'slide-left' : 'slide-right']"
          :style="{ transitionDelay: (i * 150) + 'ms' }">
          <div class="hc-label">{{ s.title }}</div>
          <div class="hc-body">
            <div class="hc-num">{{ s.current }}</div>
            <div class="hc-badge" :class="s.change < 0 ? 'badge-down' : 'badge-up'">
              <svg class="hc-arrow-svg" viewBox="0 0 16 16" fill="none">
                <path v-if="s.change < 0" d="M3 3 L13 13 M13 13 L6 13 M13 13 L13 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path v-else d="M3 13 L13 3 M13 3 L6 3 M13 3 L13 10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ Math.abs(s.change) }}%</span>
            </div>
          </div>
          <div class="hc-vs">
            <span class="hc-vs-label">與上月比較</span>
            <span class="hc-vs-val">{{ s.last }}</span>
          </div>
          <div class="hc-bars">
            <div class="hc-bar-row">
              <span class="hcbr-tag">本月</span>
              <div class="hcbr-track">
                <div class="hcbr-fill now" :class="s.color"
                  :style="{ width: statsVisible ? '100%' : '0%', transitionDelay: (i * 150 + 200) + 'ms' }"></div>
              </div>
            </div>
            <div class="hc-bar-row">
              <span class="hcbr-tag muted">上月</span>
              <div class="hcbr-track">
                <div class="hcbr-fill old"
                  :style="{ width: statsVisible ? Math.min(99, Math.round(s.currentRaw / s.lastRaw * 100)) + '%' : '0%', transitionDelay: (i * 150 + 320) + 'ms' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 四張小卡：今日 + 累計 + 手法 -->
      <div class="mini-cards" v-if="cards.length">
        <div
          v-for="(s, i) in cards.filter(c => c.lastRaw === null)"
          :key="'mini-'+i"
          class="mini-card"
          :class="['mini-card--' + s.color, { visible: statsVisible }]"
          :style="{ transitionDelay: (i * 100 + 450) + 'ms' }">
          <div class="mc-top">
            <span class="mc-icon">{{ s.icon }}</span>
          </div>
          <div class="mc-num">{{ s.current }}</div>
          <div class="mc-label">{{ s.title }}</div>
        </div>
      </div>

      <!-- 折線圖區塊 -->
      <div class="chart-section" v-if="chartData.length">
        <div class="chart-header">
          <div class="chart-title">📈 近 6 個月詐騙趨勢</div>
          <div class="chart-tabs">
            <button class="chart-tab" :class="{ active: chartMode === 'cases' }" @click="chartMode = 'cases'">案件數</button>
            <button class="chart-tab" :class="{ active: chartMode === 'losses' }" @click="chartMode = 'losses'">損失金額</button>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas ref="chartCanvas" height="80"></canvas>
        </div>
      </div>

      <button class="scroll-up" @click="scrollToMain">↑ 返回頂端</button>
    </div>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible, ok: toastType==='ok', err: toastType==='err' }">{{ toastMsg }}</div>

    <!-- Image hover preview — 固定在畫面正中間 -->
    <transition name="preview-fade">
      <div class="preview-modal" v-if="previewImg" @click="closePreview">
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
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { resultState } from '../composables/useResult.js'
import { isTTSEnabled, toggleTTS } from '../composables/useVoice.js'
import PhoneInput from '../components/PhoneInput.vue'
import { autoCheck, report, getStatsPeriods, getChartData } from '../services/api.js'
const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElder } = useElder()

const isFocused   = ref(false)
const inputText   = ref('')
const images      = ref([])
const isLoading   = ref(false)
let abortController = null // 用於取消進行中的 fetch 請求
const phoneIsValid = ref(false)
const phoneE164    = ref('')
const phoneMode   = ref(false)  // 鎖定電話模式，避免格式化字串干擾
const forcedType  = ref(null)   // 使用者手動選擇的類型（null = 自動偵測）

// 類型選項
const typeOptions = [
  { value: 'url',   label: '🔗 網址'   },
  { value: 'phone', label: '📞 電話'   },
]

function setForcedType(val) {
  // 再點一次同一個 → 取消強制
  if (forcedType.value === val) {
    forcedType.value = null
    phoneMode.value  = false
    return
  }
  forcedType.value = val
  if (val === 'phone') {
    phoneMode.value = true
  } else {
    phoneMode.value = false
  }
}

// ── Detection regex ──
// 支援：+886-912-345-678、+886912345678、0912-345-678、(02)1234-5678 等
const PHONE_RE = /^(\+\d{1,3}[\s\-]?\d{1,14}$|(\+\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4})/
const URL_RE   = /^(https?:\/\/|www\.|[a-zA-Z0-9]([a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,})/

function onPhoneInput(val) {
  // 只在清空時重置（vue-tel-input 清空會 emit ''）
  if (!val) {
    phoneMode.value    = false
    forcedType.value   = null
    phoneIsValid.value = false
    phoneE164.value    = ''
    inputText.value    = ''
  }
}

function onPhoneValid({ isValid, e164 }) {
  phoneIsValid.value = isValid
  phoneE164.value    = e164
}

// textarea 輸入時偵測電話格式，符合就鎖定 phoneMode
watch(inputText, (val) => {
  if (phoneMode.value) return
  const t = val.trim().replace(/[-\s()]/g, '')
  if (!val) {
    phoneIsValid.value = false
    phoneE164.value    = ''
  } else if (PHONE_RE.test(t)) {
    phoneMode.value  = true
    forcedType.value = 'phone'  // 自動偵測到電話 → chip 自動選中
  }
})

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

const detectedType = computed(() => {
  if (images.value.length > 0) return 'screenshot'
  if (forcedType.value) return forcedType.value   // 手動選擇優先
  if (phoneMode.value) return 'phone'
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
  abortController = new AbortController()
  try {
    const data = await autoCheck(rawQ, type)
    if (!data.level || (!data.reasons?.length && !data.label)) {
      showToast('📭 查無相關資料', 'ok'); return
    }
    // 截圖模式顯示檔名，避免 base64 字串塞爆結果頁
    const displayInput = type === 'screenshot' ? (images.value[0]?.name ?? '截圖') : rawQ
    resultState.data = data; resultState.lastInput = displayInput; resultState.lastType = type
    router.push('/result')
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('🚫 已取消檢測', 'ok')
    } else {
      showToast('❌ 無法連接 API — 請確認網路連線', 'err')
    }
  } finally { isLoading.value = false; abortController = null }
}

// ── Cancel ──
function cancelCheck() {
  if (abortController) {
    abortController.abort()
  }
}

// ── Clear input ──
function clearInput() {
  inputText.value    = ''
  phoneMode.value    = false
  forcedType.value   = null
  phoneIsValid.value = false
  phoneE164.value    = ''
  nextTick(() => autoResize())
}

// ── Health ──
async function checkHealth() {
  // AWS Lambda 不需要 health check，直接標記為上線
  apiOnline.value = true
  apiStatusText.value = 'API 連線正常 ✓'
}

// ── Scroll ──
function scrollToStats() {
  if (!statsPage.value) return
  // 補償 fixed navbar 高度（44px）
  const top = statsPage.value.getBoundingClientRect().top + window.scrollY - 44
  window.scrollTo({ top, behavior: 'smooth' })
}
function scrollToMain()  { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// ── Stats（從後端 /api/stats 載入）──
const statsPeriods  = ref([])   // 所有期別資料
const statsTabIndex = ref(0)    // 目前選中的 tab
const stats         = computed(() => statsPeriods.value[statsTabIndex.value]?.stats ?? [])
const cards         = computed(() => statsPeriods.value[statsTabIndex.value]?.cards ?? [])
const statsLabel    = computed(() => statsPeriods.value[statsTabIndex.value]?.label ?? '')
const statsError    = ref(false)

async function loadStats() {
  try {
    const d = await getStatsPeriods()
    statsPeriods.value = d.periods ?? []
  } catch {
    statsError.value = true
    // 載入失敗時顯示備用靜態資料
    statsPeriods.value = [{
      label: '115年2月',
      stats: [
        { icon:'💸', num:'46.4 億元', label:'詐騙財產損失金額',          source:'165打詐儀表板 115/02', pct:88, color:'red'    },
        { icon:'🎣', num:'7,792 件',  label:'詐騙案件受理數',            source:'165打詐儀表板 115/02', pct:55, color:'orange' },
        { icon:'🛒', num:'2,142 件',  label:'網路購物詐騙（當月第1名）',  source:'165打詐儀表板 115/02', pct:42, color:'orange' },
        { icon:'📈', num:'20.7 億元', label:'假投資詐騙財損（當月第2名）',source:'165打詐儀表板 115/02', pct:80, color:'red'    },
        { icon:'💑', num:'732 件',    label:'假交友投資詐騙（當月第3名）',source:'165打詐儀表板 115/02', pct:28, color:'orange' },
        { icon:'🎣', num:'497 件',    label:'釣魚連結詐騙（當月第4名）',  source:'165打詐儀表板 115/02', pct:19, color:'blue'   },
      ]
    }]
  }
}

// tab 切換時重置進場動畫
watch(statsTabIndex, () => {
  statsVisible.value = false
  nextTick(() => { statsVisible.value = true })
})

// Intersection observer for stats animation
let observer = null
function setupObserver() {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        statsVisible.value = true
        // 讓 stats-header 也觸發動畫
        const header = statsPage.value?.querySelector('.stats-header')
        if (header) header.classList.add('visible')
        observer.disconnect()
      }
    })
  }, { threshold: 0.12 })
  if (statsPage.value) observer.observe(statsPage.value)
}

// ── 折線圖 ──
const chartCanvas  = ref(null)
const chartData    = ref([])
const chartMode    = ref('cases')
let   chartInstance = null

async function loadChartData() {
  try {
    const d = await getChartData()
    chartData.value = d.months ?? []
    await nextTick()
    renderChart()
  } catch (e) {
    console.warn('chart 載入失敗', e)
  }
}

function renderChart() {
  if (!chartCanvas.value || !chartData.value.length) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches

  const labels  = chartData.value.map(m => m.label)
  const isLoss  = chartMode.value === 'losses'
  const values  = chartData.value.map(m => isLoss ? Math.round(m.losses / 10000) : m.cases)
  const color   = isLoss ? '#ff6b6b' : '#4d6ef5'
  const colorBg = isLoss ? 'rgba(255,107,107,0.12)' : 'rgba(77,110,245,0.12)'
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = isDarkMode ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.45)'

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: colorBg,
        borderWidth: 2.5,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDarkMode ? 'rgba(30,30,50,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDarkMode ? '#fff' : '#111',
          bodyColor:  isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => isLoss
              ? ` ${ctx.raw.toLocaleString()} 億元`
              : ` ${ctx.raw.toLocaleString()} 件`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 12, weight: '600' } },
          border: { display: false },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: v => isLoss ? v + ' 億' : v.toLocaleString(),
          },
          border: { display: false },
        },
      },
    },
  })
}

// 切換模式時重繪
watch(chartMode, () => { renderChart() })

function showToast(msg, type='') {
  toastMsg.value = msg; toastType.value = type; toastVisible.value = true
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}

// ── 打字時自動 focus 輸入框 ──
function focusOnType(e) {
  // 忽略修飾鍵、功能鍵、已有焦點在其他輸入元素時
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key.length !== 1) return // 只處理可見字元
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  textareaRef.value?.focus()
}

// ── 設定選單 ──
const menuOpen    = ref(false)
const settingsWrap = ref(null)

function onClickOutside(e) {
  if (settingsWrap.value && !settingsWrap.value.contains(e.target)) {
    menuOpen.value = false
  }
}
const navbarHidden = ref(false)
let lastScrollY = 0
let scrollStopTimer = null

function onScroll() {
  const y = window.scrollY
  // 往下滾超過 60px 就隱藏
  if (y > lastScrollY && y > 60) {
    navbarHidden.value = true
  }
  lastScrollY = y
  // 停止滾動 150ms 後顯示
  clearTimeout(scrollStopTimer)
  scrollStopTimer = setTimeout(() => {
    navbarHidden.value = false
  }, 150)
}

onMounted(() => {
  checkHealth()
  healthTimer = setInterval(checkHealth, 5000)
  loadStats()
  loadChartData()
  nextTick(setupObserver)
  phTimer = setInterval(() => { phIndex.value = (phIndex.value + 1) % placeholders.length }, 2800)
  document.addEventListener('keydown', focusOnType)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => {
  clearInterval(healthTimer)
  clearTimeout(toastTimer)
  clearInterval(phTimer)
  observer?.disconnect()
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  document.removeEventListener('keydown', focusOnType)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/* ── Base ── */
.page-wrap { background:var(--bg); color:var(--text); transition:background 0.25s,color 0.25s; overflow-x:hidden; }

/* ── Two full-height pages ── */
.page { min-height:100vh; position:relative; display:flex; flex-direction:column; overflow:clip; }
.page-main { padding-top:44px; } /* 補償 fixed navbar 高度 */

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

/* ── Navbar ── */
.navbar { background:var(--navbar-bg); padding:10px 20px; display:flex; align-items:center; justify-content:space-between; transition:background 0.25s, transform 0.18s cubic-bezier(0.4,0,0.2,1); position:fixed; top:0; left:0; right:0; z-index:200; }
.navbar.hidden { transform:translateY(-100%); }
.nav-title { color:rgba(255,255,255,0.9); font-size:14px; font-weight:700; }
.nav-actions { display:flex; gap:10px; align-items:center; }

/* 設定按鈕 */
.settings-wrap { position:relative; }
.settings-btn { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.2); border-radius:100px; padding:6px 14px 6px 10px; cursor:pointer; color:#fff; transition:background 0.2s; user-select:none; }
.settings-btn:hover { background:rgba(255,255,255,0.22); }
.settings-btn.active { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.4); }
.settings-btn svg { width:16px; height:16px; flex-shrink:0; }
.settings-label { font-size:12px; font-weight:700; white-space:nowrap; }

/* 下拉選單 */
.settings-menu { position:absolute; top:calc(100% + 8px); right:0; background:var(--surface); border:1.5px solid var(--border); border-radius:16px; padding:6px; min-width:200px; box-shadow:0 8px 32px rgba(0,0,0,0.18); z-index:300; }
.menu-drop-enter-active { transition:opacity 0.15s ease, transform 0.18s cubic-bezier(0.34,1.4,0.64,1); }
.menu-drop-leave-active { transition:opacity 0.12s ease, transform 0.12s ease; }
.menu-drop-enter-from,.menu-drop-leave-to { opacity:0; transform:translateY(-6px) scale(0.97); }

.menu-row { display:flex; align-items:center; gap:10px; width:100%; padding:9px 12px; border-radius:10px; border:none; background:transparent; cursor:pointer; color:var(--text); font-size:13px; font-weight:600; transition:background 0.15s; text-align:left; }
.menu-row:hover { background:var(--surface2); }
.menu-row.active { color:var(--primary); }
.menu-icon { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
.menu-text { flex:1; }

/* 選單內的 toggle pill */
.menu-pill { width:32px; height:17px; border-radius:100px; background:var(--border); position:relative; flex-shrink:0; transition:background 0.22s; }
.menu-pill.on { background:var(--primary); }
.menu-knob { position:absolute; top:2px; left:2px; width:13px; height:13px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:transform 0.22s cubic-bezier(0.34,1.4,0.64,1); }
.menu-pill.on .menu-knob { transform:translateX(15px); }

/* ── Main content ── */
.main-content { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 20px 0; position:relative; z-index:1; }
.content-inner { display:flex; flex-direction:column; align-items:center; gap:14px; width:100%; max-width:720px; }
header { text-align:center; flex-shrink:0; }
.input-card { flex-shrink:0; }

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
.cc-fade-enter-active { transition:opacity 0.18s ease; }
.cc-fade-leave-active { transition:opacity 0.14s ease; }
.cc-fade-enter-from,.cc-fade-leave-to { opacity:0; }

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

/* 清除按鈕 — 右上角 */
.clear-btn { position:absolute; top:8px; right:10px; width:20px; height:20px; border-radius:50%; background:rgba(128,128,128,0.18); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-muted); font-size:10px; font-weight:900; line-height:1; transition:background 0.2s, color 0.2s; z-index:2; }
.clear-btn:hover { background:var(--scam); color:#fff; }

/* 類型 chips — action-row 左側 inline */
.type-chips { display:flex; gap:6px; align-items:center; }
.type-chip  { padding:4px 12px; border-radius:100px; border:1.5px solid var(--border); background:var(--surface2); color:var(--text-sub); font-size:12px; font-weight:700; cursor:pointer; transition:all 0.18s; white-space:nowrap; }
.type-chip:hover  { border-color:var(--primary); color:var(--primary); }
/* 網址 — 藍 */
.type-chip.active[data-type="url"],
.type-chip.active[data-type="phone"],
.type-chip.active.screenshot { background:#dce4ff; border-color:#4d6ef5; color:#2D47E8; }
.page-wrap.elder .type-chip { font-size:15px; padding:5px 16px; }

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
.cancel-btn { display:flex; align-items:center; justify-content:center; gap:7px; background:var(--surface3,#e5e7eb); color:var(--text-sub); border:1.5px solid var(--border); border-radius:12px; padding:8px 18px; font-size:14px; font-weight:900; transition:background 0.2s,color 0.2s; white-space:nowrap; }
.cancel-btn:hover { background:var(--scam-bg); color:var(--scam); border-color:var(--scam); }
.cancel-btn .send-spinner { border-color:rgba(0,0,0,0.15); border-top-color:var(--text-sub); }
.cancel-btn:hover .send-spinner { border-color:rgba(255,45,45,0.2); border-top-color:var(--scam); }
.page-wrap.elder .cancel-btn { font-size:17px; padding:11px 22px; border-radius:14px; }
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
.page-stats { background:var(--bg); padding:0 20px 40px; align-items:center; gap: 12px; display: flex; flex-direction: column; height:100vh; overflow:hidden; }

.stats-header { text-align:center; padding:64px 20px 20px; position:relative; z-index:1; }
.stats-badge { display:inline-block; background:var(--primary-light); color:var(--primary); border:1.5px solid rgba(45,71,232,0.25); border-radius:100px; padding:6px 18px; font-size:12px; font-weight:700; letter-spacing:1px; margin-bottom:14px; }
.stats-header h2 { font-size:32px; font-weight:900; letter-spacing:-0.5px; line-height:1.2; }
.stats-header h2 span { color:var(--scam); }
.stats-header p  { margin-top:8px; font-size:13px; color:var(--text-muted); }
.page-wrap.elder .stats-header h2 { font-size:38px; }

/* Stats tabs */
.stats-tabs { display:flex; gap:6px; justify-content:center; margin:16px 0 4px; flex-wrap:wrap; }
.stats-tab  { padding:6px 18px; border-radius:100px; border:1.5px solid var(--border); background:var(--surface2); color:var(--text-sub); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; }
.stats-tab:hover  { border-color:var(--primary); color:var(--primary); }
.stats-tab.active { background:var(--primary); border-color:var(--primary); color:#fff; }
.stats-source-link { color:var(--primary); text-decoration:underline; text-underline-offset:3px; }
.stats-source-link:hover { opacity:0.75; }

/* ── 英雄卡（本月趨勢）── */
.hero-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 1000px;
  width: 100%;
  position: relative; z-index: 1;
}

.hero-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 24px;
  padding: 18px 18px 16px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
}
.hero-card.visible { opacity: 1; transform: translateY(0); }
.hero-card:hover { box-shadow: 0 10px 36px rgba(45,71,232,0.14); transform: translateY(-2px); }

.hc-label { font-size: 12px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
.hc-body  { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.hc-num   { font-size: 28px; font-weight: 900; color: var(--text); letter-spacing: -1px; line-height: 1; }
.hero-card--red    .hc-num { color: var(--scam); }
.hero-card--orange .hc-num { color: var(--warn); }
.hero-card--blue   .hc-num { color: var(--primary); }

.hc-badge {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 900;
  padding: 4px 10px; border-radius: 100px;
  flex-shrink: 0;
}
.hc-badge.badge-down { background: rgba(0,196,122,0.12); color: #00C47A; border: 1.5px solid rgba(0,196,122,0.25); }
.hc-badge.badge-up   { background: rgba(220,53,69,0.10);  color: var(--scam); border: 1.5px solid rgba(220,53,69,0.22); }
.hc-arrow { font-size: 15px; line-height: 1; }

.hc-vs { display: flex; justify-content: space-between; align-items: center; }
.hc-vs-label { font-size: 11px; color: var(--text-muted); }
.hc-vs-val   { font-size: 12px; font-weight: 700; color: var(--text-sub); }

.hc-bars { display: flex; flex-direction: column; gap: 7px; }
.hc-bar-row { display: flex; align-items: center; gap: 8px; }
.hcbr-tag  { font-size: 11px; font-weight: 700; color: var(--text-sub); width: 26px; flex-shrink: 0; }
.hcbr-tag.muted { color: var(--text-muted); }
.hcbr-track { flex: 1; height: 7px; background: var(--surface3); border-radius: 100px; overflow: hidden; }
.hcbr-fill { height: 100%; border-radius: 100px; width: 0%; transition: width 1.2s cubic-bezier(0.22,1,0.36,1); }
.hcbr-fill.now.red    { background: linear-gradient(90deg, var(--warn), var(--scam)); }
.hcbr-fill.now.orange { background: linear-gradient(90deg, #ffb300, var(--warn)); }
.hcbr-fill.now.blue   { background: linear-gradient(90deg, var(--primary), #7c93ff); }
.hcbr-fill.old { background: var(--surface3); filter: brightness(1.8); }

/* ── 入場動畫 ── */
/* 英雄卡：左右滑入 */
.hero-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
              transform 0.65s cubic-bezier(0.22,1,0.36,1);
}
.hero-card.slide-left  { transform: translateX(-48px) translateY(8px); }
.hero-card.slide-right { transform: translateX(48px) translateY(8px); }
.hero-card.visible { opacity: 1 !important; transform: translateX(0) translateY(0) !important; }

/* 小卡：依序淡入上移 */
.mini-card {
  opacity: 0;
  transform: translateY(32px) scale(0.96);
  transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
              transform 0.55s cubic-bezier(0.22,1,0.36,1);
}
.mini-card.visible { opacity: 1; transform: translateY(0) scale(1); }
.mini-card:hover { border-color: var(--primary); transform: translateY(-3px) scale(1.02) !important; box-shadow: 0 8px 28px rgba(45,71,232,0.15); }

/* 標題區淡入 */
.stats-header {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease 0.05s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s;
}
.stats-header.visible { opacity: 1; transform: translateY(0); }

/* 斜箭頭 SVG */
.hc-arrow-svg {
  width: 14px; height: 14px;
  flex-shrink: 0;
}
.hc-badge.badge-down .hc-arrow-svg { color: #00C47A; }
.hc-badge.badge-up   .hc-arrow-svg { color: var(--scam); }

/* 數字跳動效果 */
@keyframes numPop {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { transform: scale(1.06); }
  100% { transform: scale(1);    opacity: 1; }
}
.hero-card.visible .hc-num { animation: numPop 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards; animation-delay: inherit; }
.mini-card.visible .mc-num  { animation: numPop 0.45s cubic-bezier(0.34,1.4,0.64,1) forwards; animation-delay: inherit; }

/* ── 小卡（今日＋累計＋手法）── */
.mini-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 1000px;
  width: 100%;
  position: relative; z-index: 1;
  margin-top: 0;
}
.mini-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 14px 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
}
.mini-card.visible { opacity: 1; transform: translateY(0); }
.mini-card:hover { border-color: var(--primary); transform: translateY(-2px); }

.mc-top  { display: flex; align-items: center; justify-content: space-between; }
.mc-icon { font-size: 26px; line-height: 1; }
.mc-num  { font-size: 20px; font-weight: 900; color: var(--text); letter-spacing: -0.5px; line-height: 1.1; }
.mini-card--red    .mc-num { color: var(--scam); }
.mini-card--orange .mc-num { color: var(--warn); }
.mini-card--blue   .mc-num { color: var(--primary); }
.mc-label { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

/* 舊 stat-card 仍保留，不讓編譯錯誤 */
.stat-card { display: none; }

/* ── 折線圖 ── */
.chart-section {
  max-width: 1000px;
  width: 100%;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 24px;
  padding: 16px 18px 14px;
  position: relative; z-index: 1;
  margin-top: 0;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.chart-tabs {
  display: flex;
  gap: 6px;
}
.chart-tab {
  padding: 5px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: var(--surface2);
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.chart-tab:hover { border-color: var(--primary); color: var(--primary); }
.chart-tab.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.chart-wrap { position: relative; width: 100%; }
.stat-source { font-size:10px; color:var(--text-muted); font-family:'DM Mono',monospace; margin-top:auto; padding-top:6px; border-top:1px solid var(--border); }

/* ── 165風格趨勢卡片 ── */
.sc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.sc-title  { font-size:13px; color:var(--text-sub); font-weight:600; }
.sc-badge  { font-size:12px; font-weight:700; padding:3px 9px; border-radius:20px; display:flex; align-items:center; gap:3px; white-space:nowrap; }
.sc-badge.badge-down { background:rgba(0,180,100,0.12); color:#00b864; border:1px solid rgba(0,180,100,0.25); }
.sc-badge.badge-up   { background:rgba(220,53,69,0.12);  color:#dc3545; border:1px solid rgba(220,53,69,0.25); }

.sc-compare { display:flex; flex-direction:column; gap:10px; }
.sc-row     { display:flex; align-items:center; gap:10px; }
.sc-month   { font-size:11px; font-weight:700; color:var(--text); width:28px; flex-shrink:0; }
.sc-month.muted { color:var(--text-muted); }
.sc-bar-wrap { flex:1; height:8px; background:var(--surface3); border-radius:100px; overflow:hidden; }
.sc-bar-fill { height:100%; border-radius:100px; transition:width 1.2s cubic-bezier(0.22,1,0.36,1); width:0%; }
.sc-bar-fill.red    { background:linear-gradient(90deg,#ff6b6b,#ff3d32); }
.sc-bar-fill.orange { background:linear-gradient(90deg,#ffbb55,#fd7e14); }
.sc-bar-fill.blue   { background:linear-gradient(90deg,var(--primary),#7c93ff); }
.sc-bar-fill.muted  { background:var(--surface3); filter:brightness(1.5); }
.sc-val     { font-size:11px; color:var(--text); text-align:right; min-width:80px; flex-shrink:0; font-weight:600; }
.sc-val.muted { color:var(--text-muted); font-weight:400; }
.sc-val.red    { color:#ff6b6b; }
.sc-val.orange { color:#ffbb55; }
.sc-val.blue   { color:var(--primary); }

.page-wrap.elder .stat-num   { font-size:34px; }
.page-wrap.elder .stat-label { font-size:16px; }

/* Scroll up */
.scroll-up { display:flex; align-items:center; gap:6px; background:none; border:1.5px solid var(--border); border-radius:100px; padding:9px 20px; color:var(--text-sub); font-size:13px; font-weight:700; cursor:pointer; margin-top:20px; transition:all 0.2s; position:relative; z-index:1; }
.scroll-up:hover { border-color:var(--primary); color:var(--primary); }

/* ── Preview modal ── */
.preview-fade-enter-active { transition:opacity 0.18s ease, transform 0.22s cubic-bezier(0.34,1.4,0.64,1); }
.preview-fade-leave-active { transition:opacity 0.14s ease, transform 0.14s ease; }
.preview-fade-enter-from   { opacity:0; transform:scale(0.88); }
.preview-fade-leave-to     { opacity:0; transform:scale(0.92); }
.preview-modal { position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; padding:24px; cursor:zoom-out; }
.preview-box { background:var(--surface); border-radius:18px; overflow:hidden; box-shadow:0 24px 80px rgba(0,0,0,0.55), 0 0 0 1.5px var(--border); max-width:min(960px,90vw); display:flex; flex-direction:column; }
.preview-box img  { max-width:100%; max-height:80vh; object-fit:contain; display:block; }
.preview-name     { padding:10px 16px; font-size:12px; color:var(--text-muted); font-family:'DM Mono',monospace; border-top:1px solid var(--border); text-align:center; }

/* ── Toast ── */
.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:#111; color:#fff; border-radius:100px; padding:10px 22px; font-size:14px; font-weight:700; box-shadow:0 6px 28px rgba(0,0,0,0.22); transition:transform 0.3s cubic-bezier(0.34,1.4,0.64,1); z-index:9999; white-space:nowrap; pointer-events:none; }
.toast.show { transform:translateX(-50%) translateY(0); }
.toast.ok  { background:#00C47A; }
.toast.err { background:var(--scam); }

/* ── Mobile ── */
@media (max-width:700px) {
  .hero-cards { grid-template-columns: 1fr; }
  .mini-cards { grid-template-columns: 1fr 1fr; }
  .stats-header h2 { font-size:24px; }
  .hc-num { font-size:22px; }
  header h1 { font-size:18px; }
  .settings-label { display:none; }
  .settings-btn { padding:6px 10px; }
}
@media (max-width:440px) {
  .mini-cards { grid-template-columns: 1fr 1fr; }
  .hc-num { font-size:20px; }
}
</style>
