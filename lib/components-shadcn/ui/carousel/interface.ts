import type {
  EmblaCarouselType as CarouselApi,
  EmblaOptionsType as CarouselOptions,
  EmblaPluginType as CarouselPlugin,
} from "embla-carousel";
import type { HTMLAttributes, Ref } from "vue";

export interface CarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin[];
  orientation?: "horizontal" | "vertical";
}

export interface CarouselEmits {
  (e: "init-api", api: CarouselApi): void;
}

export interface WithClassAsProps {
  class?: HTMLAttributes["class"];
}

export interface CarouselContext {
  carouselRef: Ref<HTMLElement | undefined>;
  carouselApi: Ref<CarouselApi | undefined>;
  canScrollPrev: Ref<boolean>;
  canScrollNext: Ref<boolean>;
  scrollPrev: () => void;
  scrollNext: () => void;
  orientation: Ref<"horizontal" | "vertical">;
}

export type { CarouselApi };
