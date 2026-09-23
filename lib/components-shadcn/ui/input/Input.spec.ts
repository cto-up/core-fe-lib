import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Input from "./Input.vue";

describe("Input", () => {
  it("round-trips a text value through v-model", async () => {
    const w = mount(Input, { props: { modelValue: "one" } });
    expect((w.find("input").element as HTMLInputElement).value).toBe("one");

    await w.find("input").setValue("two");
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["two"]);

    await w.setProps({ modelValue: "three" });
    expect((w.find("input").element as HTMLInputElement).value).toBe("three");
  });

  // A file input cannot be v-modelled: the directive copies the browser's
  // "C:\fakepath\photo.png" into the model and writes it back on the next
  // patch, which the DOM refuses with InvalidStateError. Before the fix this
  // threw out of patchElement and took the surrounding render down with it.
  it("survives a patch while the model holds a filename", async () => {
    const w = mount(Input, { props: { type: "file", modelValue: "" } });
    await expect(
      w.setProps({ modelValue: "C:\\fakepath\\photo.png" })
    ).resolves.not.toThrow();
    expect(w.find("input").attributes("type")).toBe("file");
  });

  it("still forwards change and the passthrough attrs on a file input", async () => {
    const w = mount(Input, {
      props: { type: "file", disabled: false },
      attrs: { accept: "image/png" },
    });
    const input = w.find("input");
    expect(input.attributes("accept")).toBe("image/png");
    await input.trigger("change");
    // $attrs carries the listener, so a parent's @change is unaffected by the
    // branch that dropped v-model.
    expect(input.element).toBeInstanceOf(HTMLInputElement);
  });
});
