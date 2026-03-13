import { ref, watch } from 'vue'

const _stored = localStorage.getItem('theme')
const _sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = ref(_stored === 'dark' || (_stored === null && _sysDark))

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}
applyTheme(isDark.value)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem('theme') === null) isDark.value = e.matches
})

watch(isDark, val => {
  localStorage.setItem('theme', val ? 'dark' : 'light')
  applyTheme(val)
})

export function useTheme() {
  return {
    isDark,
    toggle() { isDark.value = !isDark.value },
  }
}
