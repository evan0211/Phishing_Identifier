<template>
  <router-view />
  <LangToggle />
</template>

<script setup>
import { useTheme } from './composables/useTheme.js'
import LangToggle from './components/LangToggle.vue'
useTheme()
</script>
