<template>
  <q-btn
    flat
    round
    :icon="isDarkMode() ? 'dark_mode' : 'light_mode'"
    @click="changeMode()"
  />
</template>

<script setup lang="ts">
import useDarkMode from '../composables/useDarkMode';

const { changeMode, isDarkMode } = useDarkMode();
</script>
