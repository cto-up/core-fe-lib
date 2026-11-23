import { describe, expect, it } from "vitest";
import {
  addMonths,
  bandsInWeek,
  isoDate,
  itemsOnDay,
  monthWeeks,
  nowOffset,
  parseIsoDate,
  placeInDay,
  timeAt,
  weekDays,
} from "./layout";

const W = { startHour: 8, endHour: 18, hourHeight: 60 };
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const item = (id: string, d: number, h1: number, h2: number) => ({
  id,
  start: at(d, h1),
  end: at(d, h2),
});

describe("schedule layout", () => {
  it("weeks start on Monday and Mon–Fri is five days", () => {
    const days = weekDays(at(25, 12), 5);
    expect(days.map(isoDate)).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
    ]);
  });

  it("a month grid covers the month in whole weeks", () => {
    const weeks = monthWeeks(at(23, 0));
    expect(weeks).toHaveLength(6);
    expect(isoDate(weeks[0][0])).toBe("2026-10-26");
    expect(isoDate(weeks[5][6])).toBe("2026-12-06");
  });

  it("parses only real local dates", () => {
    expect(isoDate(parseIsoDate("2026-11-23")!)).toBe("2026-11-23");
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("23/11/2026")).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });

  it("adding a month keeps the day when it can", () => {
    expect(isoDate(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-28");
  });

  it("an hour is hourHeight px from the window's first hour", () => {
    const [p] = placeInDay([item("a", 23, 9, 10)], at(23, 0), W);
    expect(p).toMatchObject({ top: 60, height: 60, column: 0, columns: 1 });
  });

  it("overlapping items share the width, and the next one is full again", () => {
    const placed = placeInDay(
      [
        item("a", 23, 9, 11),
        item("b", 23, 10, 12),
        item("c", 23, 11, 12),
        item("d", 23, 14, 15),
      ],
      at(23, 0),
      W
    );
    const by = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect([by.a.column, by.b.column, by.c.column]).toEqual([0, 1, 0]);
    expect([by.a.columns, by.b.columns, by.c.columns]).toEqual([2, 2, 2]);
    expect(by.d).toMatchObject({ column: 0, columns: 1 });
  });

  it("clamps to the window and leaves out what is outside it", () => {
    const placed = placeInDay(
      [item("early", 23, 6, 9), item("night", 23, 19, 20)],
      at(23, 0),
      W
    );
    expect(placed.map((p) => p.item.id)).toEqual(["early"]);
    expect(placed[0]).toMatchObject({ top: 0, height: 60 });
  });

  it("a short item still gets the minimum height", () => {
    const [p] = placeInDay(
      [{ id: "a", start: at(23, 9), end: at(23, 9, 5) }],
      at(23, 0),
      W,
      22
    );
    expect(p.height).toBe(22);
  });

  it("a px offset snaps down to the quarter hour", () => {
    expect(timeAt(95, at(23, 0), W)).toEqual(at(23, 9, 30));
    expect(timeAt(95, at(23, 0), W, 15, "up")).toEqual(at(23, 9, 45));
  });

  it("the now line shows only on today inside the window", () => {
    expect(nowOffset(at(23, 14, 30), at(23, 0), W)).toBe(390);
    expect(nowOffset(at(23, 14, 30), at(24, 0), W)).toBeNull();
    expect(nowOffset(at(23, 20), at(23, 0), W)).toBeNull();
  });

  it("items of a day come earliest first, including one crossing midnight", () => {
    const list = itemsOnDay(
      [
        item("b", 23, 15, 16),
        { id: "x", start: at(22, 23), end: at(23, 1) },
        item("a", 23, 9, 10),
      ],
      at(23, 0)
    );
    expect(list.map((i) => i.id)).toEqual(["x", "a", "b"]);
  });

  it("a band covers the days of the week row it touches", () => {
    const week = weekDays(at(23, 0));
    const [b] = bandsInWeek(
      [{ id: "s", start: at(23, 9), end: at(27, 10) }],
      week
    );
    expect(b).toMatchObject({ from: 0, to: 4 });
  });
});
