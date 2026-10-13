import { describe, expect, it } from "vitest";
import { hexToHsl, readablePrimary } from "./themes";

const lightness = (hex: string) =>
  Number.parseFloat(hexToHsl(hex).split(/\s+/)[2]);
const hue = (hex: string) => Number.parseFloat(hexToHsl(hex).split(/\s+/)[0]);

describe("readablePrimary", () => {
  it("lifts a near-black dark primary, keeping its hue", () => {
    const lifted = readablePrimary("#061812", true);
    expect(lightness(lifted)).toBeGreaterThanOrEqual(55);
    expect(Math.abs(hue(lifted) - hue("#061812"))).toBeLessThan(3);
  });

  it("leaves a readable dark primary alone", () => {
    expect(readablePrimary("#a78bfa", true)).toBe("#a78bfa");
  });

  it("leaves light mode alone", () => {
    expect(readablePrimary("#061812", false)).toBe("#061812");
  });
});
