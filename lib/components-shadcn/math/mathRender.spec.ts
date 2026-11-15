import { describe, expect, it } from "vitest";
import { lintTex, renderTex } from "./mathRender";

describe("renderTex", () => {
  it("renders display math with MathML for screen readers", async () => {
    const res = await renderTex("\\frac{a}{b} = \\sum_{i=1}^{n} x_i", {
      display: true,
    });
    expect(res.error).toBeUndefined();
    expect(res.html).toContain("katex-display");
    expect(res.html).toContain("<math");
  });

  it("returns invalid TeX as an error, never throws", async () => {
    const res = await renderTex("\\frac{a}{", { display: false });
    expect(res.html).toBe("");
    expect(res.error?.message).toBeTruthy();
  });

  it("refuses links, html and macro definitions before rendering", async () => {
    for (const tex of [
      "\\href{javascript:alert(1)}{x}",
      "\\url{https://e}",
      "\\htmlClass{x}{y}",
      "\\def\\a{\\a\\a}\\a",
    ]) {
      const res = await renderTex(tex, { display: false });
      expect(res.html, tex).toBe("");
      expect(res.error?.message, tex).toMatch(/not allowed/);
    }
  });

  it("bounds macro expansion so a bomb cannot hang the tab", async () => {
    const res = await renderTex("\\mathrm{" + "\\frac{1}{2}".repeat(10) + "}", {
      display: false,
    });
    expect(res.error).toBeUndefined();
  });

  it("lint finds unbalanced braces and length", () => {
    expect(lintTex("a}")?.message).toBe("unmatched }");
    expect(lintTex("{a")?.message).toBe("missing }");
    expect(lintTex("x".repeat(2001))?.message).toMatch(/max 2000/);
    expect(lintTex("\\{a")).toBeNull();
  });
});
