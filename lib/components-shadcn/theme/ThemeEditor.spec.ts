// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import ThemeEditor from "./ThemeEditor.vue";
import enTheme from "../i18n/en-US/theme";
import enActions from "../i18n/en-US/actions";

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": { theme: enTheme, actions: enActions } },
});
const global = { plugins: [i18n] };
const base = [
  {
    tier: "tenant",
    label: "Crescendo",
    css: ".lms-theme {\n  --primary: 40 100% 58%;\n}\n",
  },
];

describe("ThemeEditor", () => {
  it("shows authors the basics only and names where inherited values come from", () => {
    const w = mount(ThemeEditor, { props: { modelValue: "", base }, global });
    expect(w.text()).toContain("Main colour");
    expect(w.text()).not.toContain("Page background");
    expect(w.text()).toContain("From Crescendo");
    expect(w.find("[role=tablist]").exists()).toBe(false);
  });

  it("emits a canonical stylesheet with automatic dark values for surfaces", async () => {
    const w = mount(ThemeEditor, { props: { modelValue: "", base }, global });
    await w.find("button.underline").trigger("click"); // More colours
    const bg = w.find('input[type="color"][id$="--background"]');
    await bg.setValue("#ffffff");
    const css = w.emitted("update:modelValue")!.at(-1)![0] as string;
    expect(css).toContain(".lms-theme {\n  --background: 0 0% 100%;\n}");
    expect(css).toContain(".dark .lms-theme {\n  --background: 0 0% 0%;\n}");
  });

  it("admins get the CSS view, which explains every refused rule", async () => {
    const w = mount(ThemeEditor, {
      props: { modelValue: "", base, advanced: true },
      global,
    });
    await w.findAll("[role=tab]")[1].trigger("click");
    await w.find("textarea").setValue("body { color: red }");
    expect(w.find("[role=alert]").text()).toContain("Line 1");
    expect(w.emitted("valid")!.at(-1)).toEqual([false]);
  });
});
