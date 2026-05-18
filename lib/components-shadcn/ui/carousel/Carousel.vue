<script setup lang="ts">
import { useProvideCarousel } from "./useCarousel";
import type {
  CarouselEmits,
  CarouselProps,
  WithClassAsProps,
} from "./interface";
import { cn } from "../../utils";

const props = withDefaults(defineProps<CarouselProps & WithClassAsProps>(), {
  orientation: "horizontal",
});

const emits = defineEmits<CarouselEmits>();

const {
  carouselRef,
  carouselApi,
  canScrollNext,
  canScrollPrev,
  scrollNext,
  scrollPrev,
  orientation,
} = useProvideCarousel(props, emits);

defineExpose({
  carouselApi,
  canScrollNext,
  canScrollPrev,
  scrollNext,
  scrollPrev,
});
</script>

<template>
  <div
    ref="carouselRef"
    :class="cn('relative', props.class)"
    role="region"
    aria-roledescription="carousel"
    v-bind="$attrs"
  >
    <slot
      :can-scroll-next="canScrollNext"
      :can-scroll-prev="canScrollPrev"
      :carousel-ref="carouselRef"
      :carousel-api="carouselApi"
      :scroll-prev="scrollPrev"
      :scroll-next="scrollNext"
      :orientation="orientation"
    />
  </div>
</template>
