<script setup lang="ts">
import { ref } from "vue";
import { Check, CircleAlert, TriangleAlert } from "lucide-vue-next";
import { useToast } from "./use-toast";
import Toast from "./Toast.vue";
import ToastTitle from "./ToastTitle.vue";
import ToastDescription from "./ToastDescription.vue";
import ToastClose from "./ToastClose.vue";

const { toasts, dismiss } = useToast();

// With the solid fill gone, the icon is what carries severity at a glance.
const ICONS = {
  fault: CircleAlert,
  warning: TriangleAlert,
  destructive: TriangleAlert,
} as const;

// Which reference chip was just copied, so the confirmation is per-toast.
const copiedId = ref<string | null>(null);

async function copyReference(id: string, reference: string) {
  try {
    await navigator.clipboard.writeText(reference);
    copiedId.value = id;
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null;
    }, 1500);
  } catch {
    // Clipboard denied — the reference is still on screen to read out.
  }
}
</script>

<template>
  <Teleport to="body">
    <!--
      pointer-events-none on the VIEWPORT (toasts themselves keep
      pointer-events-auto) so the empty/padded container never swallows taps.
      Without it, this fixed top-0 z-[100] full-width bar sits ON TOP of the
      z-40 app header and its p-4 padding blocks the top of the header buttons —
      the cause of "have to tap the header buttons several times" on mobile.
      On mobile it also sits at top-16 (below the h-16 header) so a *visible*
      toast never overlaps the header either; desktop is unchanged (bottom-right).
    -->
    <div
      class="pointer-events-none fixed top-16 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col-reverse gap-2 sm:flex-col"
      >
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :variant="toast.variant"
          :class="toast.action || toast.reference ? 'items-start' : undefined"
        >
          <component
            :is="ICONS[toast.variant as keyof typeof ICONS]"
            v-if="toast.variant && toast.variant in ICONS"
            class="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <div class="grid flex-1 gap-1">
            <ToastTitle v-if="toast.title">
              {{ toast.title }}
            </ToastTitle>
            <ToastDescription v-if="toast.description">
              {{ toast.description }}
            </ToastDescription>

            <!-- Report affordance + error reference. Styled from currentColor so
                 it stays legible on the destructive, warning and default grounds
                 without knowing which one it is on. -->
            <div
              v-if="toast.action || toast.reference"
              class="mt-2 flex flex-wrap items-center gap-2"
            >
              <button
                v-if="toast.action"
                type="button"
                class="inline-flex h-7 items-center rounded-md border border-current px-2.5 text-xs font-medium opacity-90 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
                @click="toast.action.onClick()"
              >
                {{ toast.action.label }}
              </button>
              <button
                v-if="toast.reference"
                type="button"
                class="inline-flex h-7 items-center rounded-md px-1.5 font-mono text-[11px] opacity-60 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
                :title="toast.reference"
                @click="copyReference(toast.id, toast.reference)"
              >
                <Check v-if="copiedId === toast.id" class="h-3.5 w-3.5" />
                <template v-else>{{ toast.reference }}</template>
              </button>
            </div>
          </div>
          <ToastClose @close="dismiss(toast.id)" />
        </Toast>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
