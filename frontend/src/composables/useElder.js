import { ref, watch } from 'vue'

function loadPreference() {
  try { return localStorage.getItem('elder') === 'true' } catch { return false }
}
const isElder = ref(loadPreference())

function applyElder(val) {
  document.documentElement.setAttribute('data-elder', val ? 'true' : 'false')
}
applyElder(isElder.value)

watch(isElder, val => {
  applyElder(val)
  try { localStorage.setItem('elder', String(val)) } catch {
    // The mode still works if browser storage is unavailable.
  }
}, { flush: 'sync' })

export function useElder() {
  return {
    isElder,
    toggle() { isElder.value = !isElder.value },
  }
}
