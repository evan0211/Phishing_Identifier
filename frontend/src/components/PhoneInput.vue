<template>
  <div class="phone-input-wrap" :class="{ focused: isFocused, invalid: !isValid && modelValue }">
    <VueTelInput
      v-model="phoneNumber"
      defaultCountry="TW"
      :preferred-countries="['TW', 'CN', 'HK', 'US', 'JP']"
      :input-options="inputOptions"
      :dropdown-options="dropdownOptions"
      @on-input="onInput"
      @on-country-changed="onCountryChanged"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isElder: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'valid'])

const phoneNumber = ref(props.modelValue)
const isFocused = ref(false)
const isValid = ref(false)
const e164Number = ref('')
const selectedFlag = ref('🇹🇼')

const inputOptions = {
  placeholder: '請輸入電話號碼',
  'aria-label': '電話號碼輸入'
}

const dropdownOptions = {
  ariaLabel: '選擇國碼',
  showFlags: true,
  showDialCodeInSelection: true,
  showSearchBox: false
}

watch(() => props.modelValue, (val) => {
  if (val !== phoneNumber.value) {
    phoneNumber.value = val
  }
})

function onInput(number, phoneObject) {
  emit('update:modelValue', number)
  isValid.value = phoneObject.valid ?? false
  e164Number.value = phoneObject.number ?? ''
  emit('valid', { isValid: isValid.value, e164: e164Number.value })
}

function onCountryChanged(countryObject) {
  // vue-tel-input will auto re-validate and trigger on-input
  if (countryObject?.emoji) {
    selectedFlag.value = countryObject.emoji
  }
}
</script>

<style scoped>
.phone-input-wrap {
  width: 100%;
  border-radius: var(--radius);
  background: var(--surface2);
  border: 1.5px solid var(--border);
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* Override vue-tel-input default styles */
.phone-input-wrap :deep(.vue-tel-input) {
  border: none;
  border-radius: var(--radius);
  background: var(--surface2);
  box-shadow: none;
  font-family: 'Noto Sans TC', sans-serif;
}

.phone-input-wrap :deep(.vti__dropdown) {
  background: var(--surface2);
  border-right: 1.5px solid var(--border);
  border-radius: var(--radius) 0 0 var(--radius);
  color: var(--text);
  padding: 0 10px;
}

.phone-input-wrap :deep(.vti__dropdown:hover),
.phone-input-wrap :deep(.vti__dropdown.open) {
  background: var(--surface2);
}

.phone-input-wrap :deep(.vti__dropdown-list) {
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  z-index: 100;
}

.phone-input-wrap :deep(.vti__dropdown-item:hover),
.phone-input-wrap :deep(.vti__dropdown-item.highlighted) {
  background: var(--primary-light, #E8ECFF);
  color: var(--text);
}

.phone-input-wrap :deep(.vti__input) {
  background: var(--surface2);
  color: var(--text);
  border: none;
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 1rem;
  padding: 10px 14px;
  outline: none;
}

.phone-input-wrap :deep(.vti__input::placeholder) {
  color: var(--text-muted, #9CA3AF);
}

/* Focus state */
.phone-input-wrap.focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(45, 71, 232, 0.15);
}

.phone-input-wrap.focused :deep(.vue-tel-input) {
  border-color: transparent;
}

/* Invalid state */
.phone-input-wrap.invalid {
  border-color: var(--scam);
  box-shadow: 0 0 0 3px rgba(255, 45, 45, 0.12);
}

.phone-input-wrap.invalid :deep(.vue-tel-input) {
  border-color: transparent;
}

/* Elder mode */
[data-elder="true"] .phone-input-wrap :deep(.vti__input) {
  font-size: 18px;
}

[data-elder="true"] .phone-input-wrap :deep(.vti__dropdown) {
  font-size: 18px;
}

/* Responsive layout */
@media (max-width: 640px) {
  .phone-input-wrap :deep(.vue-tel-input) {
    flex-direction: row;
    flex-wrap: nowrap;
  }

  .phone-input-wrap :deep(.vti__dropdown) {
    min-width: 60px;
    flex-shrink: 0;
  }

  .phone-input-wrap :deep(.vti__input) {
    min-width: 0;
    flex: 1;
    font-size: 16px; /* prevent iOS zoom */
  }
}
</style>
