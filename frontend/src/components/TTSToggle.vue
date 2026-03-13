<template>
  <!-- 浮動 TTS 開關，固定在右下角 -->
  <div class="tts-widget" :class="{ active: isTTSEnabled }">

    <!-- 狀態泡泡（開啟時顯示） -->
    <transition name="tts-bubble">
      <div class="tts-bubble" v-if="isTTSEnabled">
        <span v-if="isSpeaking" class="bubble-speaking">
          <span class="bubble-dot"></span>
          {{ truncate(currentText) }}
        </span>
        <span v-else class="bubble-idle">
          滑鼠移到文字上即朗讀
        </span>
      </div>
    </transition>

    <!-- 主按鈕 -->
    <button
      class="tts-btn"
      :class="{ speaking: isSpeaking }"
      @click="toggleTTS"
      :aria-label="isTTSEnabled ? '關閉語音朗讀模式' : '開啟語音朗讀模式'"
      :title="isTTSEnabled ? '關閉 TTS' : '開啟 TTS'"
    >
      <!-- 說話中：音波漣漪 -->
      <span v-if="isSpeaking" class="ripple" />
      <span v-if="isSpeaking" class="ripple ripple2" />

      <!-- 喇叭圖示 -->
      <svg class="tts-svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <!-- 開啟：顯示音波線 -->
        <template v-if="isTTSEnabled">
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </template>
        <!-- 關閉：顯示 X -->
        <template v-else>
          <line x1="23" y1="9"  x2="17" y2="15" />
          <line x1="17" y1="9"  x2="23" y2="15" />
        </template>
      </svg>

      <!-- 標籤文字 -->
      <span class="tts-label">{{ isTTSEnabled ? 'TTS ON' : 'TTS' }}</span>
    </button>
  </div>
</template>

<script setup>
import { isTTSEnabled, isSpeaking, currentText, toggleTTS } from '../composables/useVoice.js'

function truncate(text, max = 18) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}
</script>

<style scoped>
/* ── 容器 ──────────────────────────────────────────── */
.tts-widget {
  position: fixed;
  bottom: 28px;
  right: 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 9990;
}

/* ── 主按鈕 ────────────────────────────────────────── */
.tts-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px 10px 14px;
  border-radius: 100px;
  border: 1.5px solid rgba(255,255,255,0.18);
  background: var(--topbar-bg, #1a1f35);
  color: rgba(255,255,255,0.5);
  font-family: 'Noto Sans TC', 'DM Mono', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: var(--shadow-md, 0 4px 28px rgba(0,0,0,0.3));
  transition:
    background  0.25s,
    color       0.25s,
    border-color 0.25s,
    box-shadow  0.25s,
    transform   0.18s;
  position: relative;
  overflow: visible;
  white-space: nowrap;
}

.tts-btn:hover {
  transform: translateY(-2px);
  background: var(--surface2, #232940);
  color: rgba(255,255,255,0.75);
}

/* 開啟 → 主色 */
.tts-widget.active .tts-btn {
  background: var(--primary, #2D47E8);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 24px rgba(45,71,232,0.45);
}
.tts-widget.active .tts-btn:hover {
  background: var(--primary-dark, #1A2FC7);
}

/* 說話中 → 綠色 */
.tts-btn.speaking {
  background: var(--safe, #00C47A) !important;
  border-color: transparent !important;
  box-shadow: 0 6px 24px rgba(0,196,122,0.45) !important;
}

/* ── 漣漪動畫 ───────────────────────────────────────── */
.ripple {
  position: absolute;
  inset: 0;
  border-radius: 100px;
  border: 2px solid rgba(0,196,122,0.5);
  animation: ripple-out 1.4s ease-out infinite;
  pointer-events: none;
}
.ripple2 { animation-delay: 0.7s; }

@keyframes ripple-out {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(1.45); opacity: 0; }
}

/* ── SVG 圖示 ───────────────────────────────────────── */
.tts-svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

/* ── 標籤 ───────────────────────────────────────────── */
.tts-label {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ── 狀態泡泡 ───────────────────────────────────────── */
.tts-bubble {
  background: var(--surface, #1A1F2E);
  border: 1.5px solid var(--border, #2D3557);
  border-radius: 12px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub, #9CA3AF);
  max-width: 200px;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0,0,0,0.2));
}

.bubble-speaking {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--safe-text, #007A4C);
}

[data-theme="dark"] .bubble-speaking {
  color: #4ade80;
}

.bubble-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--safe, #00C47A);
  flex-shrink: 0;
  animation: dot-blink 0.7s step-end infinite;
}

@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── 泡泡出入動畫 ───────────────────────────────────── */
.tts-bubble-enter-active,
.tts-bubble-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.tts-bubble-enter-from,
.tts-bubble-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ── RWD：小螢幕縮小一點 ────────────────────────────── */
@media (max-width: 640px) {
  .tts-widget {
    bottom: 16px;
    right: 16px;
  }
  .tts-label {
    display: none;
  }
  .tts-btn {
    padding: 10px 12px;
    border-radius: 50%;
  }
}
</style>
