// The SvgDesigner document model: a flat list of shapes on a fixed artboard,
// serialized to a plain themed SVG that round-trips through the designer
// (editor metadata rides in data-sd-* attributes, which renderers ignore).

import { sanitizeSvg } from "../svgSanitize";
import { SVG_ROLES, type SvgRole } from "../svgTheme";

export type ShapeType = "rect" | "ellipse" | "line" | "text" | "group";

export interface Shape {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: SvgRole | "none";
  stroke: SvgRole | "none";
  strokeWidth: number;
  /** rect corner radius */
  rx?: number;
  /** line: arrowhead at the end */
  arrow?: boolean;
  /** text content (text shapes) */
  text?: string;
  fontSize?: number;
  bold?: boolean;
  /** group: inner markup (imported SVG or an icon), drawn in its own w x h box */
  inner?: string;
  innerW?: number;
  innerH?: number;
  hidden?: boolean;
}

export interface Artboard {
  width: number;
  height: number;
}

export const DEFAULT_ARTBOARD: Artboard = { width: 800, height: 450 };
export const GRID = 8;
/** 12 px in a 360 px phone column, at an 800-wide artboard. */
export const MIN_TEXT_UNITS = 28;

let seq = 0;
export function newId(): string {
  seq += 1;
  return `s${Date.now().toString(36)}${seq.toString(36)}`;
}

export function snap(v: number, grid = GRID): number {
  return Math.round(v / grid) * grid;
}

/** Snap a value to the nearest guide within `tol`, else to the grid. */
export function snapTo(
  v: number,
  guides: number[],
  tol = 6
): { value: number; guide: number | null } {
  let best: number | null = null;
  for (const g of guides) {
    if (
      Math.abs(g - v) <= tol &&
      (best === null || Math.abs(g - v) < Math.abs(best - v))
    )
      best = g;
  }
  return best === null
    ? { value: snap(v), guide: null }
    : { value: best, guide: best };
}

/** Edges and centres of the other shapes, for snapping. */
export function guidesOf(
  shapes: Shape[],
  exclude: Set<string>
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const s of shapes) {
    if (exclude.has(s.id) || s.hidden) continue;
    xs.push(s.x, s.x + s.w / 2, s.x + s.w);
    ys.push(s.y, s.y + s.h / 2, s.y + s.h);
  }
  return { xs, ys };
}

export function minTextUnits(artboard: Artboard): number {
  return (MIN_TEXT_UNITS * artboard.width) / 800;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function n(v: number): string {
  return String(Math.round(v * 100) / 100);
}

function paintClass(s: Shape): string {
  const c: string[] = [];
  if (s.fill !== "none") c.push(`t-fill-${s.fill}`);
  if (s.stroke !== "none") c.push(`t-stroke-${s.stroke}`);
  if (s.type === "text" && s.bold) c.push("t-display");
  return c.join(" ");
}

function meta(s: Shape): string {
  return ` data-sd-id="${esc(s.id)}" data-sd-name="${esc(s.name)}"${s.hidden ? ' data-sd-hidden="1"' : ""}`;
}

function shapeMarkup(s: Shape): string {
  const cls = paintClass(s);
  const classAttr = cls ? ` class="${cls}"` : "";
  const fillNone = s.fill === "none" && s.type !== "line" ? ' fill="none"' : "";
  const sw = s.stroke !== "none" ? ` stroke-width="${n(s.strokeWidth)}"` : "";
  const vis = s.hidden ? ' visibility="hidden"' : "";
  switch (s.type) {
    case "rect":
      return `<rect${meta(s)} x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w)}" height="${n(s.h)}"${s.rx ? ` rx="${n(s.rx)}"` : ""}${classAttr}${fillNone}${sw}${vis}/>`;
    case "ellipse":
      return `<ellipse${meta(s)} cx="${n(s.x + s.w / 2)}" cy="${n(s.y + s.h / 2)}" rx="${n(s.w / 2)}" ry="${n(s.h / 2)}"${classAttr}${fillNone}${sw}${vis}/>`;
    case "line":
      return `<line${meta(s)} x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(s.x + s.w)}" y2="${n(s.y + s.h)}"${classAttr}${sw}${s.arrow ? ' marker-end="url(#sd-arrow)" data-sd-arrow="1"' : ""}${vis}/>`;
    case "text": {
      const size = s.fontSize ?? MIN_TEXT_UNITS;
      return `<text${meta(s)} x="${n(s.x + s.w / 2)}" y="${n(s.y + s.h / 2)}" text-anchor="middle" dominant-baseline="central" font-size="${n(size)}" data-sd-w="${n(s.w)}" data-sd-h="${n(s.h)}"${classAttr}${vis}>${esc(s.text ?? "")}</text>`;
    }
    case "group": {
      const sx = s.w / (s.innerW || s.w || 1);
      const sy = s.h / (s.innerH || s.h || 1);
      return `<g${meta(s)} transform="translate(${n(s.x)} ${n(s.y)}) scale(${n(sx)} ${n(sy)})" data-sd-type="group" data-sd-iw="${n(s.innerW ?? s.w)}" data-sd-ih="${n(s.innerH ?? s.h)}"${classAttr}${s.stroke !== "none" ? ` fill="none" stroke-width="${n(s.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"` : ""}${vis}>${s.inner ?? ""}</g>`;
    }
  }
}

/** Serialize the document to a themed SVG with a title (the accessible name). */
export function serialize(
  shapes: Shape[],
  artboard: Artboard = DEFAULT_ARTBOARD,
  title = ""
): string {
  const needsArrow = shapes.some((s) => s.type === "line" && s.arrow);
  const defs = needsArrow
    ? `<defs><marker id="sd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="t-fill-ink"/></marker></defs>`
    : "";
  const t = title ? `<title>${esc(title)}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${artboard.width} ${artboard.height}" data-sd-version="1">${t}${defs}${shapes.map(shapeMarkup).join("")}</svg>`;
}

function roleFrom(cls: string, kind: "fill" | "stroke"): SvgRole | "none" {
  const m = new RegExp(`t-${kind}-([a-z0-9-]+)`).exec(cls);
  if (m && (SVG_ROLES as readonly string[]).includes(m[1]))
    return m[1] as SvgRole;
  if (kind === "fill" && /\bt-ink\b/.test(cls)) return "ink";
  return "none";
}

function num(el: Element, name: string, def = 0): number {
  const v = Number.parseFloat(el.getAttribute(name) ?? "");
  return Number.isNaN(v) ? def : v;
}

function common(
  el: Element,
  type: ShapeType
): Pick<
  Shape,
  "id" | "name" | "type" | "fill" | "stroke" | "strokeWidth" | "hidden"
> {
  const cls = el.getAttribute("class") ?? "";
  return {
    id: el.getAttribute("data-sd-id") || newId(),
    name: el.getAttribute("data-sd-name") || type,
    type,
    fill: roleFrom(cls, "fill"),
    stroke: roleFrom(cls, "stroke"),
    strokeWidth: num(el, "stroke-width", 2),
    ...(el.getAttribute("data-sd-hidden") === "1" ? { hidden: true } : {}),
  };
}

export interface ParseResult {
  shapes: Shape[];
  artboard: Artboard;
  title: string;
  /** Hard-coded colours found in imported markup (candidates for role mapping). */
  literalColours: string[];
  removed: string[];
}

/**
 * Parse an SVG (a designer document or any pasted SVG) into shapes. Designer
 * shapes come back exactly; any other top-level element becomes a group.
 */
export function parse(svg: string): ParseResult {
  const { svg: clean, removed } = sanitizeSvg(svg);
  const empty: ParseResult = {
    shapes: [],
    artboard: { ...DEFAULT_ARTBOARD },
    title: "",
    literalColours: [],
    removed,
  };
  if (!clean) return empty;
  const root = new DOMParser().parseFromString(
    clean,
    "image/svg+xml"
  ).documentElement;
  const vb = (root.getAttribute("viewBox") ?? "").split(/[\s,]+/).map(Number);
  const artboard =
    vb.length === 4 &&
    vb.every((v) => !Number.isNaN(v)) &&
    vb[2] > 0 &&
    vb[3] > 0
      ? { width: vb[2], height: vb[3] }
      : {
          width: num(root, "width", DEFAULT_ARTBOARD.width),
          height: num(root, "height", DEFAULT_ARTBOARD.height),
        };
  const title = root.querySelector(":scope > title")?.textContent ?? "";
  const literal = new Set<string>();
  const shapes: Shape[] = [];
  for (const el of Array.from(root.children)) {
    const tag = el.localName;
    if (
      tag === "title" ||
      tag === "desc" ||
      (tag === "defs" && el.querySelector("#sd-arrow"))
    )
      continue;
    for (const node of [el, ...Array.from(el.querySelectorAll("*"))]) {
      for (const a of ["fill", "stroke", "stop-color"]) {
        const v = node.getAttribute(a);
        if (v && !/^(none|transparent|currentcolor|inherit|url\(#)/i.test(v))
          literal.add(v.toLowerCase());
      }
    }
    const isDesigner = el.hasAttribute("data-sd-id");
    if (isDesigner && tag === "rect") {
      shapes.push({
        ...common(el, "rect"),
        x: num(el, "x"),
        y: num(el, "y"),
        w: num(el, "width"),
        h: num(el, "height"),
        rx: num(el, "rx"),
      });
    } else if (isDesigner && tag === "ellipse") {
      const rx = num(el, "rx");
      const ry = num(el, "ry");
      shapes.push({
        ...common(el, "ellipse"),
        x: num(el, "cx") - rx,
        y: num(el, "cy") - ry,
        w: rx * 2,
        h: ry * 2,
      });
    } else if (isDesigner && tag === "line") {
      const x1 = num(el, "x1");
      const y1 = num(el, "y1");
      shapes.push({
        ...common(el, "line"),
        x: x1,
        y: y1,
        w: num(el, "x2") - x1,
        h: num(el, "y2") - y1,
        arrow: el.getAttribute("data-sd-arrow") === "1",
      });
    } else if (isDesigner && tag === "text") {
      const w = num(el, "data-sd-w", 200);
      const h = num(el, "data-sd-h", 48);
      shapes.push({
        ...common(el, "text"),
        x: num(el, "x") - w / 2,
        y: num(el, "y") - h / 2,
        w,
        h,
        text: el.textContent ?? "",
        fontSize: num(el, "font-size", MIN_TEXT_UNITS),
        bold: /\bt-display\b/.test(el.getAttribute("class") ?? ""),
      });
    } else if (isDesigner && el.getAttribute("data-sd-type") === "group") {
      const m =
        /translate\(([-\d.]+)[ ,]+([-\d.]+)\)\s*scale\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(
          el.getAttribute("transform") ?? ""
        );
      const iw = num(el, "data-sd-iw", 100);
      const ih = num(el, "data-sd-ih", 100);
      const [tx, ty, sx, sy] = m ? m.slice(1).map(Number) : [0, 0, 1, 1];
      const inner = Array.from(el.childNodes)
        .map((c) => new XMLSerializer().serializeToString(c))
        .join("")
        .replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");
      shapes.push({
        ...common(el, "group"),
        x: tx,
        y: ty,
        w: iw * sx,
        h: ih * sy,
        inner,
        innerW: iw,
        innerH: ih,
      });
    } else {
      // Foreign markup: keep it intact as a group spanning the artboard.
      const holder = el.cloneNode(true) as Element;
      shapes.push({
        id: newId(),
        type: "group",
        name: tag,
        x: 0,
        y: 0,
        w: artboard.width,
        h: artboard.height,
        fill: "none",
        stroke: "none",
        strokeWidth: 0,
        inner: new XMLSerializer()
          .serializeToString(holder)
          .replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ""),
        innerW: artboard.width,
        innerH: artboard.height,
      });
    }
  }
  return { shapes, artboard, title, literalColours: [...literal], removed };
}

/** Undo/redo over immutable snapshots of the document. */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(private limit = 100) {}

  push(snapshot: T) {
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: T): T | null {
    const prev = this.past.pop();
    if (prev === undefined) return null;
    this.future.push(current);
    return prev;
  }

  redo(current: T): T | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(current);
    return next;
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}

/** Align a selection on one axis edge/centre, relative to the selection's bounds. */
export function align(
  shapes: Shape[],
  ids: Set<string>,
  how: "left" | "center" | "right" | "top" | "middle" | "bottom"
): Shape[] {
  const sel = shapes.filter((s) => ids.has(s.id));
  if (sel.length < 2) return shapes;
  const minX = Math.min(...sel.map((s) => s.x));
  const maxX = Math.max(...sel.map((s) => s.x + s.w));
  const minY = Math.min(...sel.map((s) => s.y));
  const maxY = Math.max(...sel.map((s) => s.y + s.h));
  return shapes.map((s) => {
    if (!ids.has(s.id)) return s;
    switch (how) {
      case "left":
        return { ...s, x: minX };
      case "right":
        return { ...s, x: maxX - s.w };
      case "center":
        return { ...s, x: (minX + maxX) / 2 - s.w / 2 };
      case "top":
        return { ...s, y: minY };
      case "bottom":
        return { ...s, y: maxY - s.h };
      case "middle":
        return { ...s, y: (minY + maxY) / 2 - s.h / 2 };
    }
  });
}

/** Spread three or more selected shapes evenly between the outermost two. */
export function distribute(
  shapes: Shape[],
  ids: Set<string>,
  axis: "x" | "y"
): Shape[] {
  const sel = shapes
    .filter((s) => ids.has(s.id))
    .sort((a, b) => (axis === "x" ? a.x - b.x : a.y - b.y));
  if (sel.length < 3) return shapes;
  const size = (s: Shape) => (axis === "x" ? s.w : s.h);
  const pos = (s: Shape) => (axis === "x" ? s.x : s.y);
  const total = sel.reduce((acc, s) => acc + size(s), 0);
  const span =
    pos(sel[sel.length - 1]) + size(sel[sel.length - 1]) - pos(sel[0]);
  const gap = (span - total) / (sel.length - 1);
  const next = new Map<string, number>();
  let cursor = pos(sel[0]);
  for (const s of sel) {
    next.set(s.id, cursor);
    cursor += size(s) + gap;
  }
  return shapes.map((s) =>
    next.has(s.id) ? { ...s, [axis]: next.get(s.id)! } : s
  );
}

/** Nearest role for a literal colour, given each role's resolved colour. */
export function nearestRole(
  colour: string,
  resolved: Partial<Record<SvgRole, { r: number; g: number; b: number }>>,
  parse: (c: string) => { r: number; g: number; b: number } | null
): SvgRole | null {
  const c = parse(colour);
  if (!c) return null;
  let best: SvgRole | null = null;
  let bestD = Infinity;
  for (const [role, rgb] of Object.entries(resolved) as [
    SvgRole,
    { r: number; g: number; b: number },
  ][]) {
    const d = (c.r - rgb.r) ** 2 + (c.g - rgb.g) ** 2 + (c.b - rgb.b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = role;
    }
  }
  return best;
}

/** Replace literal fill/stroke colours in markup by role classes. */
export function applyRoleMapping(
  markup: string,
  mapping: Record<string, SvgRole>
): string {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
    "image/svg+xml"
  );
  for (const el of Array.from(doc.documentElement.querySelectorAll("*"))) {
    for (const attr of ["fill", "stroke"] as const) {
      const v = el.getAttribute(attr)?.toLowerCase();
      const role = v ? mapping[v] : undefined;
      if (!role) continue;
      el.removeAttribute(attr);
      el.setAttribute(
        "class",
        `${el.getAttribute("class") ?? ""} t-${attr}-${role}`.trim()
      );
    }
  }
  return Array.from(doc.documentElement.childNodes)
    .map((c) => new XMLSerializer().serializeToString(c))
    .join("")
    .replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");
}
