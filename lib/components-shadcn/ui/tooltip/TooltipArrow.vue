<script setup lang="ts">
import { TooltipArrow, type TooltipArrowProps } from "radix-vue";

/**
 * The tail that says which element a tooltip belongs to.
 *
 * Without one a hint is a floating box near two things, and radix flips it to
 * whichever side has room — so on a tight list it opens upward and lands over
 * the row above, reading as that row's explanation. The arrow is what makes
 * the anchor visible wherever it ends up.
 */
withDefaults(defineProps<TooltipArrowProps>(), { width: 10, height: 5 });
</script>

<template>
  <TooltipArrow v-bind="$props" class="fill-primary" />
</template>
