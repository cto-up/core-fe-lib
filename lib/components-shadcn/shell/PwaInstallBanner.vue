<script setup lang="ts">
// "Install this app" prompt shared by every app shell. Same placement rules as
// PwaUpdateBanner: teleported above every in-app overlay, clickable over a
// radix modal, draggable aside, and it shares that banner's slot. The install
// state lives in each app's boot/pwa.ts, hence `open` + an event; the caller
// closes it while an update is pending, so the two never stack.
//
// Answering it either way is remembered, so it does not nag on every visit.
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Download, GripVertical, X } from "lucide-vue-next";
import { Button } from "../ui/button";
import { useDraggableFloat } from "../composables/useDraggableFloat";
import { pwaPromptPosition } from "./pwa-prompt-slot";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ install: [] }>();

const { t } = useI18n();
const {
  el: bannerEl,
  style: bannerStyle,
  startDrag,
} = useDraggableFloat(pwaPromptPosition);

const DISMISS_KEY = "pwa:install-dismissed";
function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}
const dismissed = ref(readDismissed());

function dismiss() {
  dismissed.value = true;
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode — the banner just reappears next session */
  }
}
function install() {
  emit("install");
  dismiss();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pwa-slide-up">
      <div
        v-if="open && !dismissed"
        ref="bannerEl"
        class="pointer-events-auto fixed bottom-4 left-1/2 z-[2147483000] flex -translate-x-1/2 cursor-grab touch-none select-none items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-ambient active:cursor-grabbing"
        :style="bannerStyle"
        role="status"
        @pointerdown="startDrag"
      >
        <GripVertical class="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <Download class="h-4 w-4 shrink-0 text-primary" />
        <span class="text-sm">{{ t("pwa.install.prompt") }}</span>
        <Button size="sm" class="cursor-pointer" @click="install">{{
          t("pwa.install.action")
        }}</Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 cursor-pointer"
          :aria-label="t('pwa.install.dismiss')"
          @click="dismiss"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
