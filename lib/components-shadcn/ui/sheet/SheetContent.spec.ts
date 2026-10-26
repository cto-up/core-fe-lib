import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import Sheet from "./Sheet.vue";
import SheetContent from "./SheetContent.vue";

function open(props: Record<string, unknown> = {}) {
  const Host = defineComponent(
    () => () =>
      h(Sheet, { open: true }, () => h(SheetContent, props, () => "body"))
  );
  return mount(Host, { attachTo: document.body });
}

describe("SheetContent", () => {
  // Opt-in left every sheet in the app without a way out on a phone, where a
  // full-width sheet leaves no overlay to tap.
  it("shows a labelled close button by default", async () => {
    const w = open();
    await nextTick();
    const btn = document.querySelector('[data-testid="sheet-close"]');
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe("actions.close");
    w.unmount();
  });

  it("hides it for a sheet that draws its own", async () => {
    const w = open({ showClose: false });
    await nextTick();
    expect(document.querySelector('[data-testid="sheet-close"]')).toBeNull();
    w.unmount();
  });
});
