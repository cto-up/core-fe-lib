<template>
  <!-- touch-manipulation removes the ~300ms double-tap-zoom delay so header
       taps register on the first touch (descendants inherit it). -->
  <nav
    class="flex items-center justify-between h-16 border-b fixed z-40 top-0 bg-header-background/80 backdrop-blur-lg transition-all duration-300 px-2 sm:px-4 touch-manipulation"
    :style="{ width: navWidth }"
  >
    <div class="flex items-center gap-4">
      <slot name="left" />
    </div>
    <div class="flex-1 flex items-center justify-center">
      <slot name="center" />
    </div>
    <div class="flex items-center gap-2">
      <slot name="right" />
    </div>
  </nav>
</template>

<script lang="ts" setup>
/**
 * Sticky three-region navbar shell. Renders nothing functional by itself —
 * consumers fill #left (mobile hamburger, home), #center (breadcrumb, search),
 * #right (theme/language toggles, user menu).
 *
 * Width is driven by a prop so the consumer can shrink the bar when a sidebar
 * is open: `:nav-width="sidebarOpen ? 'calc(100% - 280px)' : '100%'"`.
 */
defineProps<{
  navWidth?: string | number;
}>();
</script>
