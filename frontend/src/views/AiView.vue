<template>
  <div class="page-wrap" :data-theme="isDark ? 'dark' : 'light'">

    <!-- Navbar -->
    <nav class="navbar">
      <NavLogo />
      <div class="nav-actions">
        <div class="settings-wrap" ref="settingsWrap">
            <button class="settings-btn" :class="{ active: menuOpen }" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen" :aria-label="t('settings')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span class="settings-label">{{ t('settings') }}</span>
            </button>
<transition name="menu-drop">
              <div class="settings-menu" v-if="menuOpen">

                <button class="menu-row" :class="{ active: isElder }" :aria-pressed="isElder" @click="toggleElder">
                  <span class="menu-icon"><AppIcon name="accessibility" /></span>
                  <span class="menu-text">{{ t('elderMode') }}</span>
                  <span class="menu-pill" :class="{ on: isElder }"><span class="menu-knob"></span></span>
                </button>
                <button class="menu-row" :class="{ active: isDark }" @click="toggleTheme">
                  <span class="menu-icon"><AppIcon :name="isDark ? 'moon' : 'sun'" /></span>
                  <span class="menu-text">{{ isDark ? t('darkMode') : t('lightMode') }}</span>
                  <span class="menu-pill" :class="{ on: isDark }"><span class="menu-knob"></span></span>
                </button>
                <button class="menu-row" :class="{ active: isTTSEnabled }" @click="toggleTTS">
                  <span class="menu-icon"><AppIcon name="volume" /></span>
                  <span class="menu-text">{{ t('voiceRead') }}</span>
                  <span class="menu-pill" :class="{ on: isTTSEnabled }"><span class="menu-knob"></span></span>
                </button>
              </div>

            </transition>

        </div>
      </div>
    </nav>


    <div class="sub-nav"><button class="back-link" @click="closeTab">{{ locale === 'en' ? '← Back' : '← 返回' }}</button></div>

    <main class="ai-main" v-if="llmAnalysis">

      <!-- 重新載入中提示 -->
      <div v-if="isReloading" class="reload-banner"><AppIcon name="clock" /> {{ locale === 'en' ? 'Reloading in English…' : '重新載入中…' }}</div>

      <!-- 風險評分卡 -->
      <div class="score-card" :class="scoreLevel">
        <div class="sc-left">
          <div class="sc-score">{{ llmAnalysis.score }}</div>
          <div class="sc-label">AI 風險評分</div>
        </div>
        <div class="sc-right">
          <div class="sc-fraud" v-if="llmAnalysis.fraud_type">
            <span class="sc-fraud-icon"><AppIcon name="target" /></span>
            <div class="sc-fraud-text">{{ analysisText(llmAnalysis.fraud_type) }}</div>
          </div>
          <div class="sc-suggestion" v-if="llmAnalysis.suggestion">{{ analysisText(llmAnalysis.suggestion) }}</div>
        </div>
      </div>

      <!-- AI 分析原因 -->
      <div class="analysis-card" v-if="analysisReasons.length">
        <div class="card-title"><AppIcon name="search" /> AI 分析依據</div>
        <ul class="reason-list">
          <li v-for="(r, i) in analysisReasons" :key="i">{{ analysisText(r) }}</li>
        </ul>
      </div>

      <div class="analysis-card" v-else>
        {{ locale === 'en' ? 'The backend did not provide analysis reasons.' : '後端尚未提供分析原因。' }}
      </div>

      <!-- 立即行動 -->
      <div class="action-card" v-if="llmAdvice?.immediate_actions?.length">
        <div class="card-title"><AppIcon name="sparkles" /> 立即行動</div>
        <ul class="action-list ok">
          <li v-for="(a, i) in llmAdvice.immediate_actions" :key="i">
            <span class="action-icon"><AppIcon name="check" /></span><span>{{ analysisText(a) }}</span>
          </li>
        </ul>
      </div>

      <!-- 絕對不要 -->
      <div class="action-card" v-if="llmAdvice?.avoid_actions?.length">
        <div class="card-title bad"><AppIcon name="block" /> 絕對不要</div>
        <ul class="action-list bad">
          <li v-for="(a, i) in llmAdvice.avoid_actions" :key="i">
            <span class="action-icon"><AppIcon name="close" /></span><span>{{ analysisText(a) }}</span>
          </li>
        </ul>
      </div>

      <!-- 舉報步驟 -->
      <div class="action-card" v-if="llmAdvice?.report_steps?.length">
        <div class="card-title"><AppIcon name="clipboard" /> 舉報步驟</div>
        <ol class="step-list">
          <li v-for="(s, i) in llmAdvice.report_steps" :key="i">{{ analysisText(s) }}</li>
        </ol>
      </div>

      <!-- 已受騙處理 -->
      <div class="recovery-card" v-if="llmAdvice?.recovery_tips">
        <div class="card-title"><AppIcon name="shield" /> 已受騙怎麼辦</div>
        <p>{{ analysisText(llmAdvice.recovery_tips) }}</p>
      </div>

    </main>

    <!-- 無資料提示 -->
    <div class="no-result" v-else>
      <div style="font-size:52px"><AppIcon name="help" /></div>
      <p>找不到 AI 分析資料</p>
      <button class="go-home-btn" @click="closeTab">← 返回</button>
    </div>

    <!-- AI 頁教學導覽 -->
    <OnboardingTour :steps="aiTourSteps" storage-key="aiTourDone" @finish-all="router.push('/')" />

  </div>
</template>

<script setup>
import { resultState } from '../composables/useResult.js'
import AppIcon from '../components/AppIcon.vue'
import { getAnalysisReasons } from '../utils/analysisReasons.js'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { isTTSEnabled, toggleTTS } from '../composables/useVoice.js'
import { useLocale, t } from '../composables/useLocale.js'
import NavLogo from '../components/NavLogo.vue'
import OnboardingTour from '../components/OnboardingTour.vue'
import { phoneAnalysisText } from '../utils/analysisText.js'
import { autoCheck } from '../services/api.js'

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElderFn } = useElder()

// 若從教學流程進來，setup 階段同步清除
if (localStorage.getItem('aiTourPending')) {
  localStorage.removeItem('aiTourPending')
  localStorage.removeItem('aiTourDone')
}

function toggleElder() { toggleElderFn() }

const menuOpen     = ref(false)
const settingsWrap = ref(null)
const llmAnalysis  = ref(null)
const llmAdvice    = ref(null)
const lastInput    = ref('')
const lastType     = ref('url')
const analysisReasons = computed(() => getAnalysisReasons(llmAnalysis.value, lastType.value))
const isReloading  = ref(false)
const analysisText = text => phoneAnalysisText(text, lastType.value, locale.value)
const { locale, toggle: toggleLocale } = useLocale()

// 語言切換時重新呼叫 API 取得對應語言的分析結果
watch(locale, async () => {
  if (!lastInput.value) return
  isReloading.value = true
  try {
    const query = lastType.value === 'screenshot' ? resultState.lastQuery : lastInput.value
    if (!query) return
    const data = await autoCheck(query, lastType.value, '+886', null, locale.value)
    if (data.ai) {
      const reasons = getAnalysisReasons(data, lastType.value)
      llmAnalysis.value = { score: data.ai.score, fraud_type: data.ai.fraud_type, suggestion: data.ai.suggestion, reasons, level: data.level }
      if (data.advice) llmAdvice.value = data.advice
    }
  } catch {} finally {
    isReloading.value = false
  }
})

// AI 頁教學步驟 — computed 讓語言切換即時生效
const aiTourSteps = computed(() => {
  const zh = locale.value !== 'en'
  return [
    {
      icon: 'sparkles',
      title: zh ? 'AI 深度分析頁面' : 'AI Deep Analysis',
      desc: zh ? '這裡是 AI 對這筆資料的深度分析，比結果頁提供更詳細的判斷依據。' : 'This page shows AI\'s in-depth analysis — more detailed than the result page.',
      target: null, openMenu: false,
    },
    {
      icon: 'target',
      title: zh ? '頂部摘要' : 'Summary Card',
      desc: zh ? 'AI 風險評分、偵測到的詐騙手法類型，以及一句話建議，讓你快速掌握重點。' : 'AI risk score, detected fraud type, and a one-line suggestion for quick understanding.',
      target: '.score-card', openMenu: false, cardSide: 'right',
    },
    {
      icon: 'search',
      title: zh ? 'AI 分析依據' : 'AI Analysis Basis',
      desc: zh ? 'AI 列出判斷為此風險等級的具體依據，幫助你了解背後的推理過程。' : 'AI lists the specific evidence behind its risk rating so you understand the reasoning.',
      target: '.analysis-card', openMenu: false, cardSide: 'right',
    },
    {
      icon: 'sparkles',
      title: zh ? '立即行動 & 絕對不要' : 'Do & Don\'t',
      desc: zh ? '列出你應該立刻做的事，以及絕對不能做的行為，幫助你避免損失擴大。' : 'Lists what you should do immediately and what to absolutely avoid.',
      target: '.action-card', openMenu: false, cardSide: 'right',
    },
    {
      icon: 'clipboard',
      title: zh ? '舉報步驟' : 'Reporting Steps',
      desc: zh ? '提供逐步的舉報流程，依序操作即可完成向 165 反詐騙專線或相關單位的通報。' : 'Step-by-step guide to report to the 165 anti-scam hotline or relevant authorities.',
      target: '.step-list', openMenu: false, cardSide: 'right',
    },
    {
      icon: 'check',
      title: zh ? '教學完成' : 'Tour Complete',
      desc: zh ? '你已了解 AI 深度分析頁面的所有功能！按「開始使用 」回到首頁。' : 'You\'ve learned all features of the AI Deep Analysis page! Click "Start " to go home.',
      target: null, openMenu: false, finishAll: true,
    },
  ]
})

const scoreLevel = computed(() => {
  const s = llmAnalysis.value?.score ?? 0
  if (s >= 70) return 'scam'
  if (s >= 40) return 'warn'
  return 'safe'
})

function closeTab() { router.back() }

function onClickOutside(e) {
  if (settingsWrap.value && !settingsWrap.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.title = 'AI 深度分析 — 防詐雷達'
  try {
    const raw = localStorage.getItem('aiAnalysisData')
    if (raw) {
      const parsed = JSON.parse(raw)
      llmAnalysis.value = parsed.llmAnalysis ?? null
      llmAdvice.value   = parsed.llmAdvice   ?? null
      lastInput.value   = parsed.lastInput   ?? ''
      lastType.value    = parsed.lastType    ?? 'url'
      localStorage.removeItem('aiAnalysisData')
      sessionStorage.setItem('aiAnalysisData', JSON.stringify(parsed))
    } else {
      const session = sessionStorage.getItem('aiAnalysisData')
      if (session) {
        const parsed = JSON.parse(session)
        llmAnalysis.value = parsed.llmAnalysis ?? null
        llmAdvice.value   = parsed.llmAdvice   ?? null
        lastInput.value   = parsed.lastInput   ?? ''
        lastType.value    = parsed.lastType    ?? 'url'
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
.nav-actions { display:flex; gap:10px; align-items:center; margin-left:auto; }
.sub-nav { padding:8px 16px; }
.back-link { background:none; border:none; padding:0; color:var(--primary); font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
.back-link:hover { opacity:0.7; }
.settings-wrap { position:relative; }
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
.menu-lang-badge { font-size:12px; font-weight:900; color:var(--primary); background:rgba(45,71,232,0.1); border-radius:6px; padding:2px 7px; flex-shrink:0; }

/* ── Main ── */
.ai-main {
  max-width: 720px;
  width: 100%;
  margin: 20px auto;
  padding: 0 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 風險評分卡 ── */
.score-card {
  display: flex; align-items: center; gap: 20px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 18px; padding: 20px 24px;
  box-shadow: var(--shadow-sm);
}
.score-card.scam { border-color: var(--scam); background: var(--scam-bg); }
.score-card.warn  { border-color: var(--warn); }
.sc-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; min-width:72px; }
.sc-score { font-size: 52px; font-weight: 900; line-height: 1; }
.score-card.scam .sc-score { color: var(--scam); }
.score-card.warn .sc-score { color: var(--warn); }
.score-card.safe .sc-score { color: var(--safe); }
.sc-label { font-size: 10px; color: var(--text-muted); margin-top: 4px; white-space: nowrap; }
.sc-right { flex: 1; display: flex; flex-direction: column; gap: 8px; border-left: 1.5px solid var(--border); padding-left: 20px; }
.sc-fraud { display: flex; align-items: center; gap: 10px; }
.sc-fraud-icon { font-size: 22px; }
.sc-fraud-text { font-size: 18px; font-weight: 900; }
.sc-suggestion { font-size: 14px; line-height: 1.65; color: var(--text-sub); }

/* ── 通用卡片 ── */
.card-title {
  font-size: 13px; font-weight: 900; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;
}
.card-title.bad { color: var(--scam-text); }

.analysis-card, .action-card {
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 14px; padding: 18px 20px;
}

/* ── 分析原因 ── */
.reason-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.reason-list li {
  font-size: 14px; line-height: 1.6;
  padding: 10px 14px;
  background: var(--surface2); border-radius: 8px;
  border-left: 3px solid var(--primary);
}

/* ── 行動清單 ── */
.action-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.action-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.55; padding: 9px 12px; background: var(--surface2); border-radius: 8px; }
.action-icon { flex-shrink: 0; font-weight: 900; font-size: 13px; margin-top: 1px; }
.action-list.ok .action-icon  { color: var(--safe); }
.action-list.bad .action-icon { color: var(--scam); }

/* ── 舉報步驟 ── */
.step-list { list-style: none; counter-reset: step; display: flex; flex-direction: column; gap: 6px; }
.step-list li { counter-increment: step; display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.55; padding: 9px 12px; background: var(--surface2); border-radius: 8px; }
.step-list li::before { content: counter(step); flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

/* ── 已受騙 ── */
.recovery-card {
  background: var(--warn-bg); border: 1.5px solid rgba(255,140,0,0.25);
  border-radius: 14px; padding: 18px 20px;
}
.recovery-card p { font-size: 14px; line-height: 1.7; color: var(--text-sub); }

/* ── No result ── */
.no-result { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 24px; }
.no-result p { font-size: 16px; color: var(--text-sub); }
.go-home-btn { background: var(--primary); color: #fff; border: none; border-radius: 12px; padding: 12px 28px; font-size: 15px; font-weight: 900; cursor: pointer; }

.reload-banner { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 13px; color: var(--text-muted); text-align: center; }

@media (max-width: 640px) {
  .settings-label { display: none; }
  .settings-btn   { padding: 6px 10px; }
  .ai-main { padding: 12px 12px 48px; }
  .score-card { flex-direction: column; align-items: flex-start; gap: 14px; }
  .sc-right { border-left: none; border-top: 1.5px solid var(--border); padding-left: 0; padding-top: 14px; width: 100%; }
}

/* Keep enlarged setting labels and switches inside the panel. */
.settings-menu {
  width:min(320px, calc(100vw - 32px)); min-width:0;
  max-height:calc(100vh - 80px); max-height:calc(100dvh - 80px);
  overflow-y:auto; overscroll-behavior:contain;
}
.settings-menu .menu-row { min-width:0; gap:12px; }
.settings-menu .menu-text { min-width:0; white-space:normal; overflow-wrap:anywhere; line-height:1.5; }
.settings-menu .menu-icon { width:24px; flex:0 0 24px; }
.settings-menu .menu-pill, .settings-menu .menu-lang-badge { flex-shrink:0; }

.settings-menu { top:calc(100% + 24px); }

.settings-menu .menu-icon { display:flex; align-items:center; justify-content:center; }
</style>
