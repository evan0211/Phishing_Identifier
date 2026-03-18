<template>
  <div class="phone-wrap" :class="{ focused: isFocused }">
    <div class="cc-btn" @click="showDrop = !showDrop" tabindex="0" @keydown.enter="showDrop = !showDrop">
      <img class="cc-flag" :src="`https://flagcdn.com/24x18/${selected.code.toLowerCase()}.png`" :alt="selected.name">
      <span class="cc-dial">{{ selected.dial }}</span>
      <span class="cc-arrow">{{ showDrop ? '▲' : '▼' }}</span>
    </div>
    <div class="cc-drop" v-if="showDrop">
      <div
        v-for="c in countries" :key="c.code"
        class="cc-item" :class="{ active: c.dial === selected.dial }"
        @click="select(c)"
      >
        <img class="cc-flag" :src="`https://flagcdn.com/24x18/${c.code.toLowerCase()}.png`" :alt="c.name">
        <span class="cc-item-name">{{ c.name }}</span>
        <span class="cc-item-dial">{{ c.dial }}</span>
      </div>
    </div>
    <input
      ref="inputRef"
      class="phone-input"
      type="tel"
      inputmode="numeric"
      :value="display"
      placeholder="請輸入電話號碼"
      aria-label="電話號碼輸入"
      @focus="isFocused = true; showDrop = false"
      @blur="isFocused = false"
      @input="onInput"
      @keydown.enter.prevent="emit('submit')"
    />
    <!-- 清除按鈕 — 有輸入才顯示 -->
    <button
      v-if="rawDigits"
      class="phone-clear"
      @mousedown.prevent
      @click="clearPhone"
      title="清除">✕</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  initialValue: { type: String, default: '' },
  isElder:      { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'valid', 'submit'])

const countries = [
  { dial: '+886', name: '台灣',   code: 'TW', maxLen: 10 },
  { dial: '+86',  name: '中國',   code: 'CN', maxLen: 11 },
  { dial: '+852', name: '香港',   code: 'HK', maxLen: 8  },
  { dial: '+853', name: '澳門',   code: 'MO', maxLen: 8  },
  { dial: '+1',   name: '美國',   code: 'US', maxLen: 10 },
  { dial: '+81',  name: '日本',   code: 'JP', maxLen: 11 },
  { dial: '+82',  name: '韓國',   code: 'KR', maxLen: 11 },
  { dial: '+65',  name: '新加坡', code: 'SG', maxLen: 8  },
]

const selected  = ref(countries[0])
const isFocused = ref(false)
const showDrop  = ref(false)
const inputRef  = ref(null)
const userPickedCountry = ref(false) // 使用者手動選過國家，停止自動偵測

// 不做格式化，直接顯示原始數字
const display = computed(() => rawDigits.value)

function tryAutoDetect(digits) {
  // 優先：輸入含國碼前綴（超過 maxLen）→ 剝掉國碼
  const sorted = [...countries].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    const dialDigits = c.dial.replace(/\D/g, '')
    const rest = digits.slice(dialDigits.length)
    if (digits.startsWith(dialDigits) && rest.length >= 6 && rest.length <= c.maxLen) {
      return { country: c, digits: rest }
    }
  }
  return null
}

// initialValue 帶入時先跑一次偵測，剝掉可能的國碼前綴
function initFromValue(raw) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const result = tryAutoDetect(digits)
  if (result) {
    selected.value = result.country
    return result.digits
  }
  return digits.slice(0, selected.value.maxLen)
}

const rawDigits = ref(initFromValue(props.initialValue || ''))

function onInput(e) {
  let digits = e.target.value.replace(/\D/g, '')

  // 只有超過當前國家 maxLen 時才嘗試自動偵測（剝國碼）
  // 不在「剛好等於 maxLen」時觸發，避免誤切國家
  if (!userPickedCountry.value && digits.length > selected.value.maxLen) {
    const result = tryAutoDetect(digits)
    if (result) {
      selected.value = result.country
      digits = result.digits
    }
  }

  digits = digits.slice(0, selected.value.maxLen)
  rawDigits.value = digits
  if (e.target.value !== digits) e.target.value = digits

  const e164 = selected.value.dial + rawDigits.value
  emit('update:modelValue', rawDigits.value || '')
  emit('valid', { isValid: rawDigits.value.length === selected.value.maxLen, e164 })
}

function select(c) {
  selected.value = c
  showDrop.value = false
  userPickedCountry.value = true  // 鎖定，不再自動切換
  rawDigits.value = rawDigits.value.slice(0, c.maxLen)
  inputRef.value?.focus()
  const e164 = c.dial + rawDigits.value
  emit('valid', { isValid: rawDigits.value.length >= 6, e164 })
}

function clearPhone() {
  rawDigits.value = ''
  userPickedCountry.value = false  // 清除後恢復自動偵測
  emit('update:modelValue', '')
  emit('valid', { isValid: false, e164: '' })
  inputRef.value?.focus()
}

onMounted(() => {
  inputRef.value?.focus()
  // 初始值帶入時，主動 emit 一次 valid 狀態
  if (rawDigits.value) {
    const e164 = selected.value.dial + rawDigits.value
    emit('valid', { isValid: rawDigits.value.length === selected.value.maxLen, e164 })
  }
})
</script>

<style scoped>
.phone-wrap {
  display: flex;
  align-items: center;
  border-radius: var(--radius);
  background: var(--surface2);
  border: 1.5px solid var(--border);
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}
.phone-wrap.focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(45,71,232,0.15);
}
.cc-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 10px 10px;
  border-right: 1.5px solid var(--border);
  cursor: pointer; flex-shrink: 0;
  user-select: none;
}
.cc-flag { width: 24px; height: 18px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.cc-dial { font-size: 13px; font-weight: 600; color: var(--text); }
.cc-arrow { font-size: 9px; color: var(--text-muted); }
.cc-drop {
  position: absolute; top: calc(100% + 4px); left: 0;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 10px; z-index: 200; min-width: 180px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
}
.cc-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px; cursor: pointer; font-size: 14px;
  transition: background 0.15s;
  user-select: none;
}
.cc-item:hover, .cc-item.active { background: var(--surface2); }
.cc-item-name { flex: 1; color: var(--text); }
.cc-item-dial { color: var(--text-muted); font-size: 12px; }
.phone-input {
  flex: 1; border: none; background: transparent;
  color: var(--text); font-size: 15px;
  font-family: 'Noto Sans TC', sans-serif;
  padding: 10px 14px; outline: none; min-width: 0;
}
.phone-input::placeholder { color: var(--text-muted, #9CA3AF); }
[data-elder="true"] .phone-input { font-size: 18px; }
[data-elder="true"] .cc-dial     { font-size: 16px; }

/* 清除按鈕 — 垂直置中在輸入框右側內部 */
.phone-clear {
  flex-shrink: 0;
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(128,128,128,0.18);
  color: var(--text-muted);
  font-size: 10px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  margin-right: 10px;
  transition: background 0.2s, color 0.2s;
}
.phone-clear:hover { background: var(--scam, #ff2d2d); color: #fff; }
</style>
