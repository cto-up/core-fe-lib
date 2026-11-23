import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";
import TimeGrid from "./TimeGrid.vue";
import { weekDays } from "./layout";

const at = (d: number, hr: number, m = 0) => new Date(2026, 10, d, hr, m);
const days = weekDays(at(23, 0), 5);

function mountGrid(props: Record<string, unknown> = {}) {
  return mount(TimeGrid, {
    props: {
      days,
      items: [
        { id: "a", start: at(23, 9), end: at(23, 10), title: "Sync" },
        { id: "b", start: at(25, 14), end: at(25, 15), title: "Retro" },
      ],
      now: at(23, 14, 30),
      locale: "en-GB",
      startHour: 8,
      endHour: 18,
      ...props,
    },
    slots: {
      item: ({ item }: { item: { title: string } }) =>
        h("a", { href: "#" }, item.title),
    },
  });
}

describe("TimeGrid", () => {
  it("covers the whole day and scrolls, opening on 8 AM", () => {
    const w = mountGrid({ startHour: undefined, endHour: undefined });
    const labels = w.findAll('[aria-hidden="true"] span');
    expect(labels).toHaveLength(24);
    expect(w.get('[data-test="time-grid"]').classes()).toContain(
      "overflow-y-auto"
    );
    expect(w.get('[data-test="time-grid"]').attributes("style")).toContain(
      "max-height: 648px"
    );
    expect(
      (w.get('[data-test="time-grid"]').element as HTMLElement).scrollTop
    ).toBe(8 * 60);
  });

  it("opens on an earlier item, and draws items late in the evening", () => {
    const w = mountGrid({
      startHour: undefined,
      endHour: undefined,
      items: [
        { id: "early", start: at(24, 6), end: at(24, 7), title: "Early" },
        { id: "late", start: at(26, 20), end: at(26, 21), title: "Late" },
      ],
    });
    expect(
      (w.get('[data-test="time-grid"]').element as HTMLElement).scrollTop
    ).toBe(6 * 60);
    expect(
      w.get('[data-test="time-grid-item-late"]').attributes("style")
    ).toContain("top: 1200px");
  });

  it("keeps the user's scroll when the items are refreshed, and re-opens on other days", async () => {
    const w = mountGrid({ startHour: undefined, endHour: undefined });
    const el = w.get('[data-test="time-grid"]').element as HTMLElement;
    el.scrollTop = 1000;
    await w.setProps({
      items: [
        { id: "a", start: at(23, 9), end: at(23, 10), title: "Sync" },
        { id: "b", start: at(25, 14), end: at(25, 15), title: "Retro" },
        { id: "c", start: at(26, 16), end: at(26, 17), title: "New" },
      ],
    });
    await nextTick();
    expect(el.scrollTop).toBe(1000);

    await w.setProps({ days: days.map((d) => new Date(+d + 7 * 864e5)) });
    await nextTick();
    expect(el.scrollTop).toBe(8 * 60);
  });

  it("labels each hour on one short line, inset from the edge", () => {
    const w = mountGrid({ locale: "en-US" });
    const first = w.find('[aria-hidden="true"] span');
    expect(first.text()).toBe("8 AM");
    expect(first.classes()).toEqual(
      expect.arrayContaining(["whitespace-nowrap", "left-2", "right-2"])
    );
  });

  it("draws each item through the slot, at its time, in its day", () => {
    const w = mountGrid();
    const a = w.get(
      '[data-test="time-grid-day-2026-11-23"] [data-test="time-grid-item-a"]'
    );
    expect(a.text()).toBe("Sync");
    expect(a.attributes("style")).toContain("top: 60px");
    expect(a.attributes("style")).toContain("height: 60px");
    expect(
      w
        .find(
          '[data-test="time-grid-day-2026-11-25"] [data-test="time-grid-item-b"]'
        )
        .exists()
    ).toBe(true);
  });

  it("puts the now line on today only", () => {
    const w = mountGrid();
    const lines = w.findAll('[data-test="time-grid-now"]');
    expect(lines).toHaveLength(1);
    expect(lines[0].attributes("style")).toContain("top: 390px");
    expect(
      w
        .find(
          '[data-test="time-grid-day-2026-11-23"] [data-test="time-grid-now"]'
        )
        .exists()
    ).toBe(true);
  });

  it("dragging across an empty slot selects that range, snapped", async () => {
    const w = mountGrid();
    const col = w.get('[data-test="time-grid-day-2026-11-24"]');
    await col.trigger("pointerdown", { button: 0, clientY: 120, pointerId: 1 });
    await col.trigger("pointermove", { clientY: 200, pointerId: 1 });
    expect(w.find('[data-test="time-grid-selection"]').exists()).toBe(true);
    await col.trigger("pointerup", { pointerId: 1 });
    expect(w.emitted("select-range")?.[0]).toEqual([
      { start: at(24, 10), end: at(24, 11, 30) },
    ]);
  });

  it("a press without a drag selects the default length", async () => {
    const w = mountGrid();
    const col = w.get('[data-test="time-grid-day-2026-11-24"]');
    await col.trigger("pointerdown", { button: 0, clientY: 75, pointerId: 1 });
    await col.trigger("pointerup", { pointerId: 1 });
    expect(w.emitted("select-range")?.[0]).toEqual([
      { start: at(24, 9, 15), end: at(24, 9, 45) },
    ]);
  });

  it("a press on an item selects nothing", async () => {
    const w = mountGrid();
    await w
      .get('[data-test="time-grid-item-a"]')
      .trigger("pointerdown", { button: 0 });
    await w.get('[data-test="time-grid-day-2026-11-23"]').trigger("pointerup");
    expect(w.emitted("select-range")).toBeUndefined();
  });

  it("selects nothing when not selectable, and can hide its header", async () => {
    const w = mountGrid({ selectable: false, showHeader: false });
    expect(w.find('[data-test="time-grid-head-2026-11-23"]').exists()).toBe(
      false
    );
    const col = w.get('[data-test="time-grid-day-2026-11-24"]');
    await col.trigger("pointerdown", { button: 0, clientY: 75 });
    await col.trigger("pointerup");
    expect(w.emitted("select-range")).toBeUndefined();
  });

  it("marks today in the header", () => {
    const w = mountGrid();
    expect(
      w
        .get('[data-test="time-grid-head-2026-11-23"] [aria-current="date"]')
        .text()
    ).toBe("23");
  });
});

describe("TimeGrid: moving an item (office#253)", () => {
  type Item = { id: string; start: Date; end: Date; title: string };
  const movable = (it: Item) => it.id === "a";

  /** Day columns 100px wide side by side, their tops at 0. */
  function laidOut(w: ReturnType<typeof mountGrid>) {
    days.forEach((d, i) => {
      const iso = `2026-11-${String(d.getDate()).padStart(2, "0")}`;
      const el = w.get(`[data-test="time-grid-day-${iso}"]`).element;
      el.getBoundingClientRect = () =>
        ({ left: i * 100, right: (i + 1) * 100, top: 0 }) as DOMRect;
    });
    return w;
  }

  it("moves an item to another day and time, keeping its length, where it was taken", async () => {
    const w = laidOut(mountGrid({ movable }));
    const grid = w.get('[data-test="time-grid"]');
    expect(
      w.get('[data-test="time-grid-item-a"]').attributes("data-movable")
    ).toBe("true");
    // Taken half an hour into Mon 9:00–10:00, dropped at Wed 14:30.
    await w
      .get('[data-test="time-grid-item-a"]')
      .trigger("pointerdown", { button: 0, clientX: 50, clientY: 90 });
    await grid.trigger("pointermove", { clientX: 250, clientY: 390 });
    expect(
      w
        .find(
          '[data-test="time-grid-day-2026-11-25"] [data-test="time-grid-item-a"]'
        )
        .exists()
    ).toBe(true);
    await grid.trigger("pointerup");
    expect(w.emitted("move-item")?.[0][0]).toMatchObject({
      start: at(25, 14),
      end: at(25, 15),
    });
  });

  it("changes the end when the bottom edge is dragged", async () => {
    const w = laidOut(mountGrid({ movable }));
    await w
      .get('[data-test="time-grid-resize-a"]')
      .trigger("pointerdown", { button: 0, clientX: 50, clientY: 119 });
    const grid = w.get('[data-test="time-grid"]');
    await grid.trigger("pointermove", { clientX: 50, clientY: 230 });
    await grid.trigger("pointerup");
    expect(w.emitted("move-item")?.[0][0]).toMatchObject({
      start: at(23, 9),
      end: at(23, 12),
    });
  });

  it("lets a press without a drag click the item, and swallows the click after a move", async () => {
    const w = laidOut(mountGrid({ movable }));
    const item = w.get('[data-test="time-grid-item-a"]');
    const link = item.get("a");
    const clicks: Event[] = [];
    link.element.addEventListener("click", (e) => clicks.push(e));

    await item.trigger("pointerdown", { button: 0, clientX: 50, clientY: 90 });
    await w.get('[data-test="time-grid"]').trigger("pointerup");
    await link.trigger("click");
    expect(clicks).toHaveLength(1);
    expect(w.emitted("move-item")).toBeUndefined();

    await item.trigger("pointerdown", { button: 0, clientX: 50, clientY: 90 });
    await w
      .get('[data-test="time-grid"]')
      .trigger("pointermove", { clientX: 50, clientY: 150 });
    await w.get('[data-test="time-grid"]').trigger("pointerup");
    await w.get('[data-test="time-grid-item-a"] a').trigger("click");
    expect(clicks).toHaveLength(1);
  });

  it("does not move an item that is not movable, nor any item by default", async () => {
    for (const w of [laidOut(mountGrid({ movable })), laidOut(mountGrid())]) {
      const b = w.get('[data-test="time-grid-item-b"]');
      expect(b.attributes("data-movable")).toBeUndefined();
      expect(w.find('[data-test="time-grid-resize-b"]').exists()).toBe(false);
      await b.trigger("pointerdown", { button: 0, clientX: 250, clientY: 380 });
      await w
        .get('[data-test="time-grid"]')
        .trigger("pointermove", { clientX: 350, clientY: 500 });
      await w.get('[data-test="time-grid"]').trigger("pointerup");
      expect(w.emitted("move-item")).toBeUndefined();
    }
  });
});
