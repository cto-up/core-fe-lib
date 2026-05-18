import type {
  CarouselApi,
  CarouselContext,
  CarouselEmits,
  CarouselProps,
} from "./interface";
import emblaCarouselVue from "embla-carousel-vue";
import { onMounted, ref, watch } from "vue";

const [emblaNode, emblaApi] = emblaCarouselVue();

const INJECTION_KEY = Symbol("carousel");

export function useProvideCarousel(props: CarouselProps, emits: CarouselEmits) {
  const carouselRef = emblaNode;
  const carouselApi = emblaApi;

  const canScrollPrev = ref(false);
  const canScrollNext = ref(false);
  const orientation = ref(props.orientation || "horizontal");

  function scrollPrev() {
    carouselApi.value?.scrollPrev();
  }

  function scrollNext() {
    carouselApi.value?.scrollNext();
  }

  function onSelect(api: CarouselApi) {
    if (!api) return;

    canScrollPrev.value = api.canScrollPrev();
    canScrollNext.value = api.canScrollNext();
  }

  function watchCarouselApi() {
    if (!carouselApi.value) return;

    onSelect(carouselApi.value);
    carouselApi.value.on("select", onSelect);
    carouselApi.value.on("reInit", onSelect);
  }

  onMounted(() => {
    if (!carouselApi.value) return;

    watchCarouselApi();
    emits("init-api", carouselApi.value);
  });

  watch(carouselApi, () => {
    watchCarouselApi();
  });

  watch(
    () => props.orientation,
    (val) => {
      orientation.value = val || "horizontal";
    }
  );

  const carouselContext: CarouselContext = {
    carouselRef,
    carouselApi,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    orientation,
  };

  return carouselContext;
}

export function useCarousel(): CarouselContext {
  return {
    carouselRef: emblaNode,
    carouselApi: emblaApi,
    canScrollPrev: ref(false),
    canScrollNext: ref(false),
    scrollPrev: () => emblaApi.value?.scrollPrev(),
    scrollNext: () => emblaApi.value?.scrollNext(),
    orientation: ref("horizontal"),
  };
}
