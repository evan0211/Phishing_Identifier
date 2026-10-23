import { reactive, watch } from 'vue'

// 從 sessionStorage 恢復上次結果
function loadFromSession() {
  try {
    const raw = sessionStorage.getItem('resultState')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const saved = loadFromSession()

export const resultState = reactive({
  data:      saved?.data      ?? null,
  lastQuery: saved?.lastQuery ?? '',
  lastInput: saved?.lastInput ?? '',
  lastType:  saved?.lastType  ?? 'url',
})

// 每次資料變動時同步到 sessionStorage
watch(resultState, (val) => {
  try { sessionStorage.setItem('resultState', JSON.stringify(val)) } catch {
    // Storage may be unavailable or full; keep the current result in memory.
  }
}, { deep: true })
