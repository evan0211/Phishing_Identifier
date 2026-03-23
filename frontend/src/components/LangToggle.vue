<template>
  <button
    class="lang-toggle"
    :class="{ 'is-en': locale === 'en' }"
    :title="locale === 'zh' ? 'Switch to English' : '切換為中文'"
    @click="toggle"
    aria-label="Language toggle"
  >
    <span class="lang-opt" :class="{ active: locale === 'zh' }">中</span>
    <span class="lang-divider">|</span>
    <span class="lang-opt" :class="{ active: locale === 'en' }">EN</span>
  </button>
</template>

<script setup>
import { useLocale } from '../composables/useLocale.js'
const { locale, toggle } = useLocale()
</script>

<style scoped>
.lang-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 100px;
  padding: 7px 14px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: box-shadow 0.2s, background 0.2s, border-color 0.2s;
  font-family: 'Noto Sans TC', sans-serif;
  user-select: none;
}
.lang-toggle:hover {
  box-shadow: 0 6px 28px rgba(45,71,232,0.22);
  border-color: var(--primary);
}
.lang-opt {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  transition: color 0.18s;
  letter-spacing: 0.3px;
}
.lang-opt.active {
  color: var(--primary);
}
.lang-divider {
  font-size: 11px;
  color: var(--border);
  font-weight: 400;
}

/* Subtle glow when English is active */
.is-en {
  border-color: var(--primary);
  background: var(--primary-light);
}
</style>
