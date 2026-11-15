import { describe, expect, it } from "vitest";
import { contrastOf, nearestPassing, parseColor, passes } from "./contrast";

describe("contrast", () => {
  it("parses hex, rgb, hsl and shadcn triplets", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("rgb(0, 0, 0)")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor("hsl(0 0% 100%)")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("0 0% 0%")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor("nope")).toBeNull();
  });

  it("computes the WCAG ratio", () => {
    expect(contrastOf("#000", "#fff")).toBeCloseTo(21, 0);
    expect(contrastOf("#777", "#fff")).toBeCloseTo(4.48, 1);
  });

  it("applies text and shape thresholds", () => {
    expect(passes(4.5, "text")).toBe(true);
    expect(passes(4.4, "text")).toBe(false);
    expect(passes(3, "shape")).toBe(true);
  });

  it("finds the nearest passing shade of the same hue", () => {
    const fix = nearestPassing("#ffb627", "#ffffff", "text");
    expect(fix).not.toBeNull();
    expect(contrastOf(fix!, "#ffffff")!).toBeGreaterThanOrEqual(4.5);
  });
});
