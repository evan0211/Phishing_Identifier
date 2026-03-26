<template>
  <div class="page-wrap" :data-theme="isDark ? 'dark' : 'light'">

    <!-- Navbar -->
    <nav class="navbar">
      <button class="back-btn" @click="closeTab">← 返回</button>
      <span class="nav-title">AI 深度分析</span>
      <div class="settings-wrap" ref="settingsWrap">
        <button class="settings-btn" :class="{ active: menuOpen }" @click="menuOpen = !menuOpen" :aria-label="t('settings')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span class="settings-label">{{ t('settings') }}</span>
        </button>
        <transition name="menu-drop">
          <div class="settings-menu" v-if="menuOpen">
            <button class="menu-row" :class="{ active: isElder }" @click="toggleElder">
              <span class="menu-icon">👴</span>
              <span class="menu-text">{{ t('elderMode') }}</span>
              <span class="menu-pill" :class="{ on: isElder }"><span class="menu-knob"></span></span>
            </button>
            <button class="menu-row" :class="{ active: isDark }" @click="toggleTheme">
              <span class="menu-icon">{{ isDark ? '🌙' : '☀️' }}</span>
              <span class="menu-text">{{ isDark ? t('darkMode') : t('lightMode') }}</span>
              <span class="menu-pill" :class="{ on: isDark }"><span class="menu-knob"></span></span>
            </button>
            <button class="menu-row" :class="{ active: isTTSEnabled }" @click="toggleTTS">
              <span class="menu-icon">🔊</span>
              <span class="menu-text">{{ t('voiceRead') }}</span>
              <span class="menu-pill" :class="{ on: isTTSEnabled }"><span class="menu-knob"></span></span>
            </button>
          </div>
        </transition>
      </div>
    </nav>

    <main class="ai-main" v-if="llmAnalysis">

      <!-- 頂部摘要橫幅 -->
      <div class="summary-banner" :class="scoreLevel">
        <div class="sb-score">
          <span class="sb-num">{{ llmAnalysis.score }}</span>
          <span class="sb-unit">分</span>
          <span class="sb-label">AI 風險評分</span>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-fraud" v-if="llmAnalysis.fraud_type">
          <span class="sb-fraud-icon">🎯</span>
          <div>
            <div class="sb-fraud-label">詐騙手法</div>
            <div class="sb-fraud-val">{{ llmAnalysis.fraud_type }}</div>
          </div>
        </div>
        <div class="sb-divider" v-if="llmAnalysis.suggestion"></div>
        <div class="sb-suggestion" v-if="llmAnalysis.suggestion">
          <span>💡</span>
          <p>{{ llmAnalysis.suggestion }}</p>
        </div>
      </div>

      <!-- 對策建議兩欄 -->
      <div class="advice-grid" v-if="llmAdvice">

        <div class="col-card">
          <div class="adv-section" v-if="llmAdvice.immediate_actions?.length">
            <div class="sec-title">⚡ 立即行動</div>
            <ul class="adv-list">
              <li v-for="(a, i) in llmAdvice.immediate_actions" :key="i">
                <span class="adv-icon ok">✓</span><span>{{ a }}</span>
              </li>
            </ul>
          </div>
          <div class="adv-section" v-if="llmAdvice.avoid_actions?.length">
            <div class="sec-title bad">🚫 絕對不要</div>
            <ul class="adv-list">
              <li v-for="(a, i) in llmAdvice.avoid_actions" :key="i">
                <span class="adv-icon bad">✗</span><span>{{ a }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-card">
          <div class="adv-section" v-if="llmAdvice.report_steps?.length">
            <div class="sec-title">📋 舉報步驟</div>
            <ol class="adv-steps">
              <li v-for="(s, i) in llmAdvice.report_steps" :key="i">{{ s }}</li>
            </ol>
          </div>
          <div class="adv-recovery" v-if="llmAdvice.recovery_tips">
            <div class="sec-title">🩹 已受騙怎麼辦</div>
            <p>{{ llmAdvice.recovery_tips }}</p>
          </div>
        </div>

      </div>

    </main>

    <div class="no-result" v-else>
      <div style="font-size:52px">😕</div>
      <p>找不到 AI 分析資料，請關閉此頁重試。</p>
      <button class="go-home-btn" @click="closeTab">← 返回</button>
    </div>

    <!-- AI 頁教學導覽 -->
    <OnboardingTour :steps="aiTourSteps" storage-key="aiTourDone" @finish-all="router.push('/')" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { isTTSEnabled, toggleTTS } from '../composables/useVoice.js'
import { useLocale, t } from '../composables/useLocale.js'
import OnboardingTour from '../components/OnboardingTour.vue'

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElderFn } = useElder()

// 若從教學流程進來，setup 階段同步清除，確保 OnboardingTour 掛載時能偵測到
if (localStorage.getItem('aiTourPending')) {
  localStorage.removeItem('aiTourPending')
  localStorage.removeItem('aiTourDone')
}

function toggleElder() { toggleElderFn() }

const menuOpen     = ref(false)
const settingsWrap = ref(null)

function onClickOutside(e) {
  if (e.target.closest('.tour-overlay')) return
  if (settingsWrap.value && !settingsWrap.value.contains(e.target)) {
    menuOpen.value = false
  }
}
const llmAnalysis = ref(null)
const llmAdvice   = ref(null)

const scoreLevel = computed(() => {
  const s = llmAnalysis.value?.score ?? 0
  if (s >= 70) return 'scam'
  if (s >= 40) return 'warn'
  return 'safe'
})

function closeTab() { router.back() }

// AI 頁教學步驟
const aiTourSteps = [
  {
    icon: '🤖',
    title: 'AI 深度分析頁面',
    desc: '這裡是 AI 對這筆資料的深度分析，比結果頁提供更詳細的判斷依據。',
    target: null,
    openMenu: false,
  },
  {
    icon: '🎯',
    title: '頂部摘要橫幅',
    desc: 'AI 風險評分、偵測到的詐騙手法類型，以及一句話建議，讓你快速掌握重點。',
    target: '.summary-banner',
    openMenu: false,
    cardSide: 'right',
  },
  {
    icon: '⚡',
    title: '立即行動 & 絕對不要',
    desc: '左欄列出你應該立刻做的事，以及絕對不能做的行為，幫助你避免損失擴大。',
    target: '.col-card',
    openMenu: false,
    cardSide: 'right',
  },
  {
    icon: '📋',
    title: '舉報步驟',
    desc: '右欄提供逐步的舉報流程，依序操作即可完成向 165 反詐騙專線或相關單位的通報。',
    target: '.adv-steps',
    openMenu: false,
    cardSide: 'left',
  },
  {
    icon: '🩹',
    title: '已受騙怎麼辦',
    desc: '如果你或家人已經受騙，這裡提供緊急處置建議，包含凍結帳戶、報案等具體步驟。',
    target: '.adv-recovery',
    openMenu: false,
    cardSide: 'left',
  },
  {
    icon: '✅',
    title: '教學完成，開始使用',
    desc: '你已經了解防詐雷達的所有功能！按「開始使用 ✓」回到首頁，開始保護自己和家人。',
    target: null,
    openMenu: false,
    finishAll: true,
  },
]

onMounted(() => {
  document.title = 'AI 深度分析 — 防詐雷達'
  try {
    const raw = localStorage.getItem('aiAnalysisData')
    if (raw) {
      const parsed = JSON.parse(raw)
      llmAnalysis.value = parsed.llmAnalysis ?? null
      llmAdvice.value   = parsed.llmAdvice   ?? null
      localStorage.removeItem('aiAnalysisData')
      // 刷新時可從 sessionStorage 恢復
      sessionStorage.setItem('aiAnalysisData', JSON.stringify(parsed))
    } else {
      // 嘗試從 sessionStorage 恢復（刷新情境）
      const session = sessionStorage.getItem('aiAnalysisData')
      if (session) {
        const parsed = JSON.parse(session)
        llmAnalysis.value = parsed.llmAnalysis ?? null
        llmAdvice.value   = parsed.llmAdvice   ?? null
      }
    }
  } catch {}

  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/* 直接沿用全域 CSS 變數，不重複定義顏色 */
.page-wrap {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans TC', sans-serif;
  transition: background 0.25s, color 0.25s;
}

/* ── Navbar ── */
.navbar { background:var(--navbar-bg); padding:10px 16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:200; transition:background 0.25s; height:56px; }
.back-btn { background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:7px 16px; color:#fff; font-size:13px; font-weight:700; white-space:nowrap; cursor:pointer; transition:background 0.2s; flex-shrink:0; }
.back-btn:hover { background:rgba(255,255,255,0.28); }
.nav-title { position:absolute; left:50%; transform:translateX(-50%); color:#fff; font-size:15px; font-weight:700; pointer-events:none; }
.settings-wrap { position:relative; margin-left:auto; }
.settings-btn { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.2); border-radius:100px; padding:7px 14px 7px 10px; cursor:pointer; color:#fff; transition:background 0.2s; user-select:none; }
.settings-btn:hover { background:rgba(255,255,255,0.22); }
.settings-btn.active { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.4); }
.settings-btn svg { width:16px; height:16px; flex-shrink:0; }
.settings-label { font-size:12px; font-weight:700; white-space:nowrap; }
.settings-menu { position:absolute; top:calc(100% + 8px); right:0; background:var(--surface); border:1.5px solid var(--border); border-radius:16px; padding:6px; min-width:200px; box-shadow:0 8px 32px rgba(0,0,0,0.18); z-index:300; }
.menu-drop-enter-active { transition:opacity 0.15s ease, transform 0.18s cubic-bezier(0.34,1.4,0.64,1); }
.menu-drop-leave-active { transition:opacity 0.12s ease, transform 0.12s ease; }
.menu-drop-enter-from,.menu-drop-leave-to { opacity:0; transform:translateY(-6px) scale(0.97); }
.menu-row { display:flex; align-items:center; gap:10px; width:100%; padding:9px 12px; border-radius:10px; border:none; background:transparent; cursor:pointer; color:var(--text); font-size:13px; font-weight:600; transition:background 0.15s; text-align:left; }
.menu-row:hover { background:var(--surface2); }
.menu-row.active { color:var(--primary); }
.menu-icon { font-size:16px; flex-shrink:0; width:20px; text-align:center; }
.menu-text { flex:1; }
.menu-pill { width:32px; height:17px; border-radius:100px; background:var(--border); position:relative; flex-shrink:0; transition:background 0.22s; }
.menu-pill.on { background:var(--primary); }
.menu-knob { position:absolute; top:2px; left:2px; width:13px; height:13px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:transform 0.22s cubic-bezier(0.34,1.4,0.64,1); }
.menu-pill.on .menu-knob { transform:translateX(15px); }

/* ── Main ── */
.ai-main {
  max-width: 1100px;
  width: 100%;
  margin: 20px auto;
  padding: 0 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 摘要橫幅 ── */
.summary-banner {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.sb-score {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px 24px; min-width: 100px; flex-shrink: 0;
  background: var(--surface2);
  gap: 2px;
}
.sb-num  { font-size: 44px; font-weight: 900; line-height: 1; }
.sb-unit { font-size: 13px; font-weight: 700; opacity: 0.7; }
.sb-label { font-size: 10px; color: var(--text-muted); margin-top: 4px; white-space: nowrap; }
.summary-banner.scam .sb-num { color: var(--scam); }
.summary-banner.warn .sb-num { color: var(--warn); }
.summary-banner.safe .sb-num { color: var(--safe); }

.sb-divider { width: 1.5px; background: var(--border); flex-shrink: 0; }

.sb-fraud {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 22px; flex-shrink: 0;
}
.sb-fraud-icon { font-size: 26px; }
.sb-fraud-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
.sb-fraud-val { font-size: 20px; font-weight: 900; }

.sb-suggestion {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 20px 22px; flex: 1;
}
.sb-suggestion span { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.sb-suggestion p { font-size: 14px; line-height: 1.7; color: var(--text-sub); }

/* ── 對策兩欄 ── */
.advice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) { .advice-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
  .settings-label { display: none; }
  .settings-btn   { padding: 6px 10px; }
  .ai-main { padding: 12px 12px 48px; }
  .summary-banner { flex-direction: column; }
  .sb-divider { width: 100%; height: 1.5px; }
  .sb-score { padding: 16px; }
  .sb-fraud { padding: 16px; }
  .sb-suggestion { padding: 16px; }
}

.col-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.adv-section { display: flex; flex-direction: column; gap: 8px; }

.sec-title {
  font-size: 14px; font-weight: 900; margin-bottom: 2px;
  color: var(--text);
}
.sec-title.bad { color: var(--scam-text); }

.adv-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.adv-list li {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 14px; line-height: 1.55;
  padding: 9px 12px;
  background: var(--surface2);
  border-radius: 8px;
}
.adv-icon { flex-shrink: 0; font-weight: 900; font-size: 13px; margin-top: 1px; }
.adv-icon.ok  { color: var(--safe); }
.adv-icon.bad { color: var(--scam); }

.adv-steps { list-style: none; counter-reset: step; display: flex; flex-direction: column; gap: 6px; }
.adv-steps li {
  counter-increment: step;
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 14px; line-height: 1.55;
  padding: 9px 12px;
  background: var(--surface2);
  border-radius: 8px;
}
.adv-steps li::before {
  content: counter(step);
  flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}

.adv-recovery {
  background: var(--warn-bg);
  border: 1.5px solid rgba(255,140,0,0.2);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.adv-recovery p { font-size: 14px; line-height: 1.65; color: var(--text-sub); }

/* ── No result ── */
.no-result {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; padding: 60px 24px;
}
.no-result p { font-size: 16px; color: var(--text-sub); }
.go-home-btn {
  background: var(--primary); color: #fff; border: none;
  border-radius: 12px; padding: 12px 28px;
  font-size: 15px; font-weight: 900; cursor: pointer;
}
</style>
