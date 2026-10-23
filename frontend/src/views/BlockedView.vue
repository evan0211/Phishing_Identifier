<template>
  <div class="page-wrap">
    <nav class="navbar">
      <NavLogo />
    </nav>

    <div class="blocked-main">
      <div class="blocked-card">
        <div class="blocked-icon"><AppIcon name="block" /></div>
        <div class="blocked-title">{{ locale === 'en' ? 'Blocked' : '已封鎖' }}</div>
        <div class="blocked-query">{{ query }}</div>
        <p class="blocked-desc">{{ locale === 'en' ? 'This source has been blocked by you. It will be intercepted automatically.' : '此來源已被你封鎖，系統將自動攔截。' }}</p>
        <div class="blocked-btns">
          <button class="btn-unblock" @click="unblock">{{ locale === 'en' ? ' Unblock' : ' 解除封鎖' }}</button>
          <button class="btn-home" @click="$router.push('/')">{{ locale === 'en' ? '← Back to Home' : '← 返回首頁' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '../components/AppIcon.vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { locale } from '../composables/useLocale.js'
import NavLogo from '../components/NavLogo.vue'

const router = useRouter()
const route  = useRoute()
const query  = computed(() => route.query.q || '')

function unblock() {
  const blocked = JSON.parse(localStorage.getItem('blocklist') || '[]')
  const updated = blocked.filter(b => b !== query.value)
  localStorage.setItem('blocklist', JSON.stringify(updated))
  router.push('/')
}
</script>

<style scoped>
.page-wrap { min-height:100vh; background:var(--bg); color:var(--text); display:flex; flex-direction:column; }
.navbar { background:var(--navbar-bg); padding:10px 16px; display:flex; align-items:center; height:56px; position:sticky; top:0; z-index:200; }
.blocked-main { flex:1; display:flex; align-items:center; justify-content:center; padding:40px 20px; }
.blocked-card { background:var(--surface); border:1.5px solid var(--border); border-radius:20px; padding:40px 32px; max-width:480px; width:100%; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,0.08); display:flex; flex-direction:column; align-items:center; gap:16px; }
.blocked-icon { font-size:64px; }
.blocked-title { font-size:28px; font-weight:900; color:var(--scam); }
.blocked-query { font-size:14px; font-family:'DM Mono',monospace; background:var(--surface2); border:1.5px solid var(--border); border-radius:10px; padding:10px 16px; word-break:break-all; color:var(--text-sub); width:100%; box-sizing:border-box; }
.blocked-desc { font-size:14px; color:var(--text-sub); line-height:1.6; }
.blocked-btns { display:flex; gap:12px; width:100%; }
.btn-unblock { flex:1; padding:12px; border:1.5px solid var(--border); border-radius:12px; background:var(--surface2); color:var(--text-sub); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.18s; }
.btn-unblock:hover { border-color:var(--safe); color:var(--safe); }
.btn-home { flex:1; padding:12px; border:none; border-radius:12px; background:var(--primary); color:#fff; font-size:14px; font-weight:700; cursor:pointer; transition:background 0.18s; }
.btn-home:hover { background:var(--primary-dark); }
</style>
