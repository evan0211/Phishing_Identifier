<template>
  <div class="page-wrap" :class="[mode + '-mode', { elder: isElder }]">

    <!-- Navbar -->
    <nav class="navbar">
      <button class="back-btn" @click="goBack">← 返回</button>
      <span class="nav-title" @click="goBack" style="cursor:pointer">分析結果</span>
      <div class="nav-actions">
        <label class="toggle-wrap" :class="{ active: isElder }" title="長輩模式">
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

    <!-- No result guard -->
    <div v-if="!result" class="no-result">
      <div class="no-result-icon">🔍</div>
      <p>尚無分析結果</p>
      <button class="go-home-btn" @click="goBack">回到首頁</button>
    </div>

    <!-- Two-column layout -->
    <main v-else class="result-main">

      <!-- ── LEFT COLUMN: 分析結果 ── -->
      <div class="col col-left">

        <!-- Risk banner -->
        <div class="risk-banner" :class="[mode, mode.includes('_') ? mode.split('_')[0] : mode]">
          <div class="rb-badge">
            <span class="rb-icon">{{ ICONS[mode] }}</span>
          </div>
          <div class="rb-info">
            <div class="rb-tag">{{ TAGS[mode] }}</div>
            <div class="rb-title">{{ result.label }}</div>
            <div class="rb-input" :title="lastInput">{{ lastInput }}</div>
          </div>
        </div>

        <!-- Score bar -->
        <div class="section-card score-card">
          <div class="score-labels"><span>安全 0</span><span>100 高風險</span></div>

          <!-- Gogolook 分數條 -->
          <div class="dual-bar-row">
            <span class="dbar-label">Gogolook</span>
            <div class="dbar-track">
              <div class="dbar-fill ggl" :style="{ width: (result?.ggl?.score ?? barWidth) + '%' }"></div>
            </div>
            <span class="dbar-val ggl-text">{{ result.score }}</span>
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
            <span class="ws-label">綜合評分</span>
            <span class="ws-val" :class="mode">{{ weightedScore }} 分</span>
            <span class="ws-formula">（Gogolook×55% + AI×45%）</span>
          </div>
          <div class="score-value" :class="mode" v-else>風險分數：{{ result?.ggl?.score ?? result.score }} / 100</div>
        </div>

        <!-- Reasons -->
        <div class="section-card reasons-card">
          <div class="sec-title">📋 分析原因</div>
          <ul class="reasons">
            <li v-for="(r, i) in result.reasons" :key="i">
              <span class="ri">{{ RI(mode) }}</span>
              <span>{{ r }}</span>
            </li>
          </ul>
        </div>

      </div><!-- /col-left -->



      <!-- ── AI 分析第三欄 ── -->
      <div class="col col-ai" v-if="llmAnalysis || isLoadingLLM">

        <div class="section-card llm-card">
          <div class="sec-title">🤖 AI 深度分析</div>
          <div class="llm-loading" v-if="isLoadingLLM">
            <span class="spinner">⏳</span>
            <span>AI 正在分析中...</span>
          </div>
          <template v-else-if="llmAnalysis">
            <div class="llm-score-row" v-if="llmAnalysis.score !== undefined">
              <span class="lsr-label">AI 風險評分</span>
              <span class="lsr-val" :class="llmAnalysis.level">{{ llmAnalysis.score }} 分</span>
            </div>
            <div class="llm-fraud-type" v-if="llmAnalysis.fraud_type">
              <span class="lft-icon">🎯</span>
              <div class="lft-text">
                <strong>詐騙手法</strong>
                <span>{{ llmAnalysis.fraud_type }}</span>
              </div>
            </div>
            <div class="llm-suggestion" v-if="llmAnalysis.suggestion">
              <span class="ls-icon">💡</span>
              <p>{{ llmAnalysis.suggestion }}</p>
            </div>
          </template>
        </div>

        <div class="section-card advice-card" v-if="llmAdvice">
          <div class="sec-title">🛡️ 專業對策建議</div>
          <div class="advice-section" v-if="llmAdvice.immediate_actions?.length">
            <div class="advice-title">⚡ 立即行動</div>
            <ul class="advice-list">
              <li v-for="(action, i) in llmAdvice.immediate_actions" :key="i">
                <span class="al-icon">✓</span><span>{{ action }}</span>
              </li>
            </ul>
          </div>
          <div class="advice-section" v-if="llmAdvice.avoid_actions?.length">
            <div class="advice-title">🚫 絕對不要</div>
            <ul class="advice-list avoid">
              <li v-for="(action, i) in llmAdvice.avoid_actions" :key="i">
                <span class="al-icon">✗</span><span>{{ action }}</span>
              </li>
            </ul>
          </div>
          <div class="advice-section" v-if="llmAdvice.report_steps?.length">
            <div class="advice-title">📢 舉報步驟</div>
            <ol class="advice-steps">
              <li v-for="(step, i) in llmAdvice.report_steps" :key="i">{{ step }}</li>
            </ol>
          </div>
          <div class="advice-recovery" v-if="llmAdvice.recovery_tips">
            <div class="advice-title">🔧 若已受騙</div>
            <p>{{ llmAdvice.recovery_tips }}</p>
          </div>
        </div>

      </div><!-- /col-ai -->

            <!-- ── RIGHT COLUMN: 行動建議 ── -->
      <div class="col col-right">

        <!-- Visit site (URL only) — top of right col -->
        <div class="section-card visit-card" v-if="lastType === 'url'">
          <div class="visit-warning" v-if="isScamLevel">
            ⚠️ <strong>警告：</strong>此網站已被標記為詐騙，強烈不建議前往。
          </div>
          <button class="visit-btn" :class="{ 'visit-safe': isSafeLevel, 'visit-promo': mode.startsWith('promo') }" @click="confirmVisit">
            {{ isSafeLevel ? '🔗 前往此網站' : '⚠️ 仍要前往此網站（不建議）' }}
          </button>
        </div>

        <!-- Elder guidance tip -->
        <div class="elder-result-tip" v-if="isElder">
          <span class="ert-icon">{{ isScamLevel ? '🚨' : ['suspect_high','suspect_low','promo_warn','warn'].includes(mode) ? '⚠️' : '💡' }}</span>
          <div class="ert-text">
            <strong>{{ ['scam','promo_scam'].includes(mode) ? '此為詐騙！請不要點擊任何連結或輸入資料' : ['suspect_high','promo_warn'].includes(mode) ? '此來源高度可疑，請謹慎處理' : ['suspect_low'].includes(mode) ? '此來源輕度可疑，建議確認後再操作' : mode === 'unknown' ? '查無此號碼資料，請謹慎判斷' : '此來源安全，您可以放心' }}</strong>
            <span>{{ isScamLevel ? '建議立即封鎖並撥打 165 反詐騙專線。' : ['suspect_high','suspect_low','promo_warn'].includes(mode) ? '建議先封鎖，若有疑問可撥打 165 確認。' : '如仍有疑慮，歡迎撥打 165 反詐騙專線查詢。' }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="section-card actions-card">
          <div class="sec-title">⚡ 立即行動</div>
          <div class="actions-col">
            <button class="act-btn btn-block" @click="doAction('block')">
              <span class="ai">🚫</span>
              <div class="act-text">
                <span class="at">一鍵封鎖</span>
                <span class="as">加入黑名單，下次自動攔截</span>
              </div>
            </button>
            <button class="act-btn btn-report" @click="doAction('report')">
              <span class="ai">📢</span>
              <div class="act-text">
                <span class="at">一鍵通報</span>
                <span class="as">通報至 165 反詐騙資料庫</span>
              </div>
            </button>
            <button class="act-btn btn-evidence" @click="doAction('evidence')">
              <span class="ai">📁</span>
              <div class="act-text">
                <span class="at">一鍵回報證據</span>
                <span class="as">截圖上傳，協助案件調查</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Next steps -->
        <div class="section-card next-card">
          <div class="sec-title">🧭 下一步建議</div>
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
          <button class="confirm-cancel" @click="closeConfirm">取消</button>
          <button class="confirm-ok" @click="confirmData.cb && confirmData.cb()">{{ confirmData.ok }}</button>
        </div>
      </div>
    </div>

    <!-- Scam fullscreen -->
    <div class="scam-fullscreen" :class="{ show: showScamFs }">
      <div class="sf-stripes"></div>
      <div class="sf-inner">
        <span class="sf-siren">🚨</span>
        <div class="sf-badge">⛔ 詐騙網站警告</div>
        <div class="sf-title">您即將進入<span>詐騙網站</span></div>
        <div class="sf-url">{{ lastInput }}</div>
        <div class="sf-risks">
          <div class="sf-risk-item"><span>💳</span>您的銀行帳號、密碼可能被竊取</div>
          <div class="sf-risk-item"><span>🪪</span>個人身分資料可能遭冒用</div>
          <div class="sf-risk-item"><span>📱</span>裝置可能被植入惡意程式</div>
          <div class="sf-risk-item"><span>💸</span>財產損失風險極高</div>
        </div>
        <div class="sf-btns">
          <button class="sf-cancel" @click="closeScamFs">✅ 離開，保護自己</button>
          <div class="sf-slider-wrap" ref="sliderWrap" :class="{ completed: sliderDone }">
            <div class="sf-fill"  ref="sliderFill"></div>
            <div class="sf-label">← 向右滑動以仍要前往（不建議）</div>
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { resultState } from '../composables/useResult.js'
import { report, analyzeLLMText, getLLMAdvice } from '../services/api.js'

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder, toggle: toggleElderFn } = useElder()

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
const TAGS  = {
  safe_high: '完全安全', safe_low: '安全（低風險）',
  suspect_low: '輕度可疑', suspect_high: '高度可疑',
  scam: '詐騙',
  promo_safe: '行銷推廣（安全）', promo_warn: '行銷推廣（可疑）', promo_scam: '行銷推廣（詐騙）',
  unknown: '查無資料',
  safe: '安全', promo: '推銷', warn: '可疑',
}
const RI = lv => {
  if (['scam','promo_scam'].includes(lv)) return '🔴'
  if (['suspect_high','promo_warn'].includes(lv)) return '🟠'
  if (['suspect_low'].includes(lv)) return '🟡'
  if (lv === 'unknown') return '⚪'
  return '🟢'
}
const NEXT = {
  safe_high: [{ i:'✅', t:'完全安全可放心使用', s:'Gogolook 與 AI 雙重確認安全。' }],
  safe_low:  [{ i:'🟢', t:'安全但保持警覺',    s:'風險極低，正常使用即可。' }],
  suspect_low:  [{ i:'🟡', t:'輕度可疑，謹慎使用', s:'不要輕易提供個人資料。' },
                 { i:'👨‍👩‍👧', t:'詢問家人或朋友確認', s:'讓信任的人幫你確認。' }],
  suspect_high: [{ i:'🟠', t:'高度可疑，建議封鎖', s:'請勿點擊或提供任何資料。' },
                 { i:'📢', t:'建議通報',           s:'協助保護其他可能受害者。' }],
  scam:  [{ i:'🚫', t:'立即停止任何操作',   s:'不要點擊、不要輸入資料。' },
          { i:'💳', t:'立刻聯絡銀行',       s:'撥卡片背面號碼申請凍結。' },
          { i:'📞', t:'撥打 165 反詐騙',   s:'24 小時，由專人協助。' },
          { i:'👮', t:'向警察局報案',       s:'保留截圖向派出所報案。' }],
  promo_safe: [{ i:'📣', t:'確認是否為主動訂閱', s:'若非本人訂閱，可封鎖。' }],
  promo_warn: [{ i:'📣', t:'行銷但有可疑跡象',   s:'請確認來源是否可信。' },
               { i:'🔕', t:'不需要可直接封鎖',   s:'點選一鍵封鎖加入黑名單。' }],
  promo_scam: [{ i:'🚫', t:'疑似詐騙偽裝推銷',   s:'不要點擊或提供資料。' },
               { i:'📢', t:'建議通報',            s:'協助保護其他用戶。' }],
  unknown: [{ i:'❓', t:'號碼查無資料',       s:'資料庫中無此號碼資訊。' },
            { i:'🤔', t:'謹慎判斷是否接聽',   s:'陌生來電請提高警覺。' },
            { i:'📞', t:'如有疑慮撥打 165',   s:'24 小時反詐騙專線諮詢。' }],
  // fallback
  safe:  [{ i:'✅', t:'可以安全瀏覽', s:'此來源無詐騙紀錄。' }],
  warn:  [{ i:'⚠️', t:'請謹慎使用',   s:'建議不要提供個人資料。' }],
  promo: [{ i:'📋', t:'確認是否為主動訂閱', s:'若非本人訂閱，可封鎖。' }],
}
const nextSteps = computed(() => NEXT[mode.value] || [])

const barWidth    = ref(0)
const llmBarWidth = ref(0)

// 新格式：Lambda 已計算好加權分數
const weightedScore = computed(() => result.value?.score ?? 0)
// Gogolook 原始分數
const gglScoreVal = computed(() => result.value?.ggl?.score ?? result.value?.score ?? 0)

onMounted(async () => {
  setTimeout(() => {
    // Gogolook 條用 ggl.score，AI 條用 ai.score
    barWidth.value = gglScoreVal.value
  }, 120)

  // 自動解析新格式 AI 資料
  if (lastInput.value) {
    performLLMAnalysis()
  }
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

function goBack() { router.push('/') }
function toggleElder() { toggleElderFn(); showToast(isElder.value ? '👴 長輩模式已開啟' : '長輩模式已關閉', 'ok') }

function confirmVisit() {
  const url = lastInput.value.startsWith('http') ? lastInput.value : `https://${lastInput.value}`
  if (isSafeLevel.value) { window.open(url, '_blank', 'noopener'); return }
  if (isScamLevel.value) { openScamFs(); return }
  openConfirm('⚠️ 確定前往此網站？', '此網站被標記為可疑，前往請謹慎。', '仍要前往', () => {
    window.open(url, '_blank', 'noopener'); closeConfirm()
  })
}

const ACT = {
  block:    { title:'確認封鎖？',     sub:'此來源將加入黑名單，下次自動攔截。',        ok:'確認封鎖' },
  report:   { title:'確認通報？',     sub:'將通報至 165 反詐騙資料庫，保護其他用戶。', ok:'確認通報' },
  evidence: { title:'確認上傳證據？', sub:'將截圖與相關資訊上傳至案件資料庫。',        ok:'確認上傳' },
}
async function doAction(type) {
  const c = ACT[type]
  openConfirm(c.title, c.sub, c.ok, async () => {
    closeConfirm()
    try {
      const d = await report(lastInput.value, lastType.value)
      const msgs = { block:'🚫 已封鎖 — '+d.caseNo, report:'📢 已通報 165，案號 '+d.caseNo, evidence:'📁 證據已上傳，案號 '+d.caseNo }
      showToast(msgs[type], 'ok')
    } catch { showToast('❌ 操作失敗', 'err') }
  })
}

const showConfirm = ref(false)
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
onUnmounted(()=>{clearTimeout(toastTimer);document.body.style.overflow=''})
</script>

<style scoped>
.page-wrap { min-height:100vh; background:var(--bg); color:var(--text); display:flex; flex-direction:column; transition:background 0.25s,color 0.25s; }

/* ── Navbar ── */
.navbar { background:var(--navbar-bg); padding:10px 16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:200; transition:background 0.25s; }
.back-btn { background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:7px 16px; color:#fff; font-size:13px; font-weight:700; white-space:nowrap; transition:background 0.2s; flex-shrink:0; }
.back-btn:hover { background:rgba(255,255,255,0.28); }
.nav-title { position:absolute; left:50%; transform:translateX(-50%); color:#fff; font-size:15px; font-weight:700; pointer-events:none; }
.nav-actions { display:flex; gap:8px; align-items:center; margin-left:auto; }

/* Toggle switches */
.toggle-wrap { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.2); border-radius:100px; padding:5px 10px 5px 8px; cursor:pointer; transition:background 0.2s,border-color 0.2s; user-select:none; }
.toggle-wrap:hover { background:rgba(255,255,255,0.2); }
.toggle-wrap.active { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.4); }
.toggle-icon  { font-size:15px; line-height:1; }
.toggle-label { font-size:12px; font-weight:700; color:#fff; white-space:nowrap; }
.toggle-pill  { width:30px; height:16px; border-radius:100px; background:rgba(255,255,255,0.25); position:relative; flex-shrink:0; transition:background 0.25s; }
.toggle-wrap.active .toggle-pill { background:rgba(255,255,255,0.7); }
.toggle-knob  { position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.25); transition:transform 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.toggle-wrap.active .toggle-knob { transform:translateX(14px); }
.theme-toggle .toggle-pill { background:rgba(100,120,255,0.4); }
.theme-toggle.active .toggle-pill { background:rgba(60,70,140,0.8); }

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
  max-width: 1400px;
  width: 100%;
  margin: 24px auto;
  padding: 0 32px 52px;
  align-items: stretch;
  min-height: 80vh;
}

/* Left page */
.col-left {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 14px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-right: none;
  border-radius: 18px 0 0 18px;
  padding: 24px;
  box-shadow: -6px 0 32px rgba(0,0,0,0.10), inset -4px 0 12px rgba(0,0,0,0.04);
  transition: background 0.25s, border-color 0.25s;
}

/* Right page */
.col-right {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 14px;
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

.rb-badge { width:72px; height:72px; border-radius:18px; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; }
.safe  .rb-badge { background:var(--safe); }
.promo .rb-badge { background:var(--promo); }
.warn  .rb-badge { background:var(--warn); }
.scam  .rb-badge { background:var(--scam); }
.rb-icon  { font-size:36px; line-height:1; }


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
.col-left .section-card:last-child { flex: 1; }
.col-right .section-card:last-child { flex: 1; }
.sec-title { font-size:13px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--text-muted); margin-bottom:14px; }

/* ── Reasons ── */
.reasons { list-style:none; }
.reasons li { display:flex; align-items:flex-start; gap:9px; padding:8px 0; font-size:20px; line-height:1.65; border-bottom:1px solid var(--border); }
.reasons li:last-child { border-bottom:none; }
.ri { font-size:20px; flex-shrink:0; margin-top:2px; }

/* ── Visit button ── */
.visit-warning { background:var(--scam-bg); border:1.5px solid rgba(255,45,45,0.3); border-radius:10px; padding:14px 18px; font-size:16px; color:var(--scam-text); margin-bottom:10px; line-height:1.5; }
.visit-btn { width:100%; border:2px solid var(--border); border-radius:12px; padding:15px 18px; background:var(--surface2); font-size:18px; font-weight:700; color:var(--text-sub); display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.18s; }
.visit-btn:hover { border-color:var(--scam); color:var(--scam); background:var(--scam-bg); }
.visit-btn.visit-safe { border-color:var(--safe); color:var(--safe-text); background:var(--safe-bg); }
.visit-btn.visit-safe:hover { background:var(--safe); color:#fff; }
/* promo: neutral default, yellow on hover only */
.visit-btn.visit-promo { border-color:var(--border); color:var(--text-sub); background:var(--surface2); }
.visit-btn.visit-promo:hover { border-color:var(--warn); color:var(--warn); background:var(--warn-bg); }
[data-theme="dark"] .visit-btn.visit-promo:hover { color:var(--warn-text); }

/* ── Action buttons — vertical stack ── */
.actions-col { display:flex; flex-direction:column; gap:10px; }
.act-btn { display:flex; align-items:center; gap:14px; border:none; border-radius:14px; padding:14px 16px; transition:all 0.18s; text-align:left; width:100%; }
.act-btn .ai { font-size:30px; flex-shrink:0; }
.act-text { display:flex; flex-direction:column; gap:2px; }
.act-btn .at { font-size:20px; font-weight:900; line-height:1.2; }
.act-btn .as { font-size:15px; opacity:0.72; line-height:1.3; }
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
.nsi-icon { font-size:24px; flex-shrink:0; margin-top:1px; }
.nsi-text strong { display:block; font-size:20px; color:var(--text); line-height:1.3; }
.nsi-text span   { display:block; font-size:16px; color:var(--text-sub); margin-top:3px; line-height:1.4; }

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
.page-wrap.elder .risk-banner { padding:26px; }
.page-wrap.elder .rb-title    { font-size:34px; }
.page-wrap.elder .rb-icon     { font-size:44px; }
.page-wrap.elder .rb-badge    { width:84px; height:84px; border-radius:20px; }
.page-wrap.elder .reasons li  { font-size:24px; padding:12px 0; }
.page-wrap.elder .ri          { font-size:24px; }
.page-wrap.elder .at          { font-size:24px; }
.page-wrap.elder .act-btn .as { font-size:17px; }
.page-wrap.elder .nsi-text strong { font-size:24px; }
.page-wrap.elder .nsi-text span   { font-size:18px; }
.page-wrap.elder .score-fill  { height:14px; border-radius:100px; }
.page-wrap.elder .score-track { height:14px; }
.page-wrap.elder .score-value { font-size:18px; }
.page-wrap.elder .score-labels { font-size:15px; }
.page-wrap.elder .act-btn     { padding:20px 18px; }
.page-wrap.elder .visit-btn   { font-size:22px; padding:18px; }
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
    grid-template-columns: 1fr;
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
    border-radius: 0 0 0 0;
    box-shadow: none;
    padding: 16px;
    min-width: 0;
  }
  .col-ai {
    border: 1.5px solid var(--border);
    border-top: none;
    border-radius: 0 ;
    padding: 16px;
  }
.col-ai {
  flex: 1;
  min-width: 0;

  display: flex;              /* 🔥 關鍵 */
  flex-direction: column;     /* 🔥 關鍵 */
  gap: 14px;

  border: 1.5px solid var(--border);
  border-top: none;
  border-radius: 0 0 18px 18px;
  padding: 16px;
}
.col-ai .llm-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.col-ai .section-card{
  flex: 1;
  display: flex;
  flex-direction: column;
}

.col-left .section-card:last-child { flex: 1; }
.col-right .section-card:last-child { flex: 1; }
  /* Prevent banner text overflow */
  .rb-title  { font-size: 18px; }
  .rb-input  { max-width: calc(100vw - 140px); }
  .rb-info   { min-width: 0; overflow: hidden; }
  /* Actions stacked nicely on mobile */
  .act-btn   { padding: 12px 14px; }
  .act-btn .as { display: none; }
  /* Score value wrap */
  .score-value { font-size: 11px; }
  /* Toggle labels hidden on small screens */
  .toggle-label { display: none; }
  .toggle-wrap  { padding: 5px 8px; }
}

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
</style>
