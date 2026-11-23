import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import WeekStrip from "./WeekStrip.vue";
import { weekDays } from "./layout";

const days = weekDays(new Date(2026, 10, 23));

function mountStrip() {
  return mount(WeekStrip, {
    props: {
      modelValue: days[0],
      days,
      marked: ["2026-11-23", "2026-11-24"],
      markedLabel: "has meetings",
      locale: "en-GB",
    },
  });
}

describe("WeekStrip", () => {
  it("checks the chosen day and dots the other marked days", () => {
    const w = mountStrip();
    const mon = w.get('[data-test="week-strip-2026-11-23"]');
    expect(mon.attributes("aria-checked")).toBe("true");
    expect(mon.attributes("tabindex")).toBe("0");
    const tue = w.get('[data-test="week-strip-2026-11-24"]');
    expect(tue.attributes("aria-label")).toBe(
      "Tuesday 24 November, has meetings"
    );
    expect(
      w.get('[data-test="week-strip-dot-2026-11-24"]').classes()
    ).toContain("bg-muted-foreground");
    expect(w.find('[data-test="week-strip-dot-2026-11-25"]').exists()).toBe(
      false
    );
  });

  it("a tap or an arrow key picks a day", async () => {
    const w = mountStrip();
    await w.get('[data-test="week-strip-2026-11-26"]').trigger("click");
    expect(w.emitted("update:modelValue")?.[0][0]).toEqual(days[3]);
    await w
      .get('[data-test="week-strip"]')
      .trigger("keydown", { key: "ArrowRight" });
    expect(w.emitted("update:modelValue")?.[1][0]).toEqual(days[1]);
    await w
      .get('[data-test="week-strip"]')
      .trigger("keydown", { key: "ArrowLeft" });
    expect(w.emitted("update:modelValue")).toHaveLength(2);
  });
});
