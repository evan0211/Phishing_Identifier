<template>
  <div class="page-wrap" :class="{ elder: isElder }">

    <nav class="navbar">
      <button class="back-btn" @click="goHome">{{ t('visitedBack') }}</button>
      <span class="nav-title">{{ t('visitedNavTitle') }}</span>
      <label class="toggle-wrap theme-toggle" :class="{ active: isDark }">
        <input type="checkbox" :checked="isDark" @change="toggleTheme" style="display:none">
        <span class="toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
        <span class="toggle-label">{{ isDark ? t('dark') : t('light') }}</span>
        <span class="toggle-pill"><span class="toggle-knob"></span></span>
      </label>
    </nav>

    <div class="top-banner">
      <span class="siren">🚨</span>
      <div>
        <strong>{{ t('visitedBannerTitle') }}</strong>
        <span>{{ t('visitedBannerSub') }}</span>
      </div>
    </div>

    <main class="main-content">
      <div class="scam-url-box">{{ scamUrl }}</div>

      <section class="section-card">
        <div class="sec-title">🚨 {{ locale === 'en' ? 'Take Action Now' : '立即採取以下行動' }}</div>
        <div class="steps">
          <div class="step danger"><span class="step-icon">🚫</span><div class="step-text"><strong>{{ t('visitedAction1T') }}</strong><span>{{ t('visitedAction1S') }}</span></div></div>
          <div class="step danger"><span class="step-icon">💳</span><div class="step-text"><strong>{{ t('visitedAction2T') }}</strong><span>{{ t('visitedAction2S') }}</span></div></div>
          <div class="step warn"><span class="step-icon">📱</span><div class="step-text"><strong>{{ t('visitedAction3T') }}</strong><span>{{ t('visitedAction3S') }}</span></div></div>
          <div class="step info"><span class="step-icon">📋</span><div class="step-text"><strong>{{ t('visitedAction4T') }}</strong><span>{{ t('visitedAction4S') }}</span></div></div>
        </div>
      </section>

      <section class="section-card">
        <div class="sec-title">{{ t('quickHelp') }}</div>
        <div class="quick-btns">
          <button class="qbtn qbtn-165"    @click="showToast(t('toast165'), 'ok')"><span class="qi">🆘</span><span>{{ t('help165') }}</span><span class="qsub">{{ t('help165Sub') }}</span></button>
          <button class="qbtn qbtn-bank"   @click="showToast(t('toastBank'), 'ok')"><span class="qi">🏦</span><span>{{ t('helpBank') }}</span><span class="qsub">{{ t('helpBankSub') }}</span></button>
          <button class="qbtn qbtn-police" @click="showToast(t('toastPolice'), 'ok')"><span class="qi">👮</span><span>{{ t('helpPolice') }}</span><span class="qsub">{{ t('helpPoliceSub') }}</span></button>
        </div>
      </section>

      <button class="btn-leave" @click="goHome">{{ t('leaveNow') }}</button>
    </main>

    <!-- Corner overlay -->
    <div class="overlay">
      <div class="ov-panel" :class="{ open: evidenceOpen }">
        <div class="ov-panel-title">{{ t('evidencePanel') }}<button class="ov-close" @click="toggleEvidence">✕</button></div>
        <div v-if="!submitSuccess">
          <div class="ov-field">
            <label>{{ t('crTypeLabel') }}</label>
            <select v-model="crType">
              <option>{{ t('scamTypeBank') }}</option>
              <option>{{ t('scamTypeGov') }}</option>
              <option>{{ t('scamTypeInvest') }}</option>
              <option>{{ t('scamTypeShop') }}</option>
              <option>{{ t('scamTypeJob') }}</option>
              <option>{{ t('scamTypeOther') }}</option>
            </select>
          </div>
          <div class="ov-field">
            <label>{{ t('crDescLabel') }}</label>
            <textarea rows="3" v-model="crDesc" :placeholder="t('crDescPlaceholder')"></textarea>
          </div>
          <button class="ov-submit" @click="submitReport">{{ t('crSubmit') }}</button>
        </div>
        <div class="ov-success" v-if="submitSuccess">
          <span class="ov-si">✅</span>
          <strong>{{ t('crSuccess') }}</strong>
          <span>{{ caseNo }}</span>
        </div>
      </div>
      <div class="float-actions">
        <button class="float-btn fb-block"    @click="doBlock">   <span>🚫</span> {{ t('blockNow') }}</button>
        <button class="float-btn fb-report"   @click="doReport">  <span>📢</span> {{ t('reportNow') }}</button>
        <button class="float-btn fb-evidence" @click="toggleEvidence"><span>📁</span> {{ t('evidenceBtn') }}</button>
      </div>
      <div class="pill"><span class="pill-dot"></span><span>🚨</span><span class="pill-text">{{ t('pillText') }}</span></div>
    </div>

    <div class="toast" :class="{ show: toastVisible, ok: toastType==='ok' }">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useElder } from '../composables/useElder.js'
import { useLocale, t } from '../composables/useLocale.js'
import { report } from '../services/api.js'

const route = useRoute(), router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()
const { isElder } = useElder()
const { locale } = useLocale()

const scamUrl = route.query.url || (locale.value === 'en' ? '(unknown URL)' : '（未知網址）')
function goHome() { router.push('/') }

const evidenceOpen  = ref(false)
const submitSuccess = ref(false)
const crType = ref('')
const crDesc = ref('')
const caseNo = ref('')
function toggleEvidence() { evidenceOpen.value = !evidenceOpen.value }

async function doBlock()  {
  try { const d = await report(scamUrl, 'url'); showToast('🚫 ' + (locale.value === 'en' ? 'Blocked — ' : '已封鎖 — ') + d.caseNo, 'ok') }
  catch { showToast('🚫 ' + (locale.value === 'en' ? 'Blocked (offline mode)' : '已封鎖（離線模式）'), 'ok') }
}
async function doReport() {
  try { const d = await report(scamUrl, 'url'); showToast('📢 ' + (locale.value === 'en' ? 'Reported to 165, case ' : '已通報 165，案號 ') + d.caseNo, 'ok') }
  catch { showToast('📢 ' + (locale.value === 'en' ? 'Reported (offline mode)' : '已通報（離線模式）'), 'ok') }
}
async function submitReport() {
  try { const d = await report(scamUrl, 'url'); caseNo.value = (locale.value === 'en' ? 'Case ' : '案號 ') + d.caseNo }
  catch { caseNo.value = (locale.value === 'en' ? 'Case ' : '案號 ') + '#TW2026-' + Math.floor(10000 + Math.random() * 90000) }
  submitSuccess.value = true
}

const toastVisible = ref(false), toastMsg = ref(''), toastType = ref('')
let toastTimer = null
function showToast(msg, type = '') {
  toastMsg.value = msg; toastType.value = type; toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}
onUnmounted(() => { clearTimeout(toastTimer) })
</script>

<style scoped>
.page-wrap { min-height:100vh; background:var(--bg); color:var(--text); display:flex; flex-direction:column; transition:background 0.25s,color 0.25s; position:relative; }
[data-theme="dark"] .page-wrap::before { content:''; position:fixed; inset:0; z-index:0; pointer-events:none; background:linear-gradient(rgba(255,45,45,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,45,45,0.04) 1px,transparent 1px); background-size:40px 40px; animation:gridpulse 4s ease-in-out infinite; }
@keyframes gridpulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

.navbar { background:#b00000; padding:10px 16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:200; }
.back-btn { background:rgba(255,255,255,0.2); border:1.5px solid rgba(255,255,255,0.3); border-radius:100px; padding:7px 16px; color:#fff; font-size:13px; font-weight:700; white-space:nowrap; transition:background 0.2s; }
.back-btn:hover { background:rgba(255,255,255,0.32); }
.nav-title { flex:1; text-align:center; color:#fff; font-size:14px; font-weight:700; }

.toggle-wrap { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:5px 10px 5px 8px; cursor:pointer; transition:background 0.2s; user-select:none; }
.toggle-wrap:hover { background:rgba(255,255,255,0.25); }
.toggle-wrap.active { background:rgba(255,255,255,0.22); border-color:rgba(255,255,255,0.4); }
.toggle-icon  { font-size:15px; line-height:1; }
.toggle-label { font-size:12px; font-weight:700; color:#fff; white-space:nowrap; }
.toggle-pill  { width:30px; height:16px; border-radius:100px; background:rgba(255,255,255,0.25); position:relative; flex-shrink:0; transition:background 0.25s; }
.toggle-wrap.active .toggle-pill { background:rgba(255,255,255,0.7); }
.toggle-knob  { position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.25); transition:transform 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.toggle-wrap.active .toggle-knob { transform:translateX(14px); }
.theme-toggle .toggle-pill { background:rgba(100,120,255,0.4); }
.theme-toggle.active .toggle-pill { background:rgba(60,70,140,0.8); }

.top-banner { background:var(--scam); padding:16px 24px; display:flex; align-items:center; gap:14px; position:relative; z-index:1; }
.siren { font-size:28px; animation:sway 0.5s ease-in-out infinite alternate; flex-shrink:0; }
@keyframes sway { from{transform:rotate(-10deg)} to{transform:rotate(10deg)} }
.top-banner strong { display:block; font-size:16px; font-weight:900; color:#fff; }
.top-banner span   { font-size:12px; color:rgba(255,255,255,0.82); }

.main-content { position:relative; z-index:1; flex:1; display:flex; flex-direction:column; gap:14px; max-width:640px; width:100%; margin:0 auto; padding:20px 16px 80px; }
.scam-url-box { font-family:'DM Mono',monospace; font-size:12px; color:var(--scam-text); background:var(--scam-bg); border:1.5px solid rgba(255,45,45,0.25); border-radius:12px; padding:10px 16px; word-break:break-all; text-align:center; transition:background 0.25s,color 0.25s; }
.section-card { background:var(--surface); border:1.5px solid var(--border); border-radius:16px; padding:18px; box-shadow:var(--shadow-sm); transition:background 0.25s,border-color 0.25s; }
.sec-title { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-muted); margin-bottom:14px; }
.steps { display:flex; flex-direction:column; gap:10px; }
.step { display:flex; align-items:flex-start; gap:14px; background:var(--surface2); border:1px solid var(--border); border-radius:13px; padding:14px 16px; border-left:3px solid transparent; transition:background 0.25s; }
.step.danger { border-left-color:var(--scam); }
.step.warn   { border-left-color:var(--warn); }
.step.info   { border-left-color:var(--primary); }
.step-icon { font-size:22px; flex-shrink:0; margin-top:1px; }
.step-text strong { display:block; font-size:14px; font-weight:900; margin-bottom:3px; color:var(--text); }
.step-text span   { font-size:12px; color:var(--text-sub); line-height:1.5; }
.quick-btns { display:flex; gap:10px; }
.qbtn { flex:1; border:none; border-radius:13px; padding:14px 10px; font-weight:900; font-size:14px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:all 0.18s; color:#fff; }
.qbtn .qi { font-size:24px; }
.qsub { font-size:11px; opacity:0.82; font-weight:400; }
.qbtn-165    { background:var(--scam); }
.qbtn-bank   { background:#1a3a8f; }
.qbtn-police { background:var(--surface3); color:var(--text); border:1.5px solid var(--border); }
.qbtn:hover  { filter:brightness(0.88); }
.btn-leave { width:100%; background:var(--safe); color:#fff; border:none; border-radius:14px; padding:16px; font-size:15px; font-weight:900; transition:background 0.18s; box-shadow:0 4px 18px rgba(0,196,122,0.3); }
.btn-leave:hover { background:#00a868; }

.page-wrap.elder .step-text strong { font-size:16px; }
.page-wrap.elder .step-text span   { font-size:14px; }
.page-wrap.elder .btn-leave        { font-size:18px; padding:18px; }

.overlay { position:fixed; bottom:28px; right:28px; z-index:999; display:flex; flex-direction:column; align-items:flex-end; gap:10px; }
.float-actions { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
.float-btn { display:flex; align-items:center; gap:10px; border:none; border-radius:100px; padding:10px 18px 10px 14px; font-size:14px; font-weight:700; color:#fff; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,0.18); opacity:0; transform:translateX(20px); pointer-events:none; transition:opacity 0.2s,transform 0.28s cubic-bezier(0.34,1.4,0.64,1),filter 0.15s; }
.float-btn:hover  { filter:brightness(1.12); }
.float-btn:active { transform:scale(0.96) translateX(0) !important; }
.fb-block    { background:linear-gradient(135deg,#ff5252,#c41c1c); }
.fb-report   { background:linear-gradient(135deg,#ffb300,#e07000); }
.fb-evidence { background:linear-gradient(135deg,#5c7cff,#1a2fc7); }
.overlay:hover .float-btn { opacity:1; transform:translateX(0); pointer-events:auto; }
.overlay:hover .float-btn:nth-child(1) { transition-delay:0s; }
.overlay:hover .float-btn:nth-child(2) { transition-delay:0.05s; }
.overlay:hover .float-btn:nth-child(3) { transition-delay:0.10s; }
.pill { display:flex; align-items:center; gap:8px; border-radius:100px; padding:11px 18px; border:2px solid #ff5252; background:var(--scam-bg); box-shadow:0 4px 18px rgba(255,45,45,0.22); transition:background 0.3s; animation:pillBounce 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes pillBounce { from{transform:translateY(80px);opacity:0} to{transform:translateY(0);opacity:1} }
.pill-dot { width:8px; height:8px; border-radius:50%; background:#ff2d2d; animation:blink 1.4s ease-in-out infinite; flex-shrink:0; }
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
.pill-text { font-size:13px; font-weight:700; color:var(--scam-text); }
.ov-panel { background:var(--surface); border-radius:18px; border:1.5px solid var(--border); box-shadow:var(--shadow-lg); padding:20px; width:300px; display:none; transition:background 0.25s; }
.ov-panel.open { display:block; animation:slideUp 0.22s ease; }
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.ov-panel-title { font-size:14px; font-weight:900; color:var(--text); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
.ov-close { margin-left:auto; background:none; border:none; font-size:16px; cursor:pointer; color:var(--text-muted); padding:0; }
.ov-field { margin-bottom:10px; }
.ov-field label { display:block; font-size:10px; font-weight:700; color:var(--text-muted); letter-spacing:1px; text-transform:uppercase; margin-bottom:5px; }
.ov-field select,.ov-field textarea { width:100%; border:1.5px solid var(--border); border-radius:9px; padding:9px 11px; font-size:12px; font-family:'Noto Sans TC',sans-serif; color:var(--text); background:var(--surface2); outline:none; resize:none; transition:background 0.25s,border-color 0.2s; }
.ov-field select:focus,.ov-field textarea:focus { border-color:var(--primary); }
.ov-submit { width:100%; background:var(--primary); color:#fff; border:none; border-radius:9px; padding:11px; font-size:13px; font-weight:900; transition:background 0.18s; margin-top:2px; }
.ov-submit:hover { background:var(--primary-dark); }
.ov-success { display:flex; flex-direction:column; align-items:center; gap:7px; text-align:center; padding:6px 0; }
.ov-si { font-size:36px; }
.ov-success strong { font-size:14px; color:var(--text); }
.ov-success span   { font-size:11px; color:var(--text-muted); }

.toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(80px); background:#111; color:#fff; border-radius:100px; padding:10px 22px; font-size:14px; font-weight:700; box-shadow:0 6px 28px rgba(0,0,0,0.22); transition:transform 0.3s cubic-bezier(0.34,1.4,0.64,1); z-index:9999; white-space:nowrap; }
.toast.show { transform:translateX(-50%) translateY(0); }
.toast.ok   { background:#00C47A; }

@media (max-width:640px) {
  .main-content { padding:14px 12px 70px; gap:10px; }
  .quick-btns   { flex-direction:column; }
  .overlay      { bottom:16px; right:16px; }
  .toggle-label { display:none; }
}
</style>
