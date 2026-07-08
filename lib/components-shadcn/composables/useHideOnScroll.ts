import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

export interface HideOnScrollOptions {
  /**
   * When truthy the bar is forced visible and scroll is ignored — pass the
   * "desktop OR an overlay/drawer is open" condition here. Flipping it to true
   * snaps the bar back immediately (a user opening a drawer wants the header).
   */
  disabled?: Ref<boolean>;
  /**
   * Minimum scroll offset before hiding is allowed. Below this the bar is always
   * shown, so it stays "docked" at the top and tiny scrolls never hide it.
   */
  threshold?: number;
  /**
   * Dead zone: ignore direction changes smaller than this many pixels. Absorbs
   * jitter and iOS rubber-band overscroll so the bar doesn't flicker.
   */
  delta?: number;
}

/**
 * Material-style "scrolling app bar": hide on scroll DOWN past a threshold,
 * reveal IMMEDIATELY on any scroll UP, always show near the top. Returns a
 * reactive `collapsed` flag the header binds to a `translateY(-100%)`.
 *
 * IMPORTANT: it listens in the CAPTURE phase on `window`, not for `window`'s own
 * scroll. The app scrolls an inner element (a Radix `ScrollArea` viewport with
 * `overflow: scroll`), so `window.scrollY` never changes and a plain window
 * listener would never fire. `scroll` events don't bubble, but a capturing
 * listener on `window` still receives them from any descendant scroller; the
 * offset is then read from the event target. Motion is the consumer's job (a CSS
 * transform + `motion-reduce` guard) — this only decides shown/hidden.
 */
export function useHideOnScroll(options: HideOnScrollOptions = {}) {
  const { disabled, threshold = 72, delta = 6 } = options;

  /** True when the bar should be translated out of view. */
  const collapsed = ref(false);

  let lastY = 0;
  let lastTarget: EventTarget | null = null;
  let ticking = false;

  const scrollTopOf = (target: EventTarget | null): number => {
    if (!target || target === window || target === document) {
      return window.scrollY || document.documentElement.scrollTop || 0;
    }
    return (target as HTMLElement).scrollTop || 0;
  };

  const update = (target: EventTarget | null) => {
    ticking = false;
    const y = scrollTopOf(target);

    // Switching between two DIFFERENT scrollers (a horizontal code block, a
    // dropdown list, …) — re-anchor to the new one without acting, so an
    // incomparable position never produces a spurious hide/reveal. Note the
    // `lastTarget !== null` guard: on the very first gesture we act normally
    // against the top-of-page anchor (lastY = 0) instead of wasting it.
    if (lastTarget !== null && target !== lastTarget) {
      lastTarget = target;
      lastY = y;
      return;
    }
    lastTarget = target;

    // Forced-visible (desktop / open drawer) or docked near the top.
    if (disabled?.value || y <= threshold) {
      collapsed.value = false;
      lastY = y;
      return;
    }

    const diff = y - lastY;
    if (Math.abs(diff) < delta) return; // micro-scroll — leave state as-is
    collapsed.value = diff > 0; // down hides, up reveals
    lastY = y;
  };

  const onScroll = (e: Event) => {
    const target = e.target;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => update(target));
  };

  // Opening a drawer/overlay must reveal the bar at once, not on the next scroll.
  if (disabled) {
    watch(disabled, (d) => {
      if (d) collapsed.value = false;
    });
  }

  onMounted(() => {
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
  });
  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll, { capture: true });
  });

  return { collapsed };
}
