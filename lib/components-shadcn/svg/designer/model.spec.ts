import { describe, expect, it } from "vitest";
import {
  History,
  align,
  applyRoleMapping,
  distribute,
  nearestRole,
  parse,
  serialize,
  snapTo,
  type Shape,
} from "./model";
import { parseColor } from "../contrast";
import { sanitizeSvg } from "../svgSanitize";

const rect = (id: string, x: number, y: number, w = 100, h = 60): Shape => ({
  id,
  type: "rect",
  name: "Rectangle",
  x,
  y,
  w,
  h,
  fill: "accent-1",
  stroke: "none",
  strokeWidth: 2,
  rx: 16,
});

describe("designer model", () => {
  it("round-trips every shape type through serialize → parse", () => {
    const shapes: Shape[] = [
      rect("a", 40, 40),
      {
        id: "b",
        type: "ellipse",
        name: "Ellipse",
        x: 200,
        y: 40,
        w: 80,
        h: 80,
        fill: "accent-2",
        stroke: "line",
        strokeWidth: 3,
      },
      {
        id: "c",
        type: "line",
        name: "Arrow",
        x: 140,
        y: 70,
        w: 60,
        h: 0,
        fill: "none",
        stroke: "ink",
        strokeWidth: 4,
        arrow: true,
      },
      {
        id: "d",
        type: "text",
        name: "Text",
        x: 40,
        y: 200,
        w: 240,
        h: 50,
        fill: "ink",
        stroke: "none",
        strokeWidth: 2,
        text: "Plan & <build>",
        fontSize: 32,
        bold: true,
      },
      {
        id: "e",
        type: "group",
        name: "Star",
        x: 400,
        y: 100,
        w: 96,
        h: 96,
        fill: "none",
        stroke: "ink",
        strokeWidth: 2,
        inner: '<path d="M1 1L23 23"/>',
        innerW: 24,
        innerH: 24,
        hidden: true,
      },
    ];
    const svg = serialize(shapes);
    expect(sanitizeSvg(svg).removed).toEqual([]);
    const back = parse(svg);
    expect(back.shapes).toEqual(shapes);
    expect(back.artboard).toEqual({ width: 800, height: 450 });
    expect(serialize(back.shapes)).toBe(svg);
  });

  it("colours only by role classes", () => {
    const svg = serialize([rect("a", 0, 0)]);
    expect(svg).toContain('class="t-fill-accent-1"');
    expect(svg).not.toMatch(/fill="#/);
  });

  it("imports foreign SVG as an intact group and lists its fixed colours", () => {
    const res = parse(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><circle r="5" fill="#FF0000"/><script>x</script></svg>`
    );
    expect(res.shapes).toHaveLength(1);
    expect(res.shapes[0].type).toBe("group");
    expect(res.shapes[0].inner).toContain("circle");
    expect(res.literalColours).toEqual(["#ff0000"]);
    expect(res.removed).toContain("script");
  });

  it("maps fixed colours to the nearest role", () => {
    const roles = {
      "accent-1": { r: 255, g: 0, b: 0 },
      ink: { r: 0, g: 0, b: 0 },
    };
    expect(nearestRole("#ee1111", roles, parseColor)).toBe("accent-1");
    const out = applyRoleMapping('<circle r="5" fill="#ff0000"/>', {
      "#ff0000": "accent-1",
    });
    expect(out).toContain('class="t-fill-accent-1"');
    expect(out).not.toContain("#ff0000");
  });

  it("snaps to a guide within tolerance, else to the 8-unit grid", () => {
    expect(snapTo(103, [100])).toEqual({ value: 100, guide: 100 });
    expect(snapTo(130, [100])).toEqual({ value: 128, guide: null });
  });

  it("aligns and distributes a selection", () => {
    const shapes = [rect("a", 0, 0), rect("b", 50, 100), rect("c", 400, 10)];
    const left = align(shapes, new Set(["a", "b"]), "left");
    expect(left.find((s) => s.id === "b")!.x).toBe(0);
    const spread = distribute(shapes, new Set(["a", "b", "c"]), "x");
    const xs = spread.map((s) => s.x).sort((p, q) => p - q);
    expect(xs[1] - (xs[0] + 100)).toBeCloseTo(xs[2] - (xs[1] + 100));
  });

  it("undoes and redoes in order, and a new edit clears redo", () => {
    const hist = new History<number>();
    hist.push(1);
    hist.push(2);
    expect(hist.undo(3)).toBe(2);
    expect(hist.redo(2)).toBe(3);
    hist.undo(3);
    hist.push(9);
    expect(hist.canRedo).toBe(false);
  });
});
