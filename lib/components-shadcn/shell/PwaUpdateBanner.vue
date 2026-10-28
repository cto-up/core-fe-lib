<script setup lang="ts">
// "New version — Reload" prompt shared by every app shell. The update state
// lives in each app's boot/pwa.ts (vite-plugin-pwa only exists in the consumer
// build), hence `open` + events instead of importing it.
//
// Teleported to <body> and raised above every in-app overlay (lesson
// presenters, editor toolbars, dialogs) so a new deploy is never announced
// underneath one. `pointer-events-auto` because a radix modal sets
// pointer-events:none on <body>, which this inherits. User-draggable: once it
// floats over arbitrary chrome, the user needs a way to push it aside without
// dismissing it.
import { useI18n } from "vue-i18n";
import { GripVertical, RefreshCw, X } from "lucide-vue-next";
import { Button } from "../ui/button";
import { useDraggableFloat } from "../composables/useDraggableFloat";
import { pwaPromptPosition } from "./pwa-prompt-slot";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ reload: []; dismiss: [] }>();

const { t } = useI18n();
const {
  el: bannerEl,
  style: bannerStyle,
  startDrag,
} = useDraggableFloat(pwaPromptPosition);
</script>

<template>
  <Teleport to="body">
    <Transition name="pwa-slide-up">
      <div
        v-if="open"
        ref="bannerEl"
        class="pointer-events-auto fixed bottom-4 left-1/2 z-[2147483000] flex -translate-x-1/2 cursor-grab touch-none select-none items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-ambient active:cursor-grabbing"
        :style="bannerStyle"
        role="status"
        @pointerdown="startDrag"
      >
        <GripVertical class="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <RefreshCw class="h-4 w-4 shrink-0 text-primary" />
        <span class="text-sm">{{ t("pwa.update.available") }}</span>
        <Button size="sm" class="cursor-pointer" @click="emit('reload')">{{
          t("pwa.update.reload")
        }}</Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 cursor-pointer"
          :aria-label="t('pwa.update.dismiss')"
          @click="emit('dismiss')"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Fade + slide up, keeping the -50% x-centering of the default placement. */
.pwa-slide-up-enter-active,
.pwa-slide-up-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.pwa-slide-up-enter-from,
.pwa-slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.5rem);
}
</style>
