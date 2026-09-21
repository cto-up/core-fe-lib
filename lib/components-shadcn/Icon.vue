<!-- eslint-disable vue/multi-word-component-names --
     Registered globally as <Icon> in hub, lms and care. Renaming it to satisfy
     the rule would rewrite every call site in three apps to buy nothing. -->
<script setup lang="ts">
import { computed } from "vue";
import { resolveIcon } from "./icon-names";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: Number,
  color: String,
  strokeWidth: {
    type: Number,
    default: 1.5,
  },
  defaultClass: String,
});

const icon = computed(() => resolveIcon(props.name));
</script>

<template>
  <component
    :is="icon"
    :size="props.size"
    :color="props.color"
    :stroke-width="props.strokeWidth"
    :class="props.defaultClass"
  />
</template>
