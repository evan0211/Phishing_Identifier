<template>
  <svg class="app-icon" :width="size || 22" :height="size || 22" :style="size ? { fontSize: size + 'px' } : undefined" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="name === 'phone'"><path d="m5 3 4 1 1 5-3 2c1.5 3 3 4.5 6 6l2-3 5 1 1 4c-1 5-9 1-13-3S0 4 5 3Z" /></template>
    <template v-else-if="name === 'folder'"><path d="M3 5h7l2 3h9v12H3V5Z" /></template>
    <template v-else-if="name === 'upload'"><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></template>
    <template v-else-if="name === 'megaphone'"><path d="M3 10v5h5l12 5V4L8 10H3Zm4 5 2 6h4l-2-5" /></template>
    <template v-else-if="name === 'card'"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></template>
    <template v-else-if="name === 'identity'"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="10" r="2" /><path d="M5 16c0-4 6-4 6 0m3-7h4m-4 4h4" /></template>
    <template v-else-if="name === 'wallet'"><path d="M20 7H5a2 2 0 0 1 0-4h13v4m2 0v14H5a2 2 0 0 1-2-2V5m17 7h-5v5h5m-3-2.5h.01" /></template>
    <template v-else-if="name === 'bank'"><path d="m2 8 10-5 10 5H2Zm3 3v7m7-7v7m7-7v7M2 21h20M3 18h18" /></template>
    <template v-else-if="name === 'users'"><circle cx="9" cy="7" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 6" /></template>
    <template v-else-if="name === 'unlock'"><path d="M8 10V6a4 4 0 0 1 8 0" /><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M12 14v3" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></template>
    <template v-else-if="name === 'calendar'"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 5h2m4 0h2" /></template>
    <template v-else-if="name === 'trophy'"><path d="M8 3h8v8a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 3v6m-5 0h10" /></template>
    <template v-else-if="name === 'bell-off'"><path d="M4 4l16 16M9 4a6 6 0 0 1 9 5v5l3 3h-5M6 8v6l-3 3h8m-1 3h4" /></template>
    <template v-else-if="name === 'info' || name === 'help'"><circle cx="12" cy="12" r="9" /><path v-if="name === 'info'" d="M12 10v7m0-10h.01" /><path v-else d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 4h.01" /></template>
    <template v-else-if="name === 'close'"><path d="m6 6 12 12M6 18 18 6" /></template>
    <template v-else-if="name === 'shield'"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></template>
    <template v-else-if="name === 'edit'"><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" /></template>
    <template v-else-if="name === 'camera'"><path d="M3 7h4l2-3h6l2 3h4v13H3V7Z" /><circle cx="12" cy="13" r="4" /></template>
    <template v-else-if="name === 'globe'"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></template>
    <template v-else-if="name === 'settings'"><circle cx="12" cy="12" r="3" /><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z" /></template>
    <template v-else-if="name === 'link'"><path d="m10 8 3-3a4 4 0 0 1 6 6l-3 3m-2 2-3 3a4 4 0 0 1-6-6l3-3m1 5 6-6" /></template>
    <template v-else-if="name === 'chart'"><path d="M4 3v17h17M8 15l4-5 4 2 5-7" /></template>
    <template v-else-if="name === 'alert'"><path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01" /></template>
    <template v-else-if="name === 'block'"><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></template>
    <template v-else-if="name === 'clipboard'"><path d="M9 5H5v16h14V5h-4M9 3h6v4H9V3Zm0 9h6m-6 4h6" /></template>
    <template v-else-if="name === 'sparkles'"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></template>
    <template v-else-if="name === 'target'"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></template>
    <template v-else-if="name === 'check'"><path d="m5 12 4 4L20 5" /></template>
    <template v-else-if="name === 'search'">
      <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" />
    </template>
    <template v-else-if="name === 'accessibility'">
      <circle cx="12" cy="4" r="2" /><path d="M4 9h16M12 7v7m0 0-5 7m5-7 5 7" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </template>
    <template v-else-if="name === 'volume'">
      <path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </template>
    <template v-else-if="name === 'tour'">
      <path d="m3 9 9-5 9 5-9 5-9-5Zm4 3v5c3 3 7 3 10 0v-5m4-3v7" />
    </template>
  </svg>
</template>

<script setup>
defineProps({ name: { type: String, required: true }, size: { type: Number, default: null } })
</script>

<style scoped>
.app-icon { display:inline-block; width:1em; height:1em; flex-shrink:0; vertical-align:middle; }
</style>
