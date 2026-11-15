// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import MathEditor from "./MathEditor.vue";
import enMath from "../i18n/en-US/mathEditor";
import enEditor from "../i18n/en-US/editor";
import enActions from "../i18n/en-US/actions";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: {
    "en-US": { mathEditor: enMath, editor: enEditor, actions: enActions },
  },
});

describe("MathEditor", () => {
  it("inserts a fraction from the palette with the cursor in its first box", async () => {
    const w = mount(MathEditor, {
      props: { modelValue: "x = " },
      global: { plugins: [i18n] },
      attachTo: document.body,
    });
    await flushPromises();
    await w.find('[aria-label="Fraction"]').trigger("click");
    await flushPromises();
    expect((w.find("textarea").element as HTMLTextAreaElement).value).toBe(
      "x = \\frac{}{}"
    );
    expect(w.emitted("dirty")!.at(-1)).toEqual([true]);
    w.unmount();
  });

  it("converts pasted Unicode maths", async () => {
    const w = mount(MathEditor, {
      props: { modelValue: "" },
      global: { plugins: [i18n] },
    });
    const ev = new Event("paste", { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(ev, "clipboardData", {
      value: { getData: () => "E = mc²" },
    });
    w.find("textarea").element.dispatchEvent(ev);
    await flushPromises();
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["E = mc^{2}"]);
  });

  it("does not save an invalid formula", async () => {
    const w = mount(MathEditor, {
      props: { modelValue: "\\frac{a}{" },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    await flushPromises();
    await w.trigger("keydown", { key: "Enter", ctrlKey: true });
    expect(w.emitted("save")).toBeUndefined();
  });
});
