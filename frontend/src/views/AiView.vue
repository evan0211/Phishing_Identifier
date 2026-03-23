<template>
  <div class="page-wrap" :data-theme="isDark ? 'dark' : 'light'">

    <!-- Navbar -->
    <nav class="navbar">
      <button class="back-btn" @click="closeTab">✕ 關閉</button>
      <span class="nav-title">🤖 AI 深度分析</span>
      <label class="toggle-wrap theme-toggle" :class="{ active: isDark }" @click="toggleTheme">
        <span class="toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
        <span class="toggle-label">{{ isDark ? '深色' : '淺色' }}</span>
        <span class="toggle-pill"><span class="toggle-knob"></span></span>
      </label>
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
      <button class="go-home-btn" @click="closeTab">關閉</button>
    </div>

    <!-- AI 頁教學導覽 -->
    <OnboardingTour :steps="aiTourSteps" storage-key="aiTourDone" @finish-all="router.push('/')" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import OnboardingTour from '../components/OnboardingTour.vue'

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
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
  },
  {
    icon: '⚡',
    title: '立即行動 & 絕對不要',
    desc: '左欄列出你應該立刻做的事，以及絕對不能做的行為，幫助你避免損失擴大。',
    target: '.col-card',
    openMenu: false,
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
    }
  } catch {}

  // 若是從教學流程進來，強制顯示 AI 頁教學
  if (localStorage.getItem('aiTourPending')) {
    localStorage.removeItem('aiTourPending')
    localStorage.removeItem('aiTourDone') // 重置，確保教學會跑
  }
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
.navbar {
  background: var(--navbar-bg);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 200;
}
.back-btn {
  background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.25);
  border-radius: 100px;
  padding: 7px 16px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s;
}
.back-btn:hover { background: rgba(255,255,255,0.28); }
.nav-title {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}
.toggle-wrap {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1.5px solid rgba(255,255,255,0.2);
  border-radius: 100px;
  padding: 5px 10px 5px 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.toggle-wrap:hover { background: rgba(255,255,255,0.2); }
.toggle-wrap.active { background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.4); }
.toggle-icon  { font-size: 15px; }
.toggle-label { font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; }
.toggle-pill  { width: 30px; height: 16px; border-radius: 100px; background: rgba(255,255,255,0.25); position: relative; flex-shrink: 0; transition: background 0.25s; }
.toggle-wrap.active .toggle-pill { background: rgba(255,255,255,0.7); }
.toggle-knob  { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); transition: transform 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.toggle-wrap.active .toggle-knob { transform: translateX(14px); }

/* ── Main ── */
.ai-main {
  max-width: 960px;
  width: 100%;
  margin: 20px auto;
  padding: 0 24px 52px;
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
