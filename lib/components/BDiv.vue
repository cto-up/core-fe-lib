<template>
  <div :class="[divClass]" :style="divStyle">
    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { computed } from 'vue';

// Props
const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    default: '',
  },
});

// Quasar's dark mode functionality
const $q = useQuasar();

// Watch for dark mode changes and update the text color accordingly
const divStyle = computed(() => ({
  color: $q.dark.isActive ? '#fff' : '#000', // Set white text in dark mode, black in light mode
}));

// Pass class prop to use in the template
const divClass = ref(props.class);
</script>

<style scoped></style>
