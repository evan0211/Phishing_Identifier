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

      <!-- 說明卡片 -->
      <div class="tour-card" :style="cardStyle">
        <div class="tour-step-badge">{{ current + 1 }} / {{ activeSteps.length }}</div>
        <div class="tour-icon">{{ activeSteps[current].icon }}</div>
        <div class="tour-title">{{ activeSteps[current].title }}</div>
        <div class="tour-desc">{{ activeSteps[current].desc }}</div>
        <div class="tour-btns">
          <button class="tour-skip" @click="skip">跳過教學</button>
          <button class="tour-next" @click="next">
            {{ activeSteps[current].runDemo ? '立即試跑 →' : activeSteps[current].openAiTour ? '前往 AI 頁 →' : current < activeSteps.length - 1 ? '下一步 →' : '開始使用 ✓' }}
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
      </div>

    </div>
  </teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // 外部傳入步驟（結果頁用），不傳則用預設首頁步驟
  steps: { type: Array, default: null },
  // localStorage key，避免不同頁面互相影響
  storageKey: { type: String, default: 'tourDone' },
})

const emit = defineEmits(['set-input', 'do-check', 'open-ai', 'finish-all', 'open-menu', 'close-menu'])

const visible = ref(false)
const current = ref(0)

// 範例網址（用於切換類型 & 立即檢測示範）
const DEMO_URL = 'https://ltoportalph-gov.com/'

const defaultSteps = [
  {
    icon: '🛡️',
    title: '歡迎使用防詐雷達',
    desc: '這是一款幫助你辨識詐騙網址、電話和截圖的工具。讓我帶你快速了解各項功能。',
    target: null,
    openMenu: false,
  },
  {
    icon: '📝',
    title: '輸入可疑內容',
    desc: '在輸入框貼上可疑的網址、電話號碼，或上傳截圖。系統會自動判斷類型。\n\n我們已幫你填入範例網址，你可以直接試試看。',
    target: '.input-card',
    openMenu: false,
    fillDemo: true,
  },
  {
    icon: '📸',
    title: '上傳截圖',
    desc: '點擊輸入框右下角的相機圖示，可上傳詐騙截圖，系統會自動辨識圖中內容。',
    target: '.camera-btn',
    openMenu: false,
  },
  {
    icon: '🌐',
    title: '切換語言',
    desc: '點擊右下角的「中 | EN」按鈕，可在繁體中文與英文之間切換介面語言。',
    target: '.lang-toggle',
    openMenu: false,
  },
  {
    icon: '⚙️',
    title: '輔助功能總覽',
    desc: '點擊右上角設定，可一次看到所有輔助功能：\n👴 長輩模式 — 放大字體、簡化介面\n🌙 深色模式 — 護眼夜間主題\n🔊 語音朗讀 — 滑鼠懸停自動朗讀內容',
    target: '.settings-menu',
    openMenu: true,
  },
  {
    icon: '👴',
    title: '長輩模式',
    desc: '開啟後字體放大、動畫提示更明顯，適合長輩或視力不佳的使用者。',
    target: '.menu-row',
    openMenu: true,
  },
  {
    icon: '🔗',
    title: '切換檢測類型',
    desc: '系統已自動偵測為「網址」類型。試著點「電話」再切回「網址」，看看 chip 的切換效果。',
    target: '.type-chips',
    openMenu: false,
  },
  {
    icon: '🔍',
    title: '試著檢測看看',
    desc: '範例網址已填好，按「立即試跑 →」，系統會幫你跑一次完整分析，帶你繼續看結果頁介紹。',
    target: '.send-btn',
    openMenu: false,
    runDemo: true,
  },
]

// 實際使用的步驟：外部傳入優先，否則用預設
const activeSteps = computed(() => props.steps ?? defaultSteps)

// 挖洞區域
const hole = reactive({ x: 0, y: 0, w: 0, h: 0, r: 12 })
const cardStyle = ref({})

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

function positionOnEl(el) {
  const rect = el.getBoundingClientRect()
  const pad = 12
  hole.x = rect.left - pad
  hole.y = rect.top - pad
  hole.w = rect.width + pad * 2
  hole.h = rect.height + pad * 2
  hole.r = 12

  const cardEl = document.querySelector('.tour-card')
  const cardH = cardEl ? cardEl.offsetHeight + 16 : 300
  const cardW = 340
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  let top
  if (spaceBelow >= cardH)      top = rect.bottom + 16
  else if (spaceAbove >= cardH) top = rect.top - cardH
  else                          top = Math.max(16, window.innerHeight / 2 - cardH / 2 + 60)

  let left = rect.left + rect.width / 2 - cardW / 2
  left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16))
  cardStyle.value = { top: top + 'px', left: left + 'px', transform: 'none' }
}

function updatePosition() {
  const step = activeSteps.value[current.value]

  if (!step.target) {
    hole.w = 0
    cardStyle.value = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    return
  }

  if (step.openMenu) {
    openSettingsMenu()
    waitForEl(step.target, (el) => {
      setTimeout(() => positionOnEl(el), 150)
    }, 800)
    return
  }

  setTimeout(() => {
    const el = document.querySelector(step.target)
    if (!el) {
      hole.w = 0
      cardStyle.value = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      return
    }
    positionOnEl(el)
  }, 0)

  if (step.fillDemo) {
    emit('set-input', DEMO_URL)
    setTimeout(() => updatePosition(), 80)
  }
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
  visible.value = false
  // 跳過時一次標記所有頁面的導覽為已完成，避免後續頁面再跳出
  ;['tourDone', 'resultTourDone', 'aiTourDone'].forEach(k => localStorage.setItem(k, '1'))
}

function finish() {
  if (activeSteps.value[current.value]?.openMenu) closeSettingsMenu()
  visible.value = false
  // 正常完成只標記當前頁
  localStorage.setItem(props.storageKey, '1')
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
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

// 暴露 restart 方法，讓父元件可重播教學
function restart() {
  localStorage.removeItem(props.storageKey)
  current.value = 0
  visible.value = true
  nextTick(() => updatePosition())
}
defineExpose({ restart })
</script>

<style scoped>
.tour-overlay {
  position: fixed; inset: 0; z-index: 9500;
  pointer-events: none; /* 讓目標元素可以被看到，但不可互動 */
}

/* SVG 遮罩：覆蓋全畫面，挖洞讓目標透出 */
.tour-mask {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  pointer-events: all; /* 點擊遮罩區域可跳過 */
  cursor: pointer;
  z-index: 9500;
}

.tour-card {
  position: fixed;
  width: 340px;
  background: #fff;
  border-radius: 20px;
  padding: 24px 22px 18px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.28);
  z-index: 9502;
  pointer-events: all;
  transition: top 0.3s ease, left 0.3s ease;
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
  margin-bottom: 18px;
}
[data-theme="dark"] .tour-desc { color: #9CA3AF; }

.tour-btns {
  display: flex; gap: 8px; margin-bottom: 14px;
}

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
</style>
