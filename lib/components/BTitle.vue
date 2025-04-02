<template>
  <div class="title">{{ modelValue }}</div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: String,
});
</script>

<style type="scss" scoped>
.title {
  background-color: primary;
  letter-spacing: 0.01em;
  font-family: 'Roboto', '-apple-system', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;
  font-weight: 300;
  font-size: 1.5rem;
}
</style>
