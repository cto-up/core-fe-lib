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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { GripVertical, RefreshCw, X } from "lucide-vue-next";
import { Button } from "../ui/button";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ reload: []; dismiss: [] }>();

const { t } = useI18n();

const bannerEl = ref<HTMLElement | null>(null);
// null = the default bottom-centre placement; set once the user drags it.
const bannerPos = ref<{ x: number; y: number } | null>(null);

const bannerStyle = computed(() =>
  bannerPos.value
    ? {
        left: `${bannerPos.value.x}px`,
        top: `${bannerPos.value.y}px`,
        bottom: "auto",
        transform: "none",
      }
    : {}
);

const BANNER_MARGIN = 8;
function clampToViewport(x: number, y: number, w: number, h: number) {
  const maxX = Math.max(BANNER_MARGIN, window.innerWidth - w - BANNER_MARGIN);
  const maxY = Math.max(BANNER_MARGIN, window.innerHeight - h - BANNER_MARGIN);
  return {
    x: Math.min(Math.max(x, BANNER_MARGIN), maxX),
    y: Math.min(Math.max(y, BANNER_MARGIN), maxY),
  };
}

function startDrag(e: PointerEvent) {
  const el = bannerEl.value;
  if (!el) return;
  // Let the Reload / dismiss buttons keep their click.
  if ((e.target as HTMLElement).closest("button")) return;
  e.preventDefault();

  const rect = el.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  // Switch from the centred default to explicit coordinates before moving.
  bannerPos.value = { x: rect.left, y: rect.top };
  el.setPointerCapture(e.pointerId);

  const onMove = (ev: PointerEvent) => {
    bannerPos.value = clampToViewport(
      ev.clientX - offsetX,
      ev.clientY - offsetY,
      rect.width,
      rect.height
    );
  };
  const onStop = () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onStop);
    el.removeEventListener("pointercancel", onStop);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onStop);
  el.addEventListener("pointercancel", onStop);
}

function keepInView() {
  const el = bannerEl.value;
  if (!bannerPos.value || !el) return;
  const rect = el.getBoundingClientRect();
  bannerPos.value = clampToViewport(
    bannerPos.value.x,
    bannerPos.value.y,
    rect.width,
    rect.height
  );
}
onMounted(() => window.addEventListener("resize", keepInView));
onBeforeUnmount(() => window.removeEventListener("resize", keepInView));
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
