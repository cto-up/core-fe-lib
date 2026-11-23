/**
 * Pure layout for the schedule components (TimeGrid, MonthGrid, WeekStrip):
 * dates are local, items are anything with a start and an end.
 */

export type DateLike = Date | string | number;

export interface ScheduleItem {
  id: string;
  start: DateLike;
  end: DateLike;
}

export interface TimeWindow {
  /** First hour drawn, 0–23. */
  startHour: number;
  /** Hour the grid ends at, exclusive, 1–24. */
  endHour: number;
  /** Height of one hour, in px. */
  hourHeight: number;
}

export interface Placement<T> {
  item: T;
  top: number;
  height: number;
  /** Overlap column, 0-based, among `columns` side by side. */
  column: number;
  columns: number;
}

const DAY_MS = 86_400_000;

export const toDate = (v: DateLike) => (v instanceof Date ? v : new Date(v));

export function startOfDay(d: DateLike): Date {
  const x = new Date(toDate(d));
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: DateLike, n: number): Date {
  const x = new Date(toDate(d));
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: DateLike, n: number): Date {
  const x = startOfDay(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(day, last));
  return x;
}

export const sameDay = (a: DateLike, b: DateLike) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

/** 0 = Sunday … 6 = Saturday, as Date.getDay. */
export function startOfWeek(d: DateLike, weekStartsOn = 1): Date {
  const x = startOfDay(d);
  const back = (x.getDay() - weekStartsOn + 7) % 7;
  return addDays(x, -back);
}

/** The days of d's week, from weekStartsOn, `count` of them (5 = Mon–Fri). */
export function weekDays(d: DateLike, count = 7, weekStartsOn = 1): Date[] {
  const first = startOfWeek(d, weekStartsOn);
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** The weeks a month grid shows for d's month: whole weeks covering it. */
export function monthWeeks(d: DateLike, weekStartsOn = 1): Date[][] {
  const x = toDate(d);
  const first = new Date(x.getFullYear(), x.getMonth(), 1);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  for (let w = startOfWeek(first, weekStartsOn); w <= last; w = addDays(w, 7))
    weeks.push(weekDays(w, 7, weekStartsOn));
  return weeks;
}

/** YYYY-MM-DD in local time. */
export function isoDate(d: DateLike): string {
  const x = toDate(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

/** A local date from YYYY-MM-DD, or null when it is not one. */
export function parseIsoDate(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isoDate(d) === s ? d : null;
}

const ms = (v: DateLike) => toDate(v).getTime();

/** The item overlaps [from, to). */
export const overlaps = (i: ScheduleItem, from: DateLike, to: DateLike) =>
  ms(i.start) < ms(to) && ms(i.end) > ms(from);

/** Items overlapping the day, earliest first. */
export function itemsOnDay<T extends ScheduleItem>(items: T[], day: DateLike) {
  const from = startOfDay(day);
  const to = new Date(from.getTime() + DAY_MS);
  return items
    .filter((i) => overlaps(i, from, to))
    .sort((a, b) => ms(a.start) - ms(b.start) || ms(a.end) - ms(b.end));
}

export const windowHeight = (w: TimeWindow) =>
  (w.endHour - w.startHour) * w.hourHeight;

/** A time of the day as px from the top of the window, clamped to it. */
export function offsetOf(at: DateLike, day: DateLike, w: TimeWindow): number {
  const minutes = (ms(at) - startOfDay(day).getTime()) / 60_000;
  const px = ((minutes - w.startHour * 60) / 60) * w.hourHeight;
  return Math.min(Math.max(px, 0), windowHeight(w));
}

/** The time at px from the top of the window, snapped down (or up) to
 * `snap` minutes. */
export function timeAt(
  px: number,
  day: DateLike,
  w: TimeWindow,
  snap = 15,
  round: "down" | "up" = "down"
): Date {
  const clamped = Math.min(Math.max(px, 0), windowHeight(w));
  const minutes = w.startHour * 60 + (clamped / w.hourHeight) * 60;
  const snapped =
    (round === "up" ? Math.ceil : Math.floor)(minutes / snap) * snap;
  return new Date(startOfDay(day).getTime() + snapped * 60_000);
}

/** px of `now` in the window, or null when now is another day or outside it. */
export function nowOffset(
  now: DateLike,
  day: DateLike,
  w: TimeWindow
): number | null {
  if (!sameDay(now, day)) return null;
  const h = toDate(now).getHours() + toDate(now).getMinutes() / 60;
  if (h < w.startHour || h >= w.endHour) return null;
  return offsetOf(now, day, w);
}

/**
 * The day's items placed in the window: top and height from their times
 * (at least minHeight), and side-by-side columns where they overlap. Items
 * wholly outside the window are left out.
 */
export function placeInDay<T extends ScheduleItem>(
  items: T[],
  day: DateLike,
  w: TimeWindow,
  minHeight = 20
): Placement<T>[] {
  const from = new Date(startOfDay(day).getTime() + w.startHour * 3_600_000);
  const to = new Date(startOfDay(day).getTime() + w.endHour * 3_600_000);
  const shown = itemsOnDay(items, day).filter((i) => overlaps(i, from, to));
  const out: Placement<T>[] = [];
  let cluster: Placement<T>[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;
  const close = () => {
    cluster.forEach((p) => (p.columns = colEnds.length));
    cluster = [];
    colEnds = [];
  };
  for (const item of shown) {
    const start = ms(item.start);
    const end = ms(item.end);
    if (start >= clusterEnd) close();
    let column = colEnds.findIndex((e) => e <= start);
    if (column < 0) column = colEnds.push(end) - 1;
    else colEnds[column] = end;
    clusterEnd = Math.max(clusterEnd, end);
    const top = offsetOf(item.start, day, w);
    const bottom = offsetOf(item.end, day, w);
    const height = Math.max(bottom - top, minHeight);
    const p = { item, top, height, column, columns: 1 };
    cluster.push(p);
    out.push(p);
  }
  close();
  return out;
}

export interface Band<T> {
  item: T;
  /** First and last day index in the week row, inclusive. */
  from: number;
  to: number;
}

/** The bands (multi-day items) that touch a week row, as day ranges in it. */
export function bandsInWeek<T extends ScheduleItem>(
  bands: T[],
  week: Date[]
): Band<T>[] {
  const out: Band<T>[] = [];
  for (const item of bands) {
    const hit = week
      .map((d, i) => (overlaps(item, d, addDays(d, 1)) ? i : -1))
      .filter((i) => i >= 0);
    if (hit.length) out.push({ item, from: hit[0], to: hit[hit.length - 1] });
  }
  return out.sort((a, b) => a.from - b.from || b.to - a.to);
}
