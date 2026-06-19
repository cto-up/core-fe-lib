<template>
  <div>
    <!-- Desktop sidebar -->
    <aside
      v-if="visible"
      class="sidebar transition-all duration-300 h-screen overflow-hidden bg-background fixed top-0 left-0 z-50 hidden lg:block"
      :class="sidebarExpanded ? 'border-r shadow-sm' : ''"
      :style="{ width: `${sidebarWidth}px` }"
    >
      <div class="relative h-full flex flex-col justify-between">
        <!-- Body -->
        <ScrollArea style="height: calc(100vh - 64px)">
          <div class="py-4">
            <slot :expanded="sidebarExpanded" />
          </div>
        </ScrollArea>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="border-t transition-all duration-300 py-4"
          :class="sidebarExpanded ? 'opacity-100' : 'opacity-0'"
        >
          <slot name="footer" :expanded="sidebarExpanded" />
        </div>
      </div>
    </aside>

    <!-- Mobile sidebar (Sheet) -->
    <Sheet
      v-if="visible && isMobile"
      :open="mobileOpen"
      @update:open="$emit('update:mobileOpen', $event)"
    >
      <SheetContent side="left" class="w-80 p-0" :show-close="false">
        <div class="relative h-full flex flex-col justify-between">
          <!-- Body -->
          <ScrollArea style="height: calc(100vh - 64px)">
            <div class="py-4">
              <slot :expanded="true" :is-mobile="true" />
            </div>
          </ScrollArea>
          <div
            v-if="$slots.footer"
            class="border-t transition-all duration-300 py-4"
          >
            <slot name="footer" :expanded="true" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script lang="ts" setup>
import { Sheet, SheetContent } from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";

/**
 * Generic sidebar shell — desktop fixed + mobile Sheet variants.
 *
 * The consumer controls visibility (e.g. only logged-in users) and supplies the
 * section list via the default slot. The desktop variant has no header bar —
 * nav sections start at the top and the expand/collapse control lives in the
 * app navbar. The mobile Sheet keeps a header (branding + close) via the
 * `mobileHeader` slot.
 *
 *   <AppSidebar
 *     :visible="userStore.isLogged"
 *     :sidebar-width="appStore.wrapperLeftOffset"
 *     :sidebar-expanded="appStore.sidebarExpand"
 *     :is-mobile="isMobile"
 *     v-model:mobile-open="mobileSidebarOpen"
 *   >
 *     <template #default="{ expanded }">
 *       <AppSidebarSection ... />
 *     </template>
 *     <template #footer><span>v1.0</span></template>
 *   </AppSidebar>
 */
defineProps<{
  visible: boolean;
  sidebarWidth: number;
  sidebarExpanded: boolean;
  isMobile?: boolean;
  mobileOpen?: boolean;
}>();

defineEmits<{
  "update:mobileOpen": [value: boolean];
}>();
</script>
