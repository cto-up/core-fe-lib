<script setup lang="ts">
import { computed } from "vue";
import * as icons from "lucide-vue-next";

type IconsType = Record<string, any>;

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

const toPascalCase = (name: string) =>
  name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

const icon = computed(() => {
  const key = /[a-z][A-Z]/.test(props.name)
    ? props.name
    : toPascalCase(props.name);
  return (icons as IconsType)[key];
});
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
