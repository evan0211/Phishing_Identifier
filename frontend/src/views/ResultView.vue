<template>
  <div class="page-wrap" :class="[mode + '-mode', { elder: isElder }]">

    <!-- Navbar -->
    <nav class="navbar">
      <button class="back-btn" @click="goBack">{{ t('back') }}</button>
      <span class="nav-title" @click="goBack" style="cursor:pointer">{{ t('analysisResult') }}</span>
      <div class="nav-actions">
        <!-- 設定按鈕（與首頁一致） -->
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
      </div>
    </nav>

    <!-- No result guard -->
    <div v-if="!result" class="no-result">
      <div class="no-result-icon">🔍</div>
      <p>{{ t('noResult') }}</p>
      <button class="go-home-btn" @click="goBack">{{ t('goHome') }}</button>
    </div>

    <!-- Two-column layout -->
    <main v-else class="result-main">

      <!-- ── LEFT COLUMN: 分析結果 ── -->
      <div class="col col-left">

        <!-- Risk banner -->
        <div class="risk-banner" :class="[mode, mode.includes('_') ? mode.split('_')[0] : mode]">
          <div class="rb-badge">
            <span class="rb-badge-score">{{ weightedScore }}</span>
          </div>
          <div class="rb-info">
            <div class="rb-tag">{{ tagLabel }}</div>
            <div class="rb-title">{{ result.label }}</div>
            <div class="rb-input" :title="lastInput">{{ lastInput }}</div>
          </div>
        </div>

        <!-- Score bar -->
        <div class="section-card score-card">
          <div class="score-labels"><span>{{ t('safeZero') }}</span><span>{{ t('highRisk100') }}</span></div>

          <!-- Gogolook 分數條 -->
          <div class="dual-bar-row">
            <span class="dbar-label">Gogolook</span>
            <div class="dbar-track">
              <div class="dbar-fill ggl" :style="{ width: barWidth + '%' }"></div>
            </div>
            <span class="dbar-val ggl-text">{{ gglScoreVal }}</span>
          </div>

          <!-- AI 分數條 -->
          <div class="dual-bar-row" v-if="llmAnalysis?.score !== undefined">
            <span class="dbar-label">AI</span>
            <div class="dbar-track">
              <div class="dbar-fill ai" :style="{ width: llmBarWidth + '%' }"></div>
            </div>
            <span class="dbar-val ai-text">{{ llmAnalysis.score }}</span>
          </div>

          <!-- 加權綜合分數 -->
          <div class="weighted-score" v-if="llmAnalysis?.score !== undefined">
            <span class="ws-label">{{ t('weightedScoreLabel') }}</span>
            <span class="ws-val" :class="mode">{{ weightedScore }} {{ t('aiScoreSuffix') }}</span>
          </div>
          <div class="score-value" :class="mode" v-else>{{ t('riskScore') }}{{ gglScoreVal }} / 100</div>
        </div>

        <!-- AI 分析展開按鈕 — 分數下方 -->
        <button
          v-if="llmAnalysis || isLoadingLLM"
          class="ai-expand-btn"
          :class="{ loading: isLoadingLLM }"
          :disabled="isLoadingLLM"
          @click="openAiPage">
          <span class="aeb-icon">{{ isLoadingLLM ? '⏳' : '🤖' }}</span>
          <span class="aeb-text">
            <span class="aeb-title">{{ isLoadingLLM ? t('aiAnalyzing') : t('aiAnalysis') }}</span>
            <span class="aeb-sub" v-if="!isLoadingLLM && llmAnalysis">
              {{ llmAnalysis.fraud_type || (t('aiRiskScore') + ' ' + llmAnalysis.score) }}
            </span>
          </span>
          <span class="aeb-arrow">›</span>
        </button>

        <!-- Reasons -->
        <div class="section-card reasons-card">
          <div class="sec-title">{{ t('analysisReasons') }}</div>
          <ul class="reasons">
            <li v-for="(r, i) in result.reasons" :key="i">
              <span class="ri">{{ RI(mode) }}</span>
              <span>{{ r }}</span>
            </li>
          </ul>
        </div>

        <!-- 查無資料 — 邀請用戶補充 -->
        <div class="section-card contribute-card" v-if="mode === 'unknown'">
          <button class="contribute-btn" @click="goContribute">
            📤 {{ locale === 'en' ? 'Help Us Improve' : '協助補充資料' }}
          </button>
        </div>

      </div><!-- /col-left -->



      <!-- ── AI 分析 Panel (overlay) ── -->

            <!-- ── RIGHT COLUMN: 行動建議 ── -->
      <div class="col col-right">

        <!-- Visit site (URL only) — top of right col / 手機版固定底部 -->
        <div class="section-card visit-card mobile-action-bar" v-if="lastType === 'url'">
          <div class="visit-warning" v-if="isScamLevel">
            {{ t('visitWarn') }}<strong>{{ t('visitWarnMsg') }}</strong>
          </div>
          <button class="visit-btn" :class="{ 'visit-safe': isSafeLevel, 'visit-promo': mode.startsWith('promo') }" @click="confirmVisit">
            {{ isSafeLevel ? t('visitSite') : t('visitScam') }}
          </button>
        </div>

        <!-- 一鍵撥打（電話偵測時顯示）— 手機版固定底部 -->
        <div class="section-card visit-card mobile-action-bar" v-if="lastType === 'phone'">
          <div class="visit-warning" v-if="isScamLevel">
            {{ t('visitWarn') }}<strong>{{ t('visitWarnMsg') }}</strong>
          </div>
          <a class="visit-btn call-btn" :class="{ 'visit-safe': isSafeLevel }" :href="`tel:${lastInput}`">
            {{ t('callNow') }}
          </a>
        </div>

        <!-- Elder guidance tip -->
        <div class="elder-result-tip" v-if="isElder">
          <span class="ert-icon">{{ isScamLevel ? '🚨' : ['suspect_high','suspect_low','promo_warn','warn'].includes(mode) ? '⚠️' : '💡' }}</span>
          <div class="ert-text">
            <strong>{{ ['scam','promo_scam'].includes(mode) ? t('elderScam') : ['suspect_high','promo_warn'].includes(mode) ? t('elderSuspectHigh') : ['suspect_low'].includes(mode) ? t('elderSuspectLow') : mode === 'unknown' ? t('elderUnknown') : t('elderSafe') }}</strong>
            <span>{{ isScamLevel ? t('elderAdviceScam') : ['suspect_high','suspect_low','promo_warn'].includes(mode) ? t('elderAdviceSuspect') : t('elderAdviceSafe') }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="section-card actions-card">
          <div class="sec-title">{{ t('immediateAction') }}</div>
          <div class="actions-col">
            <button class="act-btn btn-block" @click="doAction('block')">
              <span class="ai">🚫</span>
              <div class="act-text">
                <span class="at">{{ t('blockBtn') }}</span>
                <span class="as">{{ t('blockSub') }}</span>
              </div>
            </button>
            <button class="act-btn btn-report" @click="doAction('report')">
              <span class="ai">📢</span>
              <div class="act-text">
                <span class="at">{{ t('reportBtn') }}</span>
                <span class="as">{{ t('reportSub') }}</span>
              </div>
            </button>
            <button class="act-btn btn-evidence" @click="doAction('evidence')">
              <span class="ai">📁</span>
              <div class="act-text">
                <span class="at">{{ t('evidenceBtn') }}</span>
                <span class="as">{{ t('evidenceSub') }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Next steps -->
        <div class="section-card next-card">
          <div class="sec-title">{{ t('nextStepsTitle') }}</div>
          <div class="next-list">
            <div class="nsi" :class="mode" v-for="(s, i) in nextSteps" :key="i">
              <span class="nsi-icon">{{ s.i }}</span>
              <span class="nsi-text">
                <strong>{{ s.t }}</strong>
                <span>{{ s.s }}</span>
              </span>
            </div>
          </div>
        </div>

</div><!-- /col-right -->

    </main>

    <!-- Confirm overlay -->
    <div class="confirm-overlay" :class="{ show: showConfirm }">
      <div class="confirm-box">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">{{ confirmData.title }}</div>
        <div class="confirm-sub">{{ confirmData.sub }}</div>
        <div class="confirm-btns">
          <button class="confirm-cancel" @click="closeConfirm">{{ t('confirmCancel') }}</button>
          <button class="confirm-ok" @click="confirmData.cb && confirmData.cb()">{{ confirmData.ok }}</button>
        </div>
      </div>
    </div>

    <!-- Scam fullscreen -->
    <div class="scam-fullscreen" :class="{ show: showScamFs }">
      <div class="sf-stripes"></div>
      <div class="sf-inner">
        <span class="sf-siren">🚨</span>
        <div class="sf-badge">{{ t('scamFsBadge') }}</div>
        <div class="sf-title">{{ t('scamFsTitle') }}<span>{{ t('scamFsTitleSpan') }}</span></div>
        <div class="sf-url">{{ lastInput }}</div>
        <div class="sf-risks">
          <div class="sf-risk-item"><span>💳</span>{{ t('scamRisk1') }}</div>
          <div class="sf-risk-item"><span>🪪</span>{{ t('scamRisk2') }}</div>
          <div class="sf-risk-item"><span>📱</span>{{ t('scamRisk3') }}</div>
          <div class="sf-risk-item"><span>💸</span>{{ t('scamRisk4') }}</div>
        </div>
        <div class="sf-btns">
          <button class="sf-cancel" @click="closeScamFs">{{ t('scamLeave') }}</button>
          <div class="sf-slider-wrap" ref="sliderWrap" :class="{ completed: sliderDone }">
            <div class="sf-fill"  ref="sliderFill"></div>
            <div class="sf-label">{{ t('scamSlider') }}</div>
            <div class="sf-thumb" ref="sliderThumb"
                 @mousedown="sMouseDown" @touchstart.passive="sTouchStart">⚠️</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" :class="{ show: toastVisible, ok: toastType==='ok', err: toastType==='err' }">
      {{ toastMsg }}
    </div>

    <!-- 結果頁教學導覽（從教學流程進來才顯示） -->
    <OnboardingTour
      :steps="resultTourSteps"
      storage-key="resultTourDone"
      @open-ai="openAiPage"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { resultState } from '../composables/useResult.js'
import { report, analyzeLLMText, getLLMAdvice } from '../services/api.js'
import { useLocale, t } from '../composables/useLocale.js'
import { isTTSEnabled, toggleTTS } from '../composables/useVoice.js'
import OnboardingTour from '../components/OnboardingTour.vue'

// 結果頁教學步驟（只在從教學流程進來時顯示）
const resultTourSteps = [
  {
    icon: '📊',
    title: '這是分析結果頁',
    desc: '每次檢測完成後都會來到這裡，顯示完整的風險分析報告。',
    target: null,
    openMenu: false,
  },
  {
    icon: '🚨',
    title: '風險等級橫幅',
    desc: '最上方的橫幅顯示風險等級（安全／促銷／警告／詐騙），顏色越紅代表風險越高。',
    target: '.risk-banner',
    openMenu: false,
    cardSide: 'right',
  },
  {
    icon: '📈',
    title: '風險評分',
    desc: '分數條顯示 Gogolook 資料庫與 AI 各自的評分，以及加權後的綜合風險分數（0–100）。',
    target: '.score-card',
    openMenu: false,
    cardSide: 'right',
  },
  {
    icon: '🔎',
    title: '分析原因',
    desc: '列出系統判斷為此風險等級的具體理由，幫助你了解哪些特徵觸發了警示。',
    target: '.reasons-card',
    openMenu: false,
    cardSide: 'right',
  },
  {
    icon: '🌐',
    title: '前往網站',
    desc: '若你仍想前往該網址，可點此按鈕。系統會再次警告並要求滑動確認，避免誤觸。',
    target: '.visit-card',
    openMenu: false,
    cardSide: 'left',
  },
  {
    icon: '🚫',
    title: '立即行動',
    desc: '右欄提供三個快速行動：封鎖號碼／網址、向 165 通報，以及提交證據協助調查。',
    target: '.actions-card',
    openMenu: false,
    cardSide: 'left',
  },
  {
    icon: '📋',
    title: '下一步建議',
    desc: '根據風險等級，系統會給出具體的後續行動建議，幫助你保護自己和身邊的人。',
    target: '.next-card',
    openMenu: false,
    cardSide: 'left',
  },
  {
    icon: '🤖',
    title: 'AI 深度分析',
    desc: '點擊此按鈕可進入 AI 深度分析頁面，查看詐騙手法分類、詳細對策與建議。按「前往 AI 頁 →」繼續。',
    target: '.ai-expand-btn',
    openMenu: false,
    cardSide: 'right',
    openAiTour: true,
  },
]

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElderFn } = useElder()
const { locale } = useLocale()

// 若從教學流程進來，在 setup 階段同步清除，確保 OnboardingTour 掛載時能偵測到
if (localStorage.getItem('resultTourPending')) {
  localStorage.removeItem('resultTourPending')
  localStorage.removeItem('resultTourDone')
}

const result    = computed(() => resultState.data)
const lastInput = computed(() => resultState.lastInput)
const lastType  = computed(() => resultState.lastType)
const mode = computed(() => {
  const lv = result.value?.level || ''
  // Map new levels to CSS class
  if (['safe_high','safe_low','safe'].includes(lv)) return 'safe'
  if (['suspect_low','warn'].includes(lv)) return 'warn'
  if (['suspect_high'].includes(lv)) return 'warn'
  if (['promo_safe','promo'].includes(lv)) return 'promo'
  if (['promo_warn','promo_scam'].includes(lv)) return 'warn'
  if (lv === 'scam') return 'scam'
  if (lv === 'unknown') return 'unknown'
  return lv
})

// 判斷是否為安全等級（用於前往網站按鈕）
const isSafeLevel = computed(() => {
  const lv = result.value?.level || ''
  return ['safe', 'safe_high', 'safe_low', 'promo_safe'].includes(lv)
})

// 判斷是否為詐騙等級（用於全版警告）
const isScamLevel = computed(() => {
  const lv = result.value?.level || ''
  return ['scam', 'promo_scam'].includes(lv)
})

// LLM 分析相關
const llmAnalysis = ref(null)
const llmAdvice = ref(null)
const isLoadingLLM = ref(false)

const ICONS = {
  safe_high: '✅', safe_low: '🟢',
  suspect_low: '🟡', suspect_high: '🟠',
  scam: '🚨',
  promo_safe: '📣', promo_warn: '📣⚠️', promo_scam: '📣🚨',
  unknown: '❓',
  // 舊等級 fallback
  safe: '✅', promo: '📣', warn: '⚠️',
}
const TAGS = computed(() => ({
  safe_high: t('tagSafeHigh'), safe_low: t('tagSafeLow'),
  suspect_low: t('tagSuspectLow'), suspect_high: t('tagSuspectHigh'),
  scam: t('tagScam'),
  promo_safe: t('tagPromoSafe'), promo_warn: t('tagPromoWarn'), promo_scam: t('tagPromoScam'),
  unknown: t('tagUnknown'),
  safe: t('tagSafe'), promo: t('tagPromo'), warn: t('tagWarn'),
}))
// Template helper — Vue auto-unwraps computed at top level but not via bracket access
const tagLabel = computed(() => TAGS.value[mode.value] ?? mode.value)
const RI = lv => {
  if (['scam','promo_scam'].includes(lv)) return '🔴'
  if (['suspect_high','promo_warn'].includes(lv)) return '🟠'
  if (['suspect_low'].includes(lv)) return '🟡'
  if (lv === 'unknown') return '⚪'
  return '🟢'
}
const NEXT = computed(() => ({
  safe_high: [{ i:'✅', t: locale.value==='en'?'Fully safe to use':'完全安全可放心使用', s: locale.value==='en'?'Confirmed safe by Gogolook & AI.':'Gogolook 與 AI 雙重確認安全。' }],
  safe_low:  [{ i:'🟢', t: locale.value==='en'?'Safe, stay alert':'安全但保持警覺', s: locale.value==='en'?'Very low risk, proceed normally.':'風險極低，正常使用即可。' }],
  suspect_low:  [
    { i:'🟡', t: locale.value==='en'?'Slightly suspicious, be cautious':'輕度可疑，謹慎使用', s: locale.value==='en'?'Do not share personal data easily.':'不要輕易提供個人資料。' },
    { i:'👨‍👩‍👧', t: locale.value==='en'?'Ask a trusted person to verify':'詢問家人或朋友確認', s: locale.value==='en'?'Let someone you trust help confirm.':'讓信任的人幫你確認。' }],
  suspect_high: [
    { i:'🟠', t: locale.value==='en'?'Highly suspicious, block it':'高度可疑，建議封鎖', s: locale.value==='en'?'Do not click or share any data.':'請勿點擊或提供任何資料。' },
    { i:'📢', t: locale.value==='en'?'Report it':'建議通報', s: locale.value==='en'?'Help protect other potential victims.':'協助保護其他可能受害者。' }],
  scam: [
    { i:'🚫', t: locale.value==='en'?'Stop all activity immediately':'立即停止任何操作', s: locale.value==='en'?'Do not click or enter any data.':'不要點擊、不要輸入資料。' },
    { i:'💳', t: locale.value==='en'?'Contact your bank now':'立刻聯絡銀行', s: locale.value==='en'?'Call card back number to freeze account.':'撥卡片背面號碼申請凍結。' },
    { i:'📞', t: locale.value==='en'?'Call 165 anti-scam hotline':'撥打 165 反詐騙', s: locale.value==='en'?'24-hour hotline, staff will assist.':'24 小時，由專人協助。' },
    { i:'👮', t: locale.value==='en'?'File a police report':'向警察局報案', s: locale.value==='en'?'Bring screenshots to the police station.':'保留截圖向派出所報案。' }],
  promo_safe: [{ i:'📣', t: locale.value==='en'?'Confirm if you subscribed':'確認是否為主動訂閱', s: locale.value==='en'?'If not subscribed, you may block it.':'若非本人訂閱，可封鎖。' }],
  promo_warn: [
    { i:'📣', t: locale.value==='en'?'Marketing with suspicious signs':'行銷但有可疑跡象', s: locale.value==='en'?'Verify if the source is trustworthy.':'請確認來源是否可信。' },
    { i:'🔕', t: locale.value==='en'?'Block if unwanted':'不需要可直接封鎖', s: locale.value==='en'?'Tap block to add to blacklist.':'點選一鍵封鎖加入黑名單。' }],
  promo_scam: [
    { i:'🚫', t: locale.value==='en'?'Suspected scam disguised as promo':'疑似詐騙偽裝推銷', s: locale.value==='en'?'Do not click or share data.':'不要點擊或提供資料。' },
    { i:'📢', t: locale.value==='en'?'Report it':'建議通報', s: locale.value==='en'?'Help protect other users.':'協助保護其他用戶。' }],
  unknown: [
    { i:'❓', t: locale.value==='en'?'Number has no record':'號碼查無資料', s: locale.value==='en'?'No information in the database.':'資料庫中無此號碼資訊。' },
    { i:'🤔', t: locale.value==='en'?'Be cautious about answering':'謹慎判斷是否接聽', s: locale.value==='en'?'Stay alert for unknown callers.':'陌生來電請提高警覺。' },
    { i:'📞', t: locale.value==='en'?'Call 165 if in doubt':'如有疑慮撥打 165', s: locale.value==='en'?'24-hour anti-scam hotline.':'24 小時反詐騙專線諮詢。' }],
  safe:  [{ i:'✅', t: locale.value==='en'?'Safe to browse':'可以安全瀏覽', s: locale.value==='en'?'No scam record for this source.':'此來源無詐騙紀錄。' }],
  warn:  [{ i:'⚠️', t: locale.value==='en'?'Proceed with caution':'請謹慎使用', s: locale.value==='en'?'Do not provide personal data.':'建議不要提供個人資料。' }],
  promo: [{ i:'📋', t: locale.value==='en'?'Confirm if you subscribed':'確認是否為主動訂閱', s: locale.value==='en'?'If not subscribed, you may block it.':'若非本人訂閱，可封鎖。' }],
}))
const nextSteps = computed(() => NEXT.value[mode.value] || [])

const barWidth    = ref(0)
const llmBarWidth = ref(0)

// 新格式：Lambda 已計算好加權分數
const weightedScore = computed(() => result.value?.score ?? 0)
// Gogolook 原始分數
const gglScoreVal = computed(() => result.value?.ggl?.score ?? 0)  // 只取 Gogolook 原始分數

onMounted(async () => {
  setTimeout(() => {
    barWidth.value = gglScoreVal.value
  }, 120)

  if (lastInput.value) {
    performLLMAnalysis()
  }

  document.addEventListener('click', onClickOutside)
})

// 解析新格式 AI 資料（result 已包含 ggl + ai + advice）
function performLLMAnalysis() {
  const data = result.value
  if (!data) return

  if (data.ai) {
    // 新格式：ai 欄位已內嵌
    llmAnalysis.value = {
      score:      data.ai.score,
      fraud_type: data.ai.fraud_type,
      suggestion: data.ai.suggestion,
      reasoning:  data.ai.reasoning,
      level:      data.level,
    }
    setTimeout(() => { llmBarWidth.value = data.ai.score ?? 0 }, 120)
    if (data.advice) llmAdvice.value = data.advice
  } else if (lastType.value !== 'image' && lastType.value !== 'screenshot') {
    // 舊格式（截圖或未走 LLM）：不額外呼叫，避免重複消耗 token
    console.log('[ResultView] 非 LLM 格式，跳過 AI 分析')
  }
}

function goBack() { router.back() }
function goContribute() {
  router.push({ path: '/contribute', query: { input: lastInput.value, type: lastType.value } })
}
function toggleElder() {
  toggleElderFn()
  showToast(isElder.value ? '👴 ' + t('elderMode') : t('elderMode'), 'ok')
}

// ── 設定選單 ──
const menuOpen     = ref(false)
const settingsWrap = ref(null)

function onClickOutside(e) {
  if (e.target.closest('.tour-overlay')) return
  if (settingsWrap.value && !settingsWrap.value.contains(e.target)) {
    menuOpen.value = false
  }
}

function confirmVisit() {
  const url = lastInput.value.startsWith('http') ? lastInput.value : `https://${lastInput.value}`
  if (isSafeLevel.value) { window.open(url, '_blank', 'noopener'); return }
  if (isScamLevel.value) { openScamFs(); return }
  const title = locale.value === 'en' ? '⚠️ Visit this site?' : '⚠️ 確定前往此網站？'
  const sub   = locale.value === 'en' ? 'This site is flagged as suspicious. Proceed carefully.' : '此網站被標記為可疑，前往請謹慎。'
  const ok    = locale.value === 'en' ? 'Proceed Anyway' : '仍要前往'
  openConfirm(title, sub, ok, () => {
    window.open(url, '_blank', 'noopener'); closeConfirm()
  })
}

const ACT = computed(() => ({
  block:    { title: t('confirmBlock'),    sub: t('confirmBlockSub'),    ok: t('confirmBlockOk')    },
  report:   { title: t('confirmReport'),   sub: t('confirmReportSub'),   ok: t('confirmReportOk')   },
  evidence: { title: t('confirmEvidence'), sub: t('confirmEvidenceSub'), ok: t('confirmEvidenceOk') },
}))
async function doAction(type) {
  const c = ACT.value[type]
  openConfirm(c.title, c.sub, c.ok, async () => {
    closeConfirm()
    // 一鍵通報：導向政府通報平台
    if (type === 'report') {
      window.open('https://fraudbuster.digiat.org.tw/accessibility/circular', '_blank', 'noopener')
      return
    }
    // 回報證據：導向 165 反詐騙通報平台
    if (type === 'evidence') {
      window.open('https://165.npa.gov.tw/#/report/call/02', '_blank', 'noopener')
      return
    }
    try {
      const d = await report(lastInput.value, lastType.value)
      const msgs = {
        block:    '🚫 ' + (locale.value === 'en' ? 'Blocked — ' : '已封鎖 — ') + d.caseNo,
        evidence: '📁 ' + (locale.value === 'en' ? 'Evidence uploaded, case ' : '證據已上傳，案號 ') + d.caseNo,
      }
      showToast(msgs[type], 'ok')
    } catch { showToast(locale.value === 'en' ? '❌ Action failed' : '❌ 操作失敗', 'err') }
  })
}

const showAiPanel = ref(false)
const showConfirm = ref(false)

function openAiPage() {
  // 同分頁導航，用 localStorage 傳遞資料
  localStorage.setItem('aiAnalysisData', JSON.stringify({
    llmAnalysis: llmAnalysis.value,
    llmAdvice:   llmAdvice.value,
  }))
  router.push('/ai')
}
const confirmData = ref({ title:'', sub:'', ok:'', cb:null })
function openConfirm(title, sub, ok, cb) { confirmData.value={title,sub,ok,cb}; showConfirm.value=true }
function closeConfirm() { showConfirm.value=false }

const showScamFs  = ref(false)
const sliderDone  = ref(false)
const sliderWrap  = ref(null)
const sliderFill  = ref(null)
const sliderThumb = ref(null)
let _sliderDone = false

function openScamFs()  { showScamFs.value=true;  document.body.style.overflow='hidden'; initSlider() }
function closeScamFs() { showScamFs.value=false; document.body.style.overflow=''; resetSlider() }
function proceedToScam() { closeScamFs(); router.push({ path:'/visited', query:{ url:lastInput.value } }) }

function initSlider() {
  _sliderDone=false; sliderDone.value=false
  if(sliderThumb.value) sliderThumb.value.style.left='4px'
  if(sliderFill.value)  sliderFill.value.style.width='0%'
}
function resetSlider() {
  if(!sliderThumb.value) return
  sliderThumb.value.style.transition='left 0.3s ease'
  sliderFill.value.style.transition='width 0.3s ease'
  sliderThumb.value.style.left='4px'; sliderFill.value.style.width='0%'
  sliderDone.value=false
  setTimeout(()=>{ if(sliderThumb.value){sliderThumb.value.style.transition=''; sliderFill.value.style.transition=''} },300)
}
function sliderMove(clientX) {
  if(_sliderDone||!sliderWrap.value) return
  const tw=sliderThumb.value.offsetWidth, max=sliderWrap.value.offsetWidth-tw-8
  const rect=sliderWrap.value.getBoundingClientRect()
  let x=Math.max(4,Math.min(clientX-rect.left-tw/2, max+4))
  sliderThumb.value.style.left=x+'px'
  const pct=((x-4)/max)*100
  sliderFill.value.style.width=pct+'%'
  if(pct>=98){_sliderDone=true; sliderDone.value=true; setTimeout(proceedToScam,400)}
}
function sMouseDown(e) {
  e.preventDefault()
  const mm=e2=>sliderMove(e2.clientX)
  const mu=()=>{ document.removeEventListener('mousemove',mm); document.removeEventListener('mouseup',mu); if(!_sliderDone)resetSlider() }
  document.addEventListener('mousemove',mm); document.addEventListener('mouseup',mu)
}
function sTouchStart() {
  const tm=e2=>sliderMove(e2.touches[0].clientX)
  const te=()=>{ document.removeEventListener('touchmove',tm); document.removeEventListener('touchend',te); if(!_sliderDone)resetSlider() }
  document.addEventListener('touchmove',tm,{passive:true}); document.addEventListener('touchend',te)
}

const toastVisible=ref(false), toastMsg=ref(''), toastType=ref('')
let toastTimer=null
function showToast(msg,type=''){toastMsg.value=msg;toastType.value=type;toastVisible.value=true;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastVisible.value=false},3200)}
onUnmounted(()=>{clearTimeout(toastTimer);document.body.style.overflow='';document.removeEventListener('click', onClickOutside)})
</script>

<style scoped>
.page-wrap { min-height:100vh; background:var(--bg); color:var(--text); display:flex; flex-direction:column; transition:background 0.25s,color 0.25s; }

/* ── Navbar ── */
.navbar { background:var(--navbar-bg); padding:10px 16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:200; transition:background 0.25s; height:56px; }
.back-btn { background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:7px 16px; color:#fff; font-size:13px; font-weight:700; white-space:nowrap; transition:background 0.2s; flex-shrink:0; }
.back-btn:hover { background:rgba(255,255,255,0.28); }
.nav-title { position:absolute; left:50%; transform:translateX(-50%); color:#fff; font-size:15px; font-weight:700; pointer-events:none; }
.nav-actions { display:flex; gap:8px; align-items:center; margin-left:auto; }
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

/* ── No result ── */
.no-result { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:40px; }
.no-result-icon { font-size:64px; }
.no-result p { font-size:18px; color:var(--text-sub); }
.go-home-btn { background:var(--primary); color:#fff; border:none; border-radius:12px; padding:12px 28px; font-size:15px; font-weight:900; }

/* ── BOOK-STYLE TWO-COLUMN MAIN ── */
.result-main {
  flex: 1;
  display: flex;
  flex-direction: row;
  max-width: 1100px;
  width: 100%;
  margin: 20px auto;
  padding: 0 24px 48px;
  align-items: stretch;
}

/* Left page */
.col-left {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 14px;
  align-content: flex-start;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-right: none;
  border-radius: 18px 0 0 18px;
  padding: 24px;
  box-shadow: -6px 0 32px rgba(0,0,0,0.10), inset -4px 0 12px rgba(0,0,0,0.04);
  transition: background 0.25s, border-color 0.25s;
}

/* AI 展開按鈕欄（左欄和右欄之間不再有第三欄） */
.col-ai-btn { display: none; } /* 桌面版不顯示為獨立欄，按鈕放在左欄底部 */

/* Right page */
.col-right {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 14px;
  align-content: flex-start;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 0 18px 18px 0;
  overflow: hidden;
  padding: 24px;
  box-shadow: inset 4px 0 12px rgba(0,0,0,0.04);
  transition: background 0.25s, border-color 0.25s;
}

/* Spine divider */
.col-left  { border-right: 3px solid var(--border); }
.col-right { border-left: none; }

/* ── Risk banner ── */
.risk-banner { border-radius:18px; padding:20px; display:flex; gap:16px; align-items:center; border:2px solid transparent; overflow:hidden; }
.risk-banner.safe  { background:var(--safe-bg);  border-color:var(--safe); }
.risk-banner.promo { background:var(--promo-bg); border-color:var(--promo); }
.risk-banner.warn  { background:var(--warn-bg);  border-color:var(--warn); }
.risk-banner.unknown {
  background: rgba(168,196,78,0.10);
  border-color: rgba(168,196,78,0.35);
}
.risk-banner.scam  { background:var(--scam-bg);  border-color:var(--scam); }

.rb-badge { width:72px; height:72px; border-radius:18px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; gap:2px; }
.rb-badge-score { font-size:28px; font-weight:900; color:#fff; line-height:1; }
.safe  .rb-badge { background:var(--safe); }
.promo .rb-badge { background:var(--promo); }
.warn  .rb-badge { background:var(--warn); }
.scam  .rb-badge { background:var(--scam); }
.unknown .rb-badge { background: rgba(100,120,60,0.5); }
.rb-badge-score { font-size:28px; font-weight:900; color:#fff; line-height:1; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }.rb-icon  { font-size:36px; line-height:1; }


.rb-info { flex:1; min-width:0; overflow:hidden; }
.rb-tag { display:inline-block; border-radius:100px; padding:4px 14px; font-size:13px; font-weight:900; letter-spacing:1px; text-transform:uppercase; margin-bottom:5px; }
.safe  .rb-tag { background:rgba(0,196,122,0.2);  color:var(--safe-text); }
.promo .rb-tag { background:rgba(45,135,232,0.2); color:var(--promo-text); }
.warn  .rb-tag { background:rgba(255,140,0,0.2);  color:var(--warn-text); }
.scam  .rb-tag { background:rgba(255,45,45,0.2);  color:var(--scam-text); }
.rb-title { font-size:28px; font-weight:900; line-height:1.3; word-break:break-all; }
.rb-input { font-size:13px; color:var(--text-muted); font-family:'DM Mono',monospace; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; display:block; }

/* ── Score card ── */
.score-card { padding:16px 18px; }
.score-labels { display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted); margin-bottom:8px; }
.score-track  { height:10px; background:var(--surface3); border-radius:100px; overflow:hidden; margin-bottom:8px; }
.score-fill   { height:100%; border-radius:100px; width:0%; transition:width 1s 0.2s cubic-bezier(0.25,1,0.5,1); }
.safe  .score-fill, .score-fill.safe  { background:var(--safe); }
.promo .score-fill, .score-fill.promo { background:var(--promo); }
.warn  .score-fill, .score-fill.warn  { background:linear-gradient(90deg,#ffb300,var(--warn)); }
.scam  .score-fill, .score-fill.scam    { background:linear-gradient(90deg,var(--warn),var(--scam)); }
.score-fill.unknown { background:linear-gradient(90deg,#8faa2e,#a8c44e); }
.score-value { font-size:16px; font-weight:700; text-align:right; }
.score-value.safe  { color:var(--safe-text); }
.score-value.promo { color:var(--promo-text); }
.score-value.warn  { color:var(--warn-text); }
.score-value.scam  { color:var(--scam-text); }

/* ── Section cards — no extra bg inside the book pages ── */
.section-card { background: transparent; border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; transition: border-color 0.25s; box-shadow: none; }
.col-right .section-card { background: transparent; }
.sec-title { font-size:13px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-muted); margin-bottom:14px; }

/* ── Reasons ── */
.reasons { list-style:none; }
.reasons li { display:flex; align-items:flex-start; gap:9px; padding:10px 0; font-size:17px; line-height:1.6; border-bottom:1px solid var(--border); }
.reasons li:last-child { border-bottom:none; }
.ri { font-size:17px; flex-shrink:0; margin-top:2px; }

/* ── Visit button ── */
.visit-warning { background:var(--scam-bg); border:1.5px solid rgba(255,45,45,0.3); border-radius:10px; padding:14px 18px; font-size:16px; color:var(--scam-text); margin-bottom:10px; line-height:1.5; }
.visit-btn { width:100%; border:2px solid var(--border); border-radius:12px; padding:15px 18px; background:var(--surface2); font-size:18px; font-weight:700; color:var(--text-sub); display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.18s; }
.visit-btn:hover { border-color:var(--scam); color:var(--scam); background:var(--scam-bg); }
.visit-btn.visit-safe { border-color:var(--safe); color:var(--safe-text); background:var(--safe-bg); }
.visit-btn.visit-safe:hover { background:var(--safe); color:#fff; }
/* call-btn：電話撥打，預設綠色，詐騙時警示色 */
.call-btn { text-decoration:none; cursor:pointer; }
.call-btn:not(.visit-safe) { border-color:var(--scam); color:var(--scam); background:var(--scam-bg); }
.call-btn:not(.visit-safe):hover { background:var(--scam); color:#fff; }
/* promo: neutral default, yellow on hover only */
.visit-btn.visit-promo { border-color:var(--border); color:var(--text-sub); background:var(--surface2); }
.visit-btn.visit-promo:hover { border-color:var(--warn); color:var(--warn); background:var(--warn-bg); }
[data-theme="dark"] .visit-btn.visit-promo:hover { color:var(--warn-text); }

/* ── Action buttons — vertical stack ── */
.actions-col { display:flex; flex-direction:column; gap:10px; }
.act-btn { display:flex; align-items:center; gap:14px; border:none; border-radius:14px; padding:14px 16px; transition:all 0.18s; text-align:left; width:100%; }
.act-btn .ai { font-size:28px; flex-shrink:0; }
.act-text { display:flex; flex-direction:column; gap:2px; }
.act-btn .at { font-size:19px; font-weight:900; line-height:1.2; }
.act-btn .as { font-size:14px; opacity:0.72; line-height:1.3; }
.act-btn:active { transform:scale(0.98); }

.btn-block    { background:var(--scam-bg);       color:var(--scam); }
.btn-block:hover    { background:var(--scam); color:#fff; }
.btn-report   { background:var(--warn-bg);        color:var(--warn); }
.btn-report:hover   { background:var(--warn); color:#fff; }
.btn-evidence { background:var(--primary-light);  color:var(--primary); }
.btn-evidence:hover { background:var(--primary); color:#fff; }

/* ── Next steps — vertical list ── */
.next-list { display:flex; flex-direction:column; gap:10px; }
.nsi { display:flex; align-items:flex-start; gap:12px; background:var(--surface2); border-radius:12px; padding:13px 15px; border:1.5px solid var(--border); border-left:3px solid transparent; transition:background 0.25s, border-color 0.25s; }
.nsi.safe  { border-left-color:var(--safe); }
.nsi.promo { border-left-color:var(--promo); }
.nsi.warn  { border-left-color:var(--warn); }
.nsi.scam    { border-left-color:var(--scam); }
.nsi.unknown { border-left-color:#a8c44e; }
.nsi-icon { font-size:22px; flex-shrink:0; margin-top:1px; }
.nsi-text strong { display:block; font-size:18px; color:var(--text); line-height:1.3; }
.nsi-text span   { display:block; font-size:14px; color:var(--text-sub); margin-top:2px; line-height:1.4; }

/* ── Confirm overlay ── */
.confirm-overlay { display:none; position:fixed; inset:0; z-index:800; background:rgba(0,0,0,0.5); align-items:center; justify-content:center; padding:24px; }
.confirm-overlay.show { display:flex; animation:fadeIn 0.18s ease; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.confirm-box { background:var(--surface); border-radius:20px; padding:28px 24px; text-align:center; max-width:380px; width:100%; box-shadow:var(--shadow-lg); transition:background 0.25s; }
.confirm-icon  { font-size:44px; margin-bottom:10px; }
.confirm-title { font-size:18px; font-weight:900; margin-bottom:6px; }
.confirm-sub   { font-size:13px; color:var(--text-sub); line-height:1.55; margin-bottom:20px; }
.confirm-btns  { display:flex; gap:10px; }
.confirm-cancel { flex:1; background:var(--surface2); color:var(--text-sub); border:1.5px solid var(--border); border-radius:12px; padding:13px; font-size:14px; font-weight:700; transition:background 0.2s; }
.confirm-cancel:hover { background:var(--surface3); }
.confirm-ok     { flex:1; background:var(--primary); color:#fff; border:none; border-radius:12px; padding:13px; font-size:14px; font-weight:900; transition:background 0.2s; }
.confirm-ok:hover { background:var(--primary-dark); }

/* ── Scam fullscreen ── */
.scam-fullscreen { display:none; position:fixed; inset:0; z-index:9000; background:#0a0a0a; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 24px; }
.scam-fullscreen.show { display:flex; animation:scamIn 0.35s ease; }
@keyframes scamIn { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
.sf-stripes { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(-45deg,rgba(255,45,45,0.07) 0,rgba(255,45,45,0.07) 24px,transparent 24px,transparent 48px); }
.sf-inner { position:relative; z-index:1; max-width:520px; width:100%; }
.sf-siren { font-size:80px; animation:sway 0.6s ease-in-out infinite alternate; display:block; margin-bottom:16px; }
@keyframes sway { from{transform:rotate(-8deg) scale(1)} to{transform:rotate(8deg) scale(1.08)} }
.sf-badge { display:inline-flex; gap:8px; background:var(--scam); color:#fff; border-radius:100px; padding:6px 18px; font-size:13px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px; }
.sf-title { font-size:34px; font-weight:900; color:#fff; line-height:1.2; margin-bottom:12px; letter-spacing:-1px; }
.sf-title span { color:var(--scam); }
.sf-url { font-family:'DM Mono',monospace; font-size:12px; color:rgba(255,255,255,0.3); margin-bottom:24px; word-break:break-all; }
.sf-risks { background:rgba(255,45,45,0.10); border:1.5px solid rgba(255,45,45,0.25); border-radius:16px; padding:16px 20px; margin-bottom:28px; text-align:left; display:flex; flex-direction:column; gap:10px; }
.sf-risk-item { display:flex; align-items:center; gap:10px; color:rgba(255,255,255,0.8); font-size:14px; }
.sf-btns   { display:flex; flex-direction:column; gap:12px; width:100%; }
.sf-cancel { background:var(--safe); color:#fff; border:none; border-radius:14px; padding:14px 20px; font-size:15px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:8px; transition:background 0.18s; }
.sf-cancel:hover { background:#00a868; }
.sf-slider-wrap { position:relative; height:56px; border-radius:100px; background:rgba(255,45,45,0.18); border:1.5px solid rgba(255,45,45,0.35); overflow:hidden; user-select:none; touch-action:none; }
.sf-fill  { position:absolute; top:0; left:0; height:100%; background:linear-gradient(90deg,rgba(255,45,45,0.5),rgba(255,45,45,0.2)); pointer-events:none; }
.sf-label { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:rgba(255,255,255,0.4); pointer-events:none; }
.sf-thumb { position:absolute; top:4px; left:4px; width:48px; height:48px; border-radius:50%; background:var(--scam); display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 2px 14px rgba(255,45,45,0.6); cursor:grab; }
.sf-thumb:active { cursor:grabbing; }
.sf-slider-wrap.completed .sf-thumb { background:#c00; }
.sf-slider-wrap.completed .sf-label { opacity:0; }

/* ── Toast ── */
.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:#111; color:#fff; border-radius:100px; padding:10px 22px; font-size:14px; font-weight:700; box-shadow:0 6px 28px rgba(0,0,0,0.22); transition:transform 0.3s cubic-bezier(0.34,1.4,0.64,1); z-index:9999; white-space:nowrap; pointer-events:none; }
.toast.show { transform:translateX(-50%) translateY(0); }
.toast.ok  { background:#00C47A; }
.toast.err { background:var(--scam); }

/* ── Elder mode highlights ── */
.page-wrap.elder .risk-banner { padding:22px; }
.page-wrap.elder .rb-title    { font-size:26px; }
.page-wrap.elder .rb-icon     { font-size:38px; }
.page-wrap.elder .rb-badge    { width:72px; height:72px; border-radius:18px; }
.page-wrap.elder .reasons li  { font-size:16px; padding:8px 0; }
.page-wrap.elder .ri          { font-size:16px; }
.page-wrap.elder .at          { font-size:16px; }
.page-wrap.elder .act-btn .as { font-size:13px; }
.page-wrap.elder .nsi-text strong { font-size:16px; }
.page-wrap.elder .nsi-text span   { font-size:13px; }
.page-wrap.elder .score-fill  { height:12px; border-radius:100px; }
.page-wrap.elder .score-track { height:12px; }
.page-wrap.elder .score-value { font-size:16px; }
.page-wrap.elder .score-labels { font-size:13px; }
.page-wrap.elder .act-btn     { padding:16px 16px; }
.page-wrap.elder .visit-btn   { font-size:18px; padding:14px; }
.page-wrap.elder .risk-banner.scam { box-shadow:0 0 0 4px rgba(255,45,45,0.25),0 0 24px rgba(255,45,45,0.12); }
.page-wrap.elder .risk-banner.warn { box-shadow:0 0 0 4px rgba(255,140,0,0.22); }

/* ── Elder guidance on result page ── */
.elder-result-tip {
  background:linear-gradient(135deg,rgba(45,71,232,0.10),rgba(45,71,232,0.04));
  border:1.5px solid var(--primary);
  border-radius:14px; padding:14px 18px;
  display:flex; align-items:flex-start; gap:12px;
}
.ert-icon { font-size:26px; flex-shrink:0; }
.ert-text strong { display:block; font-size:18px; font-weight:900; color:var(--text); line-height:1.3; margin-bottom:4px; }
.ert-text span   { font-size:12px; color:var(--text-sub); line-height:1.55; }

/* ── Mobile: stack to single column ── */
@media (max-width:900px) {
  .page-wrap { overflow-x: hidden; }
  .result-main {
    flex-direction: column;  /* 單欄垂直排列 */
    padding: 12px 12px 48px;
    gap: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    min-height: 100vh;
  }
  .col-left {
    border-right: 1.5px solid var(--border);
    border-bottom: none;
    border-radius: 18px 18px 0 0;
    box-shadow: none;
    padding: 16px;
    min-width: 0;
    word-break: break-word;
  }
  .col-right {
    border-left: 1.5px solid var(--border);
    border-top: none;
    border-radius: 0 0 18px 18px;
    box-shadow: none;
    padding: 16px;
    min-width: 0;
  }
  .col-ai-btn { display: none; }

  .col-left .section-card:last-child { flex: 1; }
  .col-right .section-card:last-child { flex: 1; }
  /* Prevent banner text overflow */
  .rb-title  { font-size: 18px; }
  .rb-score  { font-size: 18px; }
  .rb-input  { max-width: calc(100vw - 140px); }
  .rb-info   { min-width: 0; overflow: hidden; }
  /* Actions stacked nicely on mobile */
  .act-btn   { padding: 12px 14px; }
  .act-btn .as { display: none; }
  /* Score value wrap */
  .score-value { font-size: 11px; }
  /* 小螢幕隱藏設定文字標籤 */
  .settings-label { display: none; }
  .settings-btn   { padding: 6px 10px; }

  .col-left, .col-right { background: var(--surface); }
  .mobile-action-bar {
    order: 999;  /* flex order で最後尾に */
    border-radius: 0 0 18px 18px;
    border-top: 1.5px solid var(--border);
    margin-top: auto;
  }
  .result-main { padding-bottom: 24px; }
}

/* ══════════════════════════════════════════
   AI 展開按鈕 & Panel
══════════════════════════════════════════ */
.ai-expand-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; border: 1.5px solid rgba(100,120,255,0.3);
  border-radius: 14px; padding: 14px 16px;
  background: linear-gradient(135deg, rgba(100,120,255,0.08), rgba(100,120,255,0.03));
  cursor: pointer; text-align: left; transition: all 0.18s;
}
.ai-expand-btn:hover { border-color: rgba(100,120,255,0.6); background: rgba(100,120,255,0.12); }
.ai-expand-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.aeb-icon { font-size: 28px; flex-shrink: 0; }
.aeb-text { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.aeb-title { font-size: 16px; font-weight: 700; color: var(--text); }
.aeb-sub { font-size: 14px; color: var(--text-muted); }
.aeb-arrow { font-size: 22px; color: rgba(100,120,255,0.6); font-weight: 700; flex-shrink: 0; }

/* Panel overlay — 已移至 AiView 獨立頁面 */

/* ══════════════════════════════════════════
   LLM 分析樣式
══════════════════════════════════════════ */
.llm-card {
  background: linear-gradient(135deg, rgba(100,120,255,0.08), rgba(100,120,255,0.03));
  border-color: rgba(100,120,255,0.25);
}

.llm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: var(--text-sub);
}

.spinner {
  font-size: 24px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.llm-fraud-type {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface2);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.lft-icon { font-size: 24px; flex-shrink: 0; }
.lft-text strong {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 3px;
}
.lft-text span {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.llm-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(100,120,255,0.10);
  border-radius: 10px;
  padding: 12px 14px;
  line-height: 1.6;
}

.ls-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }

/* 對策建議卡片 */
.advice-card {
  background: linear-gradient(135deg, rgba(255,140,0,0.08), rgba(255,140,0,0.03));
  border-color: rgba(255,140,0,0.25);
}

.advice-section { margin-bottom: 16px; }
.advice-section:last-child { margin-bottom: 0; }

.advice-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.advice-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.advice-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 10px;
  background: var(--surface2);
  border-radius: 8px;
}

.al-icon {
  flex-shrink: 0;
  font-weight: 900;
  color: var(--safe);
}

.advice-list.avoid .al-icon {
  color: var(--scam);
}

.advice-steps {
  list-style: none;
  counter-reset: step;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.advice-steps li {
  counter-increment: step;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 10px;
  background: var(--surface2);
  border-radius: 8px;
}

.advice-steps li::before {
  content: counter(step);
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.advice-recovery {
  background: rgba(255,140,0,0.10);
  border: 1.5px solid rgba(255,140,0,0.25);
  border-radius: 10px;
  padding: 12px 14px;
}

.advice-recovery p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  margin-top: 6px;
}


.llm-score-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding:8px 12px; background:var(--surface2); border-radius:10px; }
.lsr-label { font-size:12px; color:var(--text-sub); font-weight:600; }
.lsr-val { font-size:18px; font-weight:900; }
.lsr-val.safe    { color:var(--safe); }
.lsr-val.warn    { color:var(--warn); }
.lsr-val.scam    { color:var(--scam); }


/* ── 雙色分數條 ── */
.dual-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.dbar-label { font-size:10px; font-weight:700; color:rgba(128,128,128,0.8); width:52px; flex-shrink:0; letter-spacing:0.3px; }
.dbar-track { flex:1; height:8px; background:rgba(128,128,128,0.15); border-radius:100px; overflow:hidden; }
.dbar-fill  { height:100%; border-radius:100px; width:0%; transition:width 1.2s cubic-bezier(0.22,1,0.36,1) 0.2s; }

/* Gogolook：固定橘紅漸層（深淺色皆清晰） */
.dbar-fill.ggl { background: linear-gradient(90deg, #f97316, #ef4444); }
.dbar-val.ggl-text { font-size:12px; font-weight:800; color:#ef4444; width:24px; text-align:right; flex-shrink:0; }

/* AI：固定藍紫漸層（深淺色皆清晰） */
.dbar-fill.ai  { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
.dbar-val.ai-text { font-size:12px; font-weight:800; color:#6366f1; width:24px; text-align:right; flex-shrink:0; }

/* 加權綜合分數 */
.weighted-score { display:flex; align-items:center; gap:8px; margin-top:6px; padding-top:8px; border-top:1px solid var(--border); }
.ws-label { font-size:11px; color:var(--text-sub); font-weight:600; }
.ws-val   { font-size:18px; font-weight:900; line-height:1; }
.ws-formula { font-size:9px; color:var(--text-muted); margin-left:auto; }

/* AI 評分列 */
.llm-score-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding:8px 12px; background:var(--surface2); border-radius:10px; }
.lsr-label { font-size:12px; color:var(--text-sub); font-weight:600; }
.lsr-val { font-size:18px; font-weight:900; }
.lsr-val.safe    { color:#22c55e; }
.lsr-val.warn    { color:#f97316; }
.lsr-val.scam    { color:#ef4444; }
.lsr-val.unknown { color:#a8c44e; }

/* 查無資料補充卡片 */
.contribute-card { padding: 0; overflow: hidden; }
.contribute-btn {
  width:100%; padding:14px; border:none; border-radius:12px;
  background: rgba(168,196,78,0.1); color: #6b8a1a;
  font-size:14px; font-weight:900; cursor:pointer;
  transition: background 0.18s;
}
.contribute-btn:hover { background: rgba(168,196,78,0.22); }
[data-theme="dark"] .contribute-btn { color: #c8e06a; }
</style>
