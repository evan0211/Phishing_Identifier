<template>
  <a class="nl" href="/" aria-label="回到首頁" @click.prevent="goHome">
    <!-- 深色版 -->
    <svg v-if="isDark" class="nl-icon" width="36" height="36" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath :id="cid"><circle cx="44" cy="44" r="36"/></clipPath>
        <filter :id="fid"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="44" cy="44" r="36" fill="#131B3A"/>
      <g :clip-path="`url(#${cid})`">
        <circle cx="44" cy="44" r="14" fill="none" stroke="#4B6EFF" stroke-width="1" opacity=".45"/>
        <circle cx="44" cy="44" r="25" fill="none" stroke="#4B6EFF" stroke-width="1" opacity=".32"/>
        <line x1="8" y1="44" x2="80" y2="44" stroke="#4B6EFF" stroke-width=".6" opacity=".25"/>
        <line x1="44" y1="8" x2="44" y2="80" stroke="#4B6EFF" stroke-width=".6" opacity=".25"/>
        <g class="nl-sw">
          <path d="M44 44 L80 44 A36 36 0 0 0 44 8Z" fill="#4B6EFF" opacity=".15"/>
          <line x1="44" y1="44" x2="82" y2="44" stroke="#7B9EFF" stroke-width="2"
            stroke-linecap="round" :filter="`url(#${fid})`"/>
        </g>
      </g>
      <circle cx="44" cy="44" r="36" fill="none" stroke="#4B6EFF" stroke-width="1.5"
        opacity=".55" :filter="`url(#${fid})`"/>
      <circle cx="44" cy="44" r="3.5" fill="#7B9EFF" :filter="`url(#${fid})`"/>
      <g class="nl-bl">
        <circle cx="60" cy="28" r="5" fill="#FF3B3B"/>
        <circle cx="60" cy="28" r="9" fill="none" stroke="#FF3B3B" stroke-width="1.2" opacity=".35"/>
      </g>
    </svg>
    <!-- 淺色版 -->
    <svg v-else class="nl-icon" width="36" height="36" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath :id="cid2"><circle cx="44" cy="44" r="36"/></clipPath>
      </defs>
      <circle cx="44" cy="44" r="36" fill="#E8EEFF"/>
      <g :clip-path="`url(#${cid2})`">
        <circle cx="44" cy="44" r="14" fill="none" stroke="#2535CC" stroke-width="1" opacity=".22"/>
        <circle cx="44" cy="44" r="25" fill="none" stroke="#2535CC" stroke-width="1" opacity=".18"/>
        <line x1="8" y1="44" x2="80" y2="44" stroke="#2535CC" stroke-width=".6" opacity=".18"/>
        <line x1="44" y1="8" x2="44" y2="80" stroke="#2535CC" stroke-width=".6" opacity=".18"/>
        <g class="nl-sw">
          <path d="M44 44 L80 44 A36 36 0 0 0 44 8Z" fill="#3B56FF" opacity=".12"/>
          <line x1="44" y1="44" x2="82" y2="44" stroke="#3B56FF" stroke-width="2" stroke-linecap="round" opacity=".9"/>
        </g>
      </g>
      <circle cx="44" cy="44" r="36" fill="none" stroke="#1A2BC4" stroke-width="2" opacity=".4"/>
      <circle cx="44" cy="44" r="3.5" fill="#1A2BC4"/>
      <g class="nl-bl">
        <circle cx="60" cy="28" r="5" fill="#E82222"/>
        <circle cx="60" cy="28" r="9" fill="none" stroke="#E82222" stroke-width="1.2" opacity=".3"/>
      </g>
    </svg>
    <div class="nl-txt">
      <span class="nl-t">AntiFraud</span>
      <span class="nl-s">Radar</span>
    </div>
  </a>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
const { isDark } = useTheme()
const route = useRoute()
const router = useRouter()
function goHome() {
  if (route.path === '/') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    router.push('/')
  }
}
const r = Math.random().toString(36).slice(2,6)
const cid = 'nc' + r
const cid2 = 'nl' + r
const fid = 'nf' + r
</script>

<style>
.nl{text-decoration:none;display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0}
.nl-icon{flex-shrink:0}
.nl-txt{display:flex;flex-direction:column;gap:2px}
.nl-t{font-family:'SF Pro Display','Helvetica Neue',Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:.04em;color:#C8D4FF;line-height:1}
.nl-s{font-family:'SF Pro Display','Helvetica Neue',Arial,sans-serif;font-size:8.5px;font-weight:500;letter-spacing:.22em;color:#5B78CC;line-height:1;text-transform:uppercase}
.nl-sw{transform-origin:44px 44px;animation:nlsw 3s linear infinite}
@keyframes nlsw{to{transform:rotate(360deg)}}
.nl-bl{animation:nlbl 1.5s ease-in-out infinite}
@keyframes nlbl{0%,100%{opacity:1}50%{opacity:.08}}
@media(prefers-reduced-motion:reduce){.nl-sw,.nl-bl{animation:none}}
</style>
