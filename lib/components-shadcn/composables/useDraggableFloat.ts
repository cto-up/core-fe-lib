import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from "vue";

const MARGIN = 8;

function clampToViewport(x: number, y: number, w: number, h: number) {
  const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);
  return {
    x: Math.min(Math.max(x, MARGIN), maxX),
    y: Math.min(Math.max(y, MARGIN), maxY),
  };
}

// Lets the user push a fixed-position floating element (a banner) aside by
// dragging it. Until the first drag it keeps its CSS placement; afterwards it
// sits at explicit coordinates, clamped inside the viewport on resize.
// Pointer-downs on a button are ignored so its click still lands. Floats that
// take turns in one slot pass the same `pos`, so the next one opens where the
// user left the last.
export type FloatPosition = { x: number; y: number } | null;

export function useDraggableFloat(pos: Ref<FloatPosition> = ref(null)) {
  const el = ref<HTMLElement | null>(null);

  const style = computed(() =>
    pos.value
      ? {
          left: `${pos.value.x}px`,
          top: `${pos.value.y}px`,
          bottom: "auto",
          transform: "none",
        }
      : {}
  );

  function startDrag(e: PointerEvent) {
    const node = el.value;
    if (!node) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();

    const rect = node.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    pos.value = { x: rect.left, y: rect.top };
    node.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      pos.value = clampToViewport(
        ev.clientX - offsetX,
        ev.clientY - offsetY,
        rect.width,
        rect.height
      );
    };
    const onStop = () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onStop);
      node.removeEventListener("pointercancel", onStop);
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onStop);
    node.addEventListener("pointercancel", onStop);
  }

  function keepInView() {
    const node = el.value;
    if (!pos.value || !node) return;
    const rect = node.getBoundingClientRect();
    pos.value = clampToViewport(
      pos.value.x,
      pos.value.y,
      rect.width,
      rect.height
    );
  }
  // A float opening at a position another float left may be wider than it was.
  watch(el, (node) => node && keepInView());
  onMounted(() => window.addEventListener("resize", keepInView));
  onBeforeUnmount(() => window.removeEventListener("resize", keepInView));

  return { el, style, startDrag };
}
