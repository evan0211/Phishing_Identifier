import { ref, watch } from 'vue'

const isElder = ref(localStorage.getItem('elder') === 'true')

function applyElder(val) {
  document.documentElement.setAttribute('data-elder', val ? 'true' : 'false')
}
applyElder(isElder.value)

watch(isElder, val => {
  localStorage.setItem('elder', val)
  applyElder(val)
})

export function useElder() {
  return {
    isElder,
    toggle() { isElder.value = !isElder.value }
  }
}
