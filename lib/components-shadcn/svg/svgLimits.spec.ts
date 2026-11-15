import { describe, expect, it } from "vitest";
import { exceededLimit } from "./svgLimits";

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

describe("exceededLimit", () => {
  it("passes a normal drawing", () => {
    expect(exceededLimit(wrap("<rect/><circle/>"))).toBeNull();
  });
  it("names the filter limit", () => {
    expect(
      exceededLimit(wrap(`<filter>${"<feFlood/>".repeat(9)}</filter>`))
    ).toBe("filter primitives: 9, max 8");
  });
  it("names the depth limit", () => {
    expect(exceededLimit(wrap("<g>".repeat(70) + "</g>".repeat(70)))).toMatch(
      /^depth: \d+, max 64$/
    );
  });
});
