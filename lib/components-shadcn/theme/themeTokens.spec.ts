import { describe, expect, it } from "vitest";
import {
  deriveDark,
  hexToTriplet,
  parseThemeCss,
  scopeThemeCss,
  serializeThemeCss,
} from "./themeTokens";

describe("themeTokens", () => {
  it("parses, converts hex for hsl tokens, and serializes canonically like the server", () => {
    const p = parseThemeCss(
      `/* c */\n.lms-theme { --primary: #ffb627; --svg-accent-1: #ffb627; --radius: 0.75rem; --font-display: "Bricolage Grotesque", sans-serif; }`
    );
    expect(p.errors).toEqual([]);
    expect(p.light["--primary"]).toBe("39.7 100% 57.6%");
    expect(p.light["--svg-accent-1"]).toBe("#ffb627");
    const css = serializeThemeCss(p.light);
    expect(css).toBe(
      `.lms-theme {\n  --font-display: "Bricolage Grotesque", sans-serif;\n  --primary: 39.7 100% 57.6%;\n  --radius: 0.75rem;\n  --svg-accent-1: #ffb627;\n}\n`
    );
    expect(serializeThemeCss(parseThemeCss(css).light)).toBe(css);
  });

  it("reports refused rules with their line and reason", () => {
    const p = parseThemeCss(
      ".lms-theme {\n  --primary: #fff;\n  --bad: 1;\n}\nbody { --primary: #000; }\n@import url(x);"
    );
    expect(p.errors.map((e) => e.line)).toEqual([3, 5, 6]);
    expect(p.errors.every((e) => e.reason)).toBe(true);
  });

  it("derives dark surfaces by flipping lightness; explicit dark values win", () => {
    const d = deriveDark(
      { "--background": "0 0% 100%", "--primary": "40 100% 58%" },
      {}
    );
    expect(d["--background"]).toBe("0 0% 0%");
    expect(d["--primary"]).toBeUndefined();
    expect(
      deriveDark(
        { "--background": "0 0% 100%" },
        { "--background": "220 20% 10%" }
      )["--background"]
    ).toBe("220 20% 10%");
  });

  it("scopes a theme to a preview container in light and dark", () => {
    const out = scopeThemeCss(
      ".lms-theme { --a: 1 }\n.dark .lms-theme { --a: 2 }",
      '[data-theme-scope="x"]'
    );
    expect(out).toContain('[data-theme-scope="x"] { --a: 1 }');
    expect(out).toContain(
      '.dark [data-theme-scope="x"], [data-theme-scope="x"].dark { --a: 2 }'
    );
  });

  it("converts hex like the server", () => {
    expect(hexToTriplet("#ffffff")).toBe("0 0% 100%");
  });
});
