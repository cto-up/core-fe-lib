<!--
  RoleSwatches — pick a colour ROLE, shown as a swatch painted in the current
  theme and labelled by meaning (Main, Second, Text…), never by value.
-->
<template>
  <div class="flex flex-wrap gap-1" role="radiogroup">
    <button
      type="button"
      role="radio"
      class="inline-flex h-11 w-11 items-center justify-center rounded-md border sm:h-9 sm:w-9"
      :class="value === 'none' ? 'ring-2 ring-ring' : ''"
      :aria-checked="value === 'none'"
      :aria-label="noneLabel"
      :title="noneLabel"
      @click="emit('pick', 'none')"
    >
      <Ban class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
    <button
      v-for="role in SVG_ROLES"
      :key="role"
      type="button"
      role="radio"
      class="inline-flex h-11 w-11 items-center justify-center rounded-md border sm:h-9 sm:w-9"
      :class="value === role ? 'ring-2 ring-ring' : ''"
      :aria-checked="value === role"
      :aria-label="labels[role]"
      :title="labels[role]"
      @click="emit('pick', role)"
    >
      <svg viewBox="0 0 20 20" class="h-6 w-6" aria-hidden="true">
        <rect width="20" height="20" rx="4" :class="`t-fill-${role}`" />
      </svg>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { Ban } from "lucide-vue-next";
import { SVG_ROLES, type SvgRole } from "../svgTheme";

defineProps<{
  value: SvgRole | "none" | null;
  labels: Record<SvgRole, string>;
  noneLabel: string;
  /** The designer's scope selector: swatches render inside it so roles resolve. */
  scope?: string;
}>();

const emit = defineEmits<{ pick: [role: SvgRole | "none"] }>();
</script>
