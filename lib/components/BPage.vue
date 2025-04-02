<!-- MyComponent.vue -->
<template>
  <q-page :class="`row justify-center items-center page bg-image`">
    <div
      v-if="!props.hideContent"
      :class="props.hideGlass ? '' : 'glass-panel'"
      :style="props.panelStyle"
    >
      <div class="q-pa-md q-pt-xs">
        <slot></slot>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
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
.page {
  min-width: 600px;
}

@media (max-width: 600px) {
  .page {
    min-width: 100%;
    width: 100%;
  }
}

.q-card {
  width: 360px;
}

.bg-image {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
}
</style>
