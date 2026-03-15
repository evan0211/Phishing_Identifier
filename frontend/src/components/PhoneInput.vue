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
const rawDigits = ref(props.initialValue.replace(/\D/g, '') || '')
const isFocused = ref(false)
const showDrop  = ref(false)
const inputRef  = ref(null)

// 不做格式化，直接顯示原始數字
const display = computed(() => rawDigits.value)

function onInput(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, selected.value.maxLen)
  rawDigits.value = digits
  // 若有非數字字元被過濾，強制更新顯示
  if (e.target.value !== digits) {
    e.target.value = digits
  }
  const e164 = selected.value.dial + rawDigits.value
  emit('update:modelValue', rawDigits.value || '')
  emit('valid', { isValid: rawDigits.value.length >= 6, e164 })
}

function select(c) {
  selected.value = c
  showDrop.value = false
  // 切換國家時截斷超長號碼
  rawDigits.value = rawDigits.value.slice(0, c.maxLen)
  inputRef.value?.focus()
  const e164 = c.dial + rawDigits.value
  emit('valid', { isValid: rawDigits.value.length >= 6, e164 })
}

onMounted(() => {
  inputRef.value?.focus()
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
</style>
