import { ref, onUnmounted } from 'vue'
import { locale } from './useLocale.js'

// Returns BCP-47 lang code based on current locale
function getTTSLang() {
  return locale.value === 'en' ? 'en-US' : 'zh-TW'
}
import { useLocale } from './useLocale.js'

// ── 全域共享狀態（跨元件同步） ──────────────────────────────
export const isTTSEnabled = ref(false)
export const isSpeaking   = ref(false)
export const currentText  = ref('')

// ── 基礎朗讀功能 ────────────────────────────────────────────
export function useVoice() {
  const speak = (text, options = {}) => {
    const { lang = getTTSLang(), rate = 0.85, pitch = 1, volume = 1 } = options
    window.speechSynthesis.cancel()
    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang   = lang
      utter.rate   = rate
      utter.pitch  = pitch
      utter.volume = volume
      utter.onstart = () => { isSpeaking.value = true;  currentText.value = text }
      utter.onend   = () => { isSpeaking.value = false }
      utter.onerror = () => { isSpeaking.value = false }
      window.speechSynthesis.speak(utter)
    }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { doSpeak() }
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak() } }
  }

  return { speak }
}

// ── Hover TTS 模式 ──────────────────────────────────────────
let debounceTimer  = null
let lastSpokenEl   = null
const DEBOUNCE_MS  = 280

/**
 * 取元素的直接文字節點（不含子元素，避免重複）
 * fallback 順序：aria-label → placeholder → alt → title
 */
function getDirectText(el) {
  let text = ''
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent
  })
  text = text.trim()
  if (!text) {
    text = el.getAttribute('aria-label')  ||
           el.getAttribute('placeholder') ||
           el.getAttribute('alt')         ||
           el.getAttribute('title')       || ''
  }
  return text.trim()
}

/** 往上找最近有文字的祖先（最多 3 層） */
function findTextTarget(el) {
  let target = el
  for (let i = 0; i < 3; i++) {
    const text = getDirectText(target)
    if (text) return { el: target, text }
    if (!target.parentElement) break
    target = target.parentElement
  }
  return null
}

function speakNow(text, rate = 0.85) {
  window.speechSynthesis.cancel()

  const doSpeak = () => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang   = getTTSLang()
    utter.rate   = rate
    utter.pitch  = 1
    utter.volume = 1
    utter.onstart = () => { isSpeaking.value = true;  currentText.value = text }
    utter.onend   = () => { isSpeaking.value = false }
    utter.onerror = () => { isSpeaking.value = false }
    window.speechSynthesis.speak(utter)
  }

  // 等待 voices 載入（部分瀏覽器需要）
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    doSpeak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      doSpeak()
    }
  }
}

function onMouseOver(e) {
  const result = findTextTarget(e.target)
  if (!result || result.el === lastSpokenEl) return
  lastSpokenEl = result.el
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => speakNow(result.text), DEBOUNCE_MS)
}

function onMouseLeave() {
  clearTimeout(debounceTimer)
  lastSpokenEl = null
}

export function enableTTS() {
  document.addEventListener('mouseover',  onMouseOver)
  document.addEventListener('mouseleave', onMouseLeave, true)
  isTTSEnabled.value = true
}

export function disableTTS() {
  document.removeEventListener('mouseover',  onMouseOver)
  document.removeEventListener('mouseleave', onMouseLeave, true)
  window.speechSynthesis.cancel()
  clearTimeout(debounceTimer)
  lastSpokenEl       = null
  isTTSEnabled.value = false
  isSpeaking.value   = false
  currentText.value  = ''
}

export function toggleTTS() {
  isTTSEnabled.value ? disableTTS() : enableTTS()
}

/** 在元件 unmount 時自動清理（可選） */
export function useHoverTTS() {
  onUnmounted(disableTTS)
  return { isTTSEnabled, isSpeaking, currentText, enableTTS, disableTTS, toggleTTS }
}
