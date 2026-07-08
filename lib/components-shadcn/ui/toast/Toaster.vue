<script setup lang="ts">
import { useToast } from "./use-toast";
import Toast from "./Toast.vue";
import ToastTitle from "./ToastTitle.vue";
import ToastDescription from "./ToastDescription.vue";
import ToastClose from "./ToastClose.vue";

const { toasts, dismiss } = useToast();
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
        <Toast v-for="toast in toasts" :key="toast.id" :variant="toast.variant">
          <div class="grid gap-1">
            <ToastTitle v-if="toast.title">
              {{ toast.title }}
            </ToastTitle>
            <ToastDescription v-if="toast.description">
              {{ toast.description }}
            </ToastDescription>
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
