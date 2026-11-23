import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { h } from "vue";
import MonthGrid from "./MonthGrid.vue";

const at = (d: number, hr: number) => new Date(2026, 10, d, hr);
const item = (id: string, d: number, hr: number) => ({
  id,
  start: at(d, hr),
  end: at(d, hr + 1),
  title: id,
});

function mountMonth(props: Record<string, unknown> = {}) {
  return mount(MonthGrid, {
    props: {
      date: at(23, 0),
      now: at(23, 12),
      locale: "en-GB",
      items: [
        item("workshop", 26, 10),
        item("i1", 26, 14),
        item("i2", 26, 15),
        item("i3", 26, 16),
        item("demo", 27, 16),
      ],
      bands: [
        { id: "checkin", start: at(23, 9), end: at(27, 10), title: "Check-in" },
      ],
      moreLabel: (n: number) => `+${n} more`,
      ...props,
    },
    slots: {
      item: ({ item }: { item: { title: string } }) =>
        h("a", { href: "#" }, item.title),
      band: ({ band }: { band: { title: string } }) =>
        h("a", { href: "#" }, band.title),
    },
  });
}

describe("MonthGrid", () => {
  it("shows up to maxPerDay items, then +N more that opens the day", async () => {
    const w = mountMonth();
    const day = w.get('[data-test="month-grid-day-2026-11-26"]');
    expect(day.findAll("a").map((a) => a.text())).toEqual([
      "workshop",
      "i1",
      "i2",
    ]);
    const more = w.get('[data-test="month-grid-more-2026-11-26"]');
    expect(more.text()).toBe("+1 more");
    await more.trigger("click");
    expect(w.emitted("open-day")?.[0][0]).toEqual(new Date(2026, 10, 26));
    expect(w.find('[data-test="month-grid-more-2026-11-27"]').exists()).toBe(
      false
    );
  });

  it("draws a band once across the days it covers in its week", () => {
    const w = mountMonth();
    const bands = w.findAll('[data-test="month-grid-band-checkin"]');
    expect(bands).toHaveLength(1);
    expect(bands[0].get("div").attributes("style")).toContain(
      "grid-column: 1 / 6"
    );
    expect(bands[0].text()).toBe("Check-in");
  });

  it("covers the month in whole weeks and marks today", () => {
    const w = mountMonth();
    expect(w.find('[data-test="month-grid-day-2026-10-26"]').exists()).toBe(
      true
    );
    expect(w.find('[data-test="month-grid-day-2026-12-06"]').exists()).toBe(
      true
    );
    expect(
      w
        .get('[data-test="month-grid-day-2026-11-23"] [aria-current="date"]')
        .text()
    ).toBe("23");
  });
});
