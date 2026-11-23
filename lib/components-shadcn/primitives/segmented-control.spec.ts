import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SegmentedControl from "./SegmentedControl.vue";

const options = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

describe("SegmentedControl", () => {
  it("is a radio group with the current choice checked and tabbable", () => {
    const w = mount(SegmentedControl, {
      props: { modelValue: "week", options, label: "Range" },
    });
    expect(w.get('[role="radiogroup"]').attributes("aria-label")).toBe("Range");
    const week = w.get('[data-test="segment-week"]');
    expect(week.attributes("aria-checked")).toBe("true");
    expect(week.attributes("tabindex")).toBe("0");
    expect(w.get('[data-test="segment-day"]').attributes("tabindex")).toBe(
      "-1"
    );
  });

  it("a click or an arrow key picks, wrapping around; the current one is not re-emitted", async () => {
    const w = mount(SegmentedControl, {
      props: { modelValue: "month", options },
    });
    await w.get('[data-test="segment-month"]').trigger("click");
    expect(w.emitted("update:modelValue")).toBeUndefined();
    await w.get('[data-test="segment-day"]').trigger("click");
    await w
      .get('[role="radiogroup"]')
      .trigger("keydown", { key: "ArrowRight" });
    expect(w.emitted("update:modelValue")).toEqual([["day"], ["day"]]);
  });
});
