<template>
  <router-view />
  <TTSToggle />
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'
import TTSToggle from './components/TTSToggle.vue'
useTheme()
</script>
