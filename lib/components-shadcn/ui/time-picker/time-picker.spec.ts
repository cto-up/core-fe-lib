import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TimePicker from "./TimePicker.vue";

function render(modelValue = "") {
  return mount(TimePicker, {
    props: { modelValue },
    attachTo: document.body,
  });
}

async function type(w: ReturnType<typeof render>, keys: string) {
  const input = w.get("input");
  await input.trigger("focus");
  for (const key of keys) await input.trigger("keydown", { key });
}

const last = (w: ReturnType<typeof render>) =>
  w.emitted("update:modelValue")?.at(-1)?.[0];

// A shadcn time field replacing <input type="time">: HH:MM, 24-hour.
describe("TimePicker", () => {
  it("shows a stored time", () => {
    expect(render("07:05").get("input").element.value).toBe("07:05");
  });

  it("emits HH:MM once both segments are typed", async () => {
    const w = render();
    await type(w, "0930");
    expect(last(w)).toBe("09:30");
  });

  it("pads an hour that cannot take a second digit", async () => {
    const w = render();
    await type(w, "945");
    expect(last(w)).toBe("09:45");
  });

  it("emits nothing usable for an hour past 23", async () => {
    const w = render();
    await type(w, "2530");
    expect(last(w) ?? "").toBe("");
  });
});
