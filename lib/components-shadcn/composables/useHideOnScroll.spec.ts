import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useHideOnScroll } from "./useHideOnScroll";

const LONG = 2000;
const SHOWN = 700;
/** What the pane reclaims once the bar slides away — the layout's 4rem. */
const RECLAIMED = 64;

/**
 * A pane that scrolls INTERNALLY and fills the viewport: hiding the bar makes
 * it taller, so a pane sitting at its end has its `scrollTop` clamped back by
 * the reclaimed strip — the browser behaviour the flicker fed on.
 */
function pane(collapsed: () => boolean, content: number) {
  const el = document.createElement("div");
  let raw = 0;
  const view = () => SHOWN + (collapsed() ? RECLAIMED : 0);
  Object.defineProperty(el, "scrollHeight", { get: () => content });
  Object.defineProperty(el, "clientHeight", { get: () => view() });
  Object.defineProperty(el, "scrollTop", {
    get: () => Math.min(raw, content - view()),
    set: (v: number) => {
      raw = v;
    },
  });
  document.body.appendChild(el);
  return el;
}

function host(content = LONG) {
  const Host = defineComponent({
    setup(_, { expose }) {
      expose({ hidden: useHideOnScroll().collapsed });
      return () => h("div");
    },
  });
  const wrapper = mount(Host);
  const hide = () => wrapper.vm.hidden as boolean;
  const el = pane(hide, content);
  const scroll = async (to?: number) => {
    if (to !== undefined) el.scrollTop = to;
    el.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  };
  return { hide, el, scroll, unmount: () => wrapper.unmount() };
}

describe("useHideOnScroll", () => {
  it("hides on the way down and reveals on the way up", async () => {
    const w = host();
    await w.scroll(400);
    expect(w.hide()).toBe(true);
    await w.scroll(200);
    expect(w.hide()).toBe(false);
    w.unmount();
  });

  it("stays docked near the top", async () => {
    const w = host();
    await w.scroll(40);
    expect(w.hide()).toBe(false);
    w.unmount();
  });

  it("stays hidden when its own collapse clamps a pane at the end", async () => {
    const w = host();
    await w.scroll(LONG - SHOWN); // fling to the foot of the lesson
    expect(w.hide()).toBe(true);

    // The pane just grew by the reclaimed strip, so the browser pulls
    // `scrollTop` up and fires a scroll — the event that used to read as a
    // flick up, reveal the bar, re-shrink the pane, and flicker.
    await w.scroll();
    expect(w.hide()).toBe(true);
    w.unmount();
  });

  // A pane only a little taller than the viewport clamps back INSIDE the
  // threshold, where re-docking would hand the strip straight back.
  it("stays hidden when the clamp lands back near the top", async () => {
    const w = host(SHOWN + 100);
    await w.scroll(100);
    expect(w.hide()).toBe(true);

    await w.scroll(); // clamped to 36 — under the 72px dock threshold
    expect(w.hide()).toBe(true);
    w.unmount();
  });

  it("still reveals when the reader leaves the end", async () => {
    const w = host();
    await w.scroll(LONG - SHOWN);
    await w.scroll();
    expect(w.hide()).toBe(true);

    await w.scroll(LONG - SHOWN - 300);
    expect(w.hide()).toBe(false);
    w.unmount();
  });
});
