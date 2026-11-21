<template>
  <Teleport to="body">
    <div
      v-if="state.open"
      class="fixed z-[80] max-h-72 w-64 overflow-y-auto rounded-lg border bg-popover p-1 text-sm shadow-ambient"
      :style="{ top: `${state.y}px`, left: `${state.x}px` }"
      role="listbox"
      data-test="slash-menu"
    >
      <template v-for="(it, i) in state.hits" :key="it.key">
        <div
          v-if="it.group && it.group !== state.hits[i - 1]?.group"
          class="px-2 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70"
          role="presentation"
        >
          {{ it.group }}
        </div>
        <button
          type="button"
          role="option"
          :aria-selected="i === state.active"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
          :class="i === state.active ? 'bg-accent text-accent-foreground' : ''"
          :data-test="`slash-item-${it.key}`"
          @mousedown.prevent="emit('choose', it)"
          @mouseenter="emit('hover', i)"
        >
          <component
            :is="it.icon"
            v-if="it.icon"
            class="h-4 w-4 shrink-0 text-muted-foreground"
          />
          <span class="flex-1 truncate">{{ it.label }}</span>
        </button>
      </template>
      <p v-if="!state.hits.length" class="px-2 py-1.5 text-muted-foreground">
        {{ t("editor.slash.none") }}
      </p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SlashItem } from "./slash";

defineProps<{
  state: {
    open: boolean;
    x: number;
    y: number;
    active: number;
    hits: SlashItem[];
  };
}>();
const emit = defineEmits<{
  choose: [item: SlashItem];
  hover: [index: number];
}>();
const { t } = useI18n();
</script>
