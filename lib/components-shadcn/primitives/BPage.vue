<template>
  <div
    class="flex justify-center items-center min-h-screen w-full bg-cover bg-center bg-no-repeat"
  >
    <div
      v-if="!hideContent"
      :class="
        cn(
          'p-6 pt-4',
          !hideGlass &&
            'backdrop-blur-md bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-lg',
          'min-w-[600px] max-w-full'
        )
      "
      :style="panelStyle"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { cn } from "../utils";

const props = defineProps({
  panelStyle: {
    type: String,
    required: false,
  },
  hideContent: {
    type: Boolean,
    required: false,
    default: false,
  },
  hideGlass: {
    type: Boolean,
    required: false,
    default: false,
  },
});
</script>

<style scoped>
@media (max-width: 600px) {
  .min-w-\[600px\] {
    min-width: 100%;
  }
}
</style>
