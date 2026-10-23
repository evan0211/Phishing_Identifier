<template>
  <teleport to="body">
    <div class="tour-overlay" v-if="visible">

      <!-- SVG 遮罩：整個畫面變暗，目標區域挖洞 -->
      <svg class="tour-mask" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="spotlight-mask">
            <!-- 白色 = 顯示遮罩（變暗），黑色 = 透明（挖洞） -->
            <rect width="100%" height="100%" fill="white"/>
            <rect
              v-if="hole.w > 0"
              :x="hole.x" :y="hole.y"
              :width="hole.w" :height="hole.h"
              :rx="hole.r" :ry="hole.r"
              fill="black"
            />
          </mask>
        </defs>
        <!-- 半透明黑色遮罩，套用挖洞 mask -->
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#spotlight-mask)"/>
        <!-- 目標框線 -->
        <rect
          v-if="hole.w > 0"
          :x="hole.x" :y="hole.y"
          :width="hole.w" :height="hole.h"
          :rx="hole.r" :ry="hole.r"
          fill="none"
          stroke="rgba(99,102,241,0.85)"
          stroke-width="2.5"
          stroke-dasharray="6 3"
        />
      </svg>

      <div v-for="(style, index) in blockerStyles" :key="index" class="tour-blocker" :style="style"></div>

      <!-- 說明卡片 -->
      <div key="tour-card" ref="cardRef" class="tour-card" :style="cardStyle" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <!-- 第一步：歡迎畫面，提供兩個選擇 -->
        <template v-if="current === 0 && !props.steps">
          <div class="tour-icon"><AppIcon name="shield" :size="36" /></div>
          <div id="tour-title" class="tour-title">{{ locale === 'en' ? 'Welcome to ScamRadar' : '歡迎使用防詐雷達' }}</div>
          <div class="tour-desc">{{ locale === 'en' ? 'A tool to identify scam URLs, phone numbers, and screenshots.' : '幫助你辨識詐騙網址、電話和截圖的工具。' }}</div>
          <div class="tour-welcome-btns">
            <button class="tour-start-btn" @click="skip">
              {{ locale === 'en' ? 'Start Using' : '直接開始使用' }}
            </button>
            <button class="tour-guide-btn" @click="next">
              {{ locale === 'en' ? 'Take a Tour' : '導覽模式' }}
            </button>
          </div>
        </template>

        <!-- 其他步驟：一般導覽卡片 -->
        <template v-else>
          <div class="tour-step-badge">{{ current }} / {{ activeSteps.length - 1 }}</div>
          <div class="tour-icon"><AppIcon :name="activeSteps[current].icon" :size="36" /></div>
          <div id="tour-title" class="tour-title">{{ activeSteps[current].title }}</div>
          <div class="tour-desc">{{ activeSteps[current].desc }}</div>
          <div class="tour-btns">
            <button class="tour-skip" @click="skip">{{ locale === 'en' ? 'Skip' : '跳過教學' }}</button>
            <button class="tour-next" @click="next">
              {{ activeSteps[current].runDemo ? (locale === 'en' ? 'Run Demo →' : '立即試跑 →') : activeSteps[current].openAiTour ? (locale === 'en' ? 'Go to AI →' : '前往 AI 頁 →') : current < activeSteps.length - 1 ? (locale === 'en' ? 'Next →' : '下一步 →') : (locale === 'en' ? 'Start ✓' : '開始使用 ✓') }}
            </button>
          </div>
          <div class="tour-dots">
            <span
              v-for="(_, i) in activeSteps" :key="i"
              class="tour-dot"
              :class="{ active: i === current }"
              @click="current = i; updatePosition()">
            </span>
          </div>
        </template>
      </div>

    </div>
  </teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import AppIcon from './AppIcon.vue'
import { placeTourCard } from '../utils/tourPosition.js'
import { locale } from '../composables/useLocale.js'

const props = defineProps({
  // 外部傳入步驟（結果頁用），不傳則用預設首頁步驟
  steps: { type: Array, default: null },
  // localStorage key，避免不同頁面互相影響
  storageKey: { type: String, default: 'tourDone' },
  // 首頁不需要自動捲動（元素都在視窗內）
  noScroll: { type: Boolean, default: false },
})

const emit = defineEmits(['set-input', 'do-check', 'open-ai', 'finish-all', 'open-menu', 'close-menu'])

const visible = ref(false)

// Lock the background once for the tour; restore its original overflow on exit.
let previousOverflow = null
function restoreOverflow() {
  if (previousOverflow !== null) {
    document.documentElement.style.overflow = previousOverflow
    previousOverflow = null
  }
}
watch(visible, val => {
  if (val) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  } else {
    restoreOverflow()
  }
}, { flush: 'sync' })

// 語言切換時重新計算位置（刷新卡片內容）
watch(locale, () => {
  if (visible.value) {
    nextTick(() => updatePosition())
  }
})

const current = ref(0)

// 範例網址（用於切換類型 & 立即檢測示範）
const DEMO_URL = 'https://ltoportalph-gov.com/'

const defaultSteps = computed(() => {
  const zh = locale.value !== 'en'
  return [
  {
    icon: 'shield',
    title: zh ? '歡迎使用防詐雷達' : 'Welcome to ScamRadar',
    desc: zh ? '這是一款幫助你辨識詐騙網址、電話和截圖的工具。讓我帶你快速了解各項功能。'
             : 'A tool to help you identify scam URLs, phone numbers, and screenshots. Let me walk you through the features.',
    target: null,
    openMenu: false,
  },
  {
    icon: 'edit',
    title: zh ? '輸入可疑內容' : 'Enter Suspicious Content',
    desc: zh ? '在輸入框貼上可疑的網址、電話號碼，或上傳截圖。系統會自動判斷類型。\n\n我們已幫你填入範例網址，你可以直接試試看。'
             : 'Paste a suspicious URL, phone number, or upload a screenshot. The system auto-detects the type.\n\nWe\'ve pre-filled a sample URL — feel free to try it.',
    target: '.smart-input',
    openMenu: false,
    fillDemo: true,
    cardSide: 'top',
  },
  {
    icon: 'camera',
    title: zh ? '上傳截圖' : 'Upload Screenshot',
    desc: zh ? '點擊輸入框右下角的相機圖示，可上傳詐騙截圖，系統會自動辨識圖中內容。'
             : 'Click the camera icon at the bottom-right of the input box to upload a scam screenshot.',
    target: '.camera-btn',
    openMenu: false,
  },
  {
    icon: 'globe',
    title: zh ? '切換語言' : 'Switch Language',
    desc: zh ? '點擊右下角的「中 | EN」按鈕，可在繁體中文與英文之間切換介面語言。'
             : 'Click the "中 | EN" button at the bottom-right to toggle between Traditional Chinese and English.',
    target: '.lang-toggle',
    openMenu: false,
  },
  {
    icon: 'settings',
    title: zh ? '輔助功能總覽' : 'Accessibility Features',
    desc: zh ? '點擊右上角設定，可一次看到所有輔助功能：\n長輩模式 — 放大字體、簡化介面\n深色模式 — 護眼夜間主題\n語音朗讀 — 滑鼠懸停自動朗讀內容'
             : 'Click the settings icon (top-right) to access all features:\nSenior Mode — larger fonts\nDark Mode — eye-friendly theme\nVoice Read — hover to hear content',
    target: '.settings-menu',
    openMenu: true,
  },
  {
    icon: 'accessibility',
    title: zh ? '長輩模式' : 'Senior Mode',
    desc: zh ? '開啟後字體放大、操作按鈕更大、減少動畫干擾，適合長輩或視力不佳的使用者。'
             : 'Enables larger fonts and clearer visual hints — ideal for elderly users or those with low vision.',
    target: '.menu-row',
    openMenu: true,
  },
  {
    icon: 'link',
    title: zh ? '切換檢測類型' : 'Switch Detection Type',
    desc: zh ? '系統已自動偵測為「網址」類型。試著點「電話」再切回「網址」，看看 chip 的切換效果。'
             : 'The system auto-detected "URL" type. Try clicking "Phone" then back to "URL" to see the chip switch.',
    target: '.type-chips',
    openMenu: false,
  },
  {
    icon: 'search',
    title: zh ? '試著檢測看看' : 'Try a Detection',
    desc: zh ? '範例網址已填好，按「立即試跑 →」，系統會幫你跑一次完整分析，帶你繼續看結果頁介紹。'
             : 'The sample URL is ready. Click "Run Demo →" to run a full analysis and continue to the result page.',
    target: '.send-btn',
    openMenu: false,
    runDemo: true,
  },
]})

// 實際使用的步驟：外部傳入優先，否則用預設
const activeSteps = computed(() => props.steps ?? defaultSteps.value)

// 挖洞區域
const hole = reactive({ x: 0, y: 0, w: 0, h: 0, r: 12 })
const cardStyle = ref({})
const cardRef = ref(null)
const viewportSize = ref({ width: window.innerWidth, height: window.innerHeight })
const blockerStyles = computed(() => {
  const { width, height } = viewportSize.value
  const left = Math.max(0, Math.min(width, hole.x))
  const right = Math.max(left, Math.min(width, hole.x + hole.w))
  const top = Math.max(0, Math.min(height, hole.y))
  const bottom = Math.max(top, Math.min(height, hole.y + hole.h))
  const regions = hole.w > 0 ? [
    [0, 0, width, top], [0, bottom, width, height - bottom],
    [0, top, left, bottom - top], [right, top, width - right, bottom - top],
  ] : [[0, 0, width, height]]
  return regions.map(([x, y, w, h]) => ({ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }))
})

function openSettingsMenu() {
  // 若選單已開啟（DOM 中存在）則不重複
  if (document.querySelector('.settings-menu')) return
  // 用 setTimeout 讓當前 click 事件完全結束後再開選單，
  // 避免 onClickOutside 把剛開的選單立刻關掉
  setTimeout(() => emit('open-menu'), 0)
}

// 等選單 DOM 真的出現後再執行 callback（最多等 600ms）
function waitForEl(selector, cb, timeout = 600) {
  const el = document.querySelector(selector)
  if (el) { cb(el); return }
  const start = Date.now()
  const timer = setInterval(() => {
    const found = document.querySelector(selector)
    if (found || Date.now() - start > timeout) {
      clearInterval(timer)
      if (found) cb(found)
    }
  }, 30)
}

function closeSettingsMenu() {
  if (document.querySelector('.settings-menu')) {
    emit('close-menu')
  }
}

function positionOnEl(el, skipScroll = false, cardSide = null) {
  const rect = el.getBoundingClientRect()
  const outside = rect.bottom <= 0 || rect.top >= window.innerHeight
    || rect.right <= 0 || rect.left >= window.innerWidth
  // Keep the current view for any visible target. Only bring offscreen targets
  // into view, with the smallest necessary movement.
  if (outside && !props.noScroll && !skipScroll) {
    const originalMargin = el.style.scrollMarginTop
    el.style.scrollMarginTop = '80px'
    el.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
    el.style.scrollMarginTop = originalMargin
  }
  _doPosition(el, cardSide)
}

function _doPosition(el, cardSide) {
  const rect = el.getBoundingClientRect()
  const pad = 12
  hole.x = rect.left - pad
  hole.y = rect.top - pad
  hole.w = rect.width + pad * 2
  hole.h = rect.height + pad * 2
  hole.r = 12

  const cardEl = cardRef.value
  if (!cardEl) return
  // Measure natural content height, not the height constrained by the last step.
  const cardH = Math.min(cardEl.scrollHeight, window.innerHeight - 32)
  const placement = placeTourCard({
    left: hole.x, right: hole.x + hole.w, top: hole.y, bottom: hole.y + hole.h,
  }, { width: cardEl.offsetWidth || 340, height: cardH }, {
    width: window.innerWidth, height: window.innerHeight,
  }, cardSide)
  cardStyle.value = {
    top: `${placement.top}px`, left: `${placement.left}px`, width: `${placement.width}px`,
    maxHeight: `${placement.maxHeight}px`, transform: 'none',
  }

}

function centerCard() {
  const width = Math.min(cardRef.value?.offsetWidth || 340, window.innerWidth - 32)
  const height = Math.min(cardRef.value?.scrollHeight || 300, window.innerHeight - 32)
  cardStyle.value = {
    top: `${Math.max(16, (window.innerHeight - height) / 2)}px`,
    left: `${Math.max(16, (window.innerWidth - width) / 2)}px`,
    maxHeight: `${height}px`, transform: 'none',
  }
}

function updatePosition() {
  if (!visible.value) return
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight }
  const step = activeSteps.value[current.value]

  if (!step.target) {
    hole.w = 0
    centerCard()
    return
  }

  if (step.openMenu) {
    openSettingsMenu()
    waitForEl(step.target, (el) => {
      // 選單是 fixed 定位，不需要捲動
      setTimeout(() => { if (visible.value && activeSteps.value[current.value] === step) positionOnEl(el, true) }, 150)
    }, 800)
    return
  }

  if (step.fillDemo) emit('set-input', DEMO_URL)
  setTimeout(() => {
    if (!visible.value) return
    const el = document.querySelector(step.target)
    if (!el) {
      hole.w = 0
      centerCard()
      return
    }
    positionOnEl(el, false, step.cardSide ?? null)
  }, 0)

}

async function next() {
  const step = activeSteps.value[current.value]
  if (step.runDemo) {
    // 設 flag 讓結果頁知道要繼續教學
    localStorage.setItem('resultTourPending', '1')
    finish()
    emit('do-check')
    return
  }
  if (step.openAiTour) {
    localStorage.setItem('aiTourPending', '1')
    finish()
    emit('open-ai')
    return
  }
  if (step.finishAll) {
    finish()
    emit('finish-all')
    return
  }
  const nextStep = activeSteps.value[current.value + 1]
  // 只有下一步不需要開選單時才關閉，避免選單閃爍
  if (step.openMenu && !nextStep?.openMenu) closeSettingsMenu()
  if (current.value < activeSteps.value.length - 1) {
    current.value++
    await nextTick()
    updatePosition()
  } else {
    finish()
  }
}

function skip() {
  if (activeSteps.value[current.value]?.openMenu) closeSettingsMenu()
  emit('set-input', '')
  visible.value = false
  // 清除所有 tour 相關 key，包含 pending flag
  ;['tourDone', 'resultTourDone', 'aiTourDone', 'resultTourPending', 'aiTourPending'].forEach(k => localStorage.setItem(k, '1'))
  localStorage.removeItem('resultTourPending')
  localStorage.removeItem('aiTourPending')
}

function finish() {
  if (activeSteps.value[current.value]?.openMenu) closeSettingsMenu()
  visible.value = false
  localStorage.setItem(props.storageKey, '1')
}

function updateOnScroll() {
  if (!visible.value) return
  const step = activeSteps.value[current.value]
  const el = step?.target && document.querySelector(step.target)
  if (el) _doPosition(el, step.cardSide)
}

function onKeydown(e) {
  if (!visible.value) return
  if (e.key === 'Enter') { e.preventDefault(); next() }
  if (e.key === 'Escape') { skip() }
}

onMounted(() => {
  if (!localStorage.getItem(props.storageKey)) {
      visible.value = true
    nextTick(() => updatePosition())
  }
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updateOnScroll, { passive: true })
})

onUnmounted(() => {
  visible.value = false
  restoreOverflow()
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updateOnScroll)
})

// 暴露 restart 方法，讓父元件可重播教學
async function restart() {
  localStorage.removeItem(props.storageKey)
  current.value = 0
  visible.value = true
  await nextTick()
  updatePosition()
}
defineExpose({ restart })
</script>

<style scoped>
.tour-overlay {
  position: fixed; inset: 0; z-index: 10000;
  pointer-events: none; /* 讓目標元素可以被看到，但不可互動 */
}

/* SVG 遮罩：覆蓋全畫面，挖洞讓目標透出 */
.tour-mask {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  pointer-events: none; /* Highlighted controls remain interactive. */
  cursor: pointer;
  z-index: 9500;
}

.tour-blocker { position:fixed; pointer-events:auto; z-index:9501; }

.tour-card {
  position: fixed;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 20px;
  padding: 24px 22px 18px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.28);
  z-index: 9502;
  pointer-events: all;
  max-height:calc(100dvh - 32px); overflow-y:auto; overscroll-behavior:contain;
  box-sizing: border-box;
}

[data-theme="dark"] .tour-card { background: #1A1F2E; color: #EEF2FF; }

.tour-step-badge {
  font-size: 11px; font-weight: 700; color: #9CA3AF;
  letter-spacing: 1px; text-transform: uppercase;
  margin-bottom: 10px;
}

.tour-icon { font-size: 36px; margin-bottom: 8px; }

.tour-title {
  font-size: 18px; font-weight: 900; color: #111827;
  margin-bottom: 8px; line-height: 1.3;
}
[data-theme="dark"] .tour-title { color: #EEF2FF; }

.tour-desc {
  font-size: 14px; color: #4B5563; line-height: 1.65;
  margin-bottom: 18px; white-space:pre-line;
}
[data-theme="dark"] .tour-desc { color: #9CA3AF; }

.tour-btns {
  display: flex; gap: 8px; margin-bottom: 14px;
}

.tour-welcome-btns {
  display: flex; flex-direction: row; gap: 10px; margin-top: 4px;
}

.tour-start-btn {
  flex: 1; background: #2D47E8; color: #fff;
  border: none; border-radius: 10px; padding: 12px;
  font-size: 14px; font-weight: 900; cursor: pointer;
  transition: background 0.18s;
}
.tour-start-btn:hover { background: #1A2FC7; }

.tour-guide-btn {
  flex: 1; background: #2D47E8; color: #fff;
  border: none; border-radius: 10px; padding: 12px;
  font-size: 14px; font-weight: 900; cursor: pointer;
  transition: background 0.18s;
}
.tour-guide-btn:hover { background: #1A2FC7; }

.tour-skip {
  flex: 1; background: #F3F4F6; color: #6B7280;
  border: none; border-radius: 10px; padding: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: background 0.18s;
}
.tour-skip:hover { background: #E5E7EB; }
[data-theme="dark"] .tour-skip { background: #2A3050; color: #9CA3AF; }

.tour-next {
  flex: 2; background: #2D47E8; color: #fff;
  border: none; border-radius: 10px; padding: 10px;
  font-size: 14px; font-weight: 900; cursor: pointer;
  transition: background 0.18s;
}
.tour-next:hover { background: #1A2FC7; }

.tour-dots {
  display: flex; justify-content: center; gap: 6px;
}
.tour-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #D1D5DB; cursor: pointer; transition: background 0.2s, transform 0.2s;
}
.tour-dot.active { background: #2D47E8; transform: scale(1.3); }
[data-theme="dark"] .tour-dot { background: #2D3557; }
[data-theme="dark"] .tour-dot.active { background: #6366f1; }

.tour-icon { color:var(--primary, #2D47E8); display:flex; }
[data-elder="true"] .tour-card { width:400px; padding:20px; }
[data-elder="true"] .tour-title { font-size:26px; }
[data-elder="true"] .tour-desc { font-size:20px; line-height:1.7; }
[data-elder="true"] .tour-card button { min-height:48px; font-size:18px; }
@media (max-height:600px) { .tour-icon { display:none; } .tour-card { padding:16px; } }

.tour-btns { position:sticky; bottom:12px; background:var(--surface, #fff); padding:8px 0; }
.tour-dots { position:sticky; bottom:0; background:var(--surface, #fff); padding:6px 0; }

.tour-card {
  transition:top 0.32s cubic-bezier(0.22, 1, 0.36, 1), left 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (prefers-reduced-motion:reduce) { .tour-card { transition:none; } }
</style>
