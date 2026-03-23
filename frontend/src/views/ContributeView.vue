<template>
  <div class="page-wrap" :class="{ elder: isElder }">
    <nav class="navbar">
      <button class="back-btn" @click="goBack">{{ t('back') }}</button>
      <span class="nav-title">{{ t('contributeTitle') }}</span>
    </nav>

    <main class="contribute-main">
      <div class="contribute-card">
        <div class="cc-header">
          <span class="cc-icon">🙋</span>
          <div>
            <div class="cc-title">{{ t('contributeTitle') }}</div>
            <div class="cc-sub">{{ t('contributeSubtitle') }}</div>
          </div>
        </div>

        <!-- 查詢的號碼/網址 -->
        <div class="cc-target">
          <span class="cct-label">{{ t('contributeQuery') }}</span>
          <span class="cct-val">{{ inputVal }}</span>
        </div>

        <!-- 類型選擇 -->
        <div class="cf-row">
          <label class="cf-label">{{ t('contributeLabel') }} <span class="cf-required">*</span></label>
          <div class="cf-chips">
            <button
              v-for="opt in options" :key="opt.value"
              class="cf-chip"
              :class="{ active: selectedType === opt.value, [opt.value]: true }"
              @click="selectedType = opt.value">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 補充說明 -->
        <div class="cf-row">
          <label class="cf-label">{{ t('contributeNote') }}</label>
          <textarea
            class="cf-textarea"
            v-model="note"
            :placeholder="t('contributePlaceholder')"
            rows="4"
          ></textarea>
        </div>

        <button
          class="cf-submit"
          :disabled="!selectedType || submitting"
          @click="submit">
          {{ submitting ? t('contributeSubmitting') : t('contributeSubmit') }}
        </button>
      </div>
    </main>

    <div class="toast" :class="{ show: toastVisible, ok: toastType==='ok', err: toastType==='err' }">
      {{ toastMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useElder } from '../composables/useElder.js'
import { useLocale, t } from '../composables/useLocale.js'
import { report } from '../services/api.js'

const router = useRouter()
const route  = useRoute()
const { isElder } = useElder()
const { locale } = useLocale()

const inputVal    = route.query.input || ''
const inputType   = route.query.type  || 'phone'
const selectedType = ref('')
const note         = ref('')
const submitting   = ref(false)

const options = computed(() => [
  { value: 'scam',  label: '🚨 ' + t('tagScam')  },
  { value: 'warn',  label: '⚠️ ' + t('tagWarn')  },
  { value: 'promo', label: '📣 ' + t('tagPromo')  },
  { value: 'safe',  label: '✅ ' + t('tagSafe')   },
])

function goBack() { router.back() }

const toastVisible = ref(false)
const toastMsg     = ref('')
const toastType    = ref('')
let toastTimer = null
function showToast(msg, type = '') {
  toastMsg.value = msg; toastType.value = type; toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3200)
}

async function submit() {
  if (!selectedType.value) return
  submitting.value = true
  try {
    const d = await report(inputVal, inputType)
    const msg = locale.value === 'en'
      ? '🙏 Thanks for your report, case ' + d.caseNo
      : '🙏 感謝您的回報，案號 ' + d.caseNo
    showToast(msg, 'ok')
    setTimeout(() => router.back(), 2000)
  } catch {
    showToast(t('contributeToastErr'), 'err')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-wrap { min-height:100vh; background:var(--bg); color:var(--text); display:flex; flex-direction:column; }

.navbar { background:var(--navbar-bg); padding:10px 16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:200; }
.back-btn { background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:7px 16px; color:#fff; font-size:13px; font-weight:700; }
.back-btn:hover { background:rgba(255,255,255,0.28); }
.nav-title { color:#fff; font-size:15px; font-weight:700; }

.contribute-main { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:32px 20px; }

.contribute-card { width:100%; max-width:560px; background:var(--surface); border:1.5px solid var(--border); border-radius:20px; padding:28px; display:flex; flex-direction:column; gap:20px; box-shadow:0 8px 32px rgba(0,0,0,0.08); }

.cc-header { display:flex; align-items:center; gap:14px; }
.cc-icon   { font-size:36px; flex-shrink:0; }
.cc-title  { font-size:20px; font-weight:900; }
.cc-sub    { font-size:13px; color:var(--text-muted); margin-top:3px; line-height:1.5; }

.cc-target { background:var(--surface2); border:1.5px solid var(--border); border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:4px; }
.cct-label { font-size:11px; font-weight:700; color:var(--text-muted); letter-spacing:0.5px; text-transform:uppercase; }
.cct-val   { font-size:15px; font-weight:700; font-family:'DM Mono',monospace; word-break:break-all; }

.cf-row   { display:flex; flex-direction:column; gap:8px; }
.cf-label { font-size:13px; font-weight:700; color:var(--text-sub); }
.cf-required { color:var(--scam); }

.cf-chips { display:flex; flex-wrap:wrap; gap:8px; }
.cf-chip  { border:1.5px solid var(--border); border-radius:100px; padding:8px 18px; font-size:14px; font-weight:700; background:var(--surface2); color:var(--text-sub); transition:all 0.15s; }
.cf-chip:hover { border-color:var(--primary); color:var(--primary); }
.cf-chip.active.scam  { background:var(--scam);    border-color:var(--scam);    color:#fff; }
.cf-chip.active.warn  { background:var(--warn);    border-color:var(--warn);    color:#fff; }
.cf-chip.active.promo { background:var(--promo);   border-color:var(--promo);   color:#fff; }
.cf-chip.active.safe  { background:var(--safe);    border-color:var(--safe);    color:#fff; }

.cf-textarea { width:100%; border:1.5px solid var(--border); border-radius:12px; padding:12px 14px; font-size:14px; font-family:'Noto Sans TC',sans-serif; background:var(--surface2); color:var(--text); resize:none; outline:none; transition:border-color 0.2s; box-sizing:border-box; line-height:1.6; }
.cf-textarea:focus { border-color:var(--primary); }

.cf-submit { background:var(--primary); color:#fff; border:none; border-radius:14px; padding:14px; font-size:16px; font-weight:900; transition:background 0.18s; }
.cf-submit:hover:not(:disabled) { background:var(--primary-dark); }
.cf-submit:disabled { opacity:0.45; cursor:not-allowed; }

.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:#111; color:#fff; border-radius:100px; padding:10px 22px; font-size:14px; font-weight:700; box-shadow:0 6px 28px rgba(0,0,0,0.22); transition:transform 0.3s cubic-bezier(0.34,1.4,0.64,1); z-index:9999; white-space:nowrap; pointer-events:none; }
.toast.show { transform:translateX(-50%) translateY(0); }
.toast.ok  { background:#00C47A; }
.toast.err { background:var(--scam); }

.page-wrap.elder .cc-title  { font-size:26px; }
.page-wrap.elder .cf-chip   { font-size:18px; padding:10px 22px; }
.page-wrap.elder .cf-submit { font-size:20px; padding:18px; }
</style>
