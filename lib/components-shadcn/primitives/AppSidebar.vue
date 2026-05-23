<template>
  <div>
    <!-- Desktop sidebar -->
    <aside
      v-if="visible"
      class="sidebar transition-all duration-300 h-screen overflow-hidden bg-background border-r fixed top-0 left-0 z-50 hidden lg:block shadow-sm"
      :style="{ width: `${sidebarWidth}px` }"
    >
      <div class="relative h-full flex flex-col justify-between">
        <div>
          <!-- Header -->
          <div
            class="px-4 h-16 flex items-center justify-between border-b bg-header-background/80 fixed z-10"
            :style="{ width: `${sidebarWidth}px` }"
          >
            <slot name="header" :expanded="sidebarExpanded" />
            <Button
              variant="ghost"
              class="p-[6px] w-8 h-8 transition-all duration-200 bg-transparent"
              :title="toggleLabel"
              @click="$emit('toggle-sidebar')"
            >
              <ChevronLeft
                class="h-4 w-4 transition-all duration-500"
                :class="!sidebarExpanded && 'rotate-180'"
              />
            </Button>
          </div>

          <!-- Body -->
          <ScrollArea style="height: calc(100vh - 128px); margin-top: 64px">
            <div class="py-4">
              <slot :expanded="sidebarExpanded" />
            </div>
          </ScrollArea>
        </div>

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
          <div>
            <div
              class="px-4 h-16 flex items-center justify-between border-b bg-header-background/80"
            >
              <slot
                name="mobileHeader"
                :on-close="() => $emit('update:mobileOpen', false)"
              >
                <slot name="header" :expanded="true" />
              </slot>
            </div>
            <ScrollArea style="height: calc(100vh - 128px)">
              <div class="py-4">
                <slot :expanded="true" :is-mobile="true" />
              </div>
            </ScrollArea>
          </div>
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
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-vue-next";

/**
 * Generic sidebar shell — desktop fixed + mobile Sheet variants.
 *
 * The consumer controls visibility (e.g. only logged-in users), supplies the
 * header content and section list via slots, and wires the toggle handlers.
 *
 *   <AppSidebar
 *     :visible="userStore.isLogged"
 *     :sidebar-width="appStore.wrapperLeftOffset"
 *     :sidebar-expanded="appStore.sidebarExpand"
 *     :is-mobile="isMobile"
 *     v-model:mobile-open="mobileSidebarOpen"
 *     @toggle-sidebar="appStore.toggleSidebar"
 *   >
 *     <template #header><h2>My App</h2></template>
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
  toggleLabel?: string;
}>();

defineEmits<{
  "toggle-sidebar": [];
  "update:mobileOpen": [value: boolean];
}>();
</script>
