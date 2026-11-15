import { describe, expect, it } from "vitest";
import {
  MATH_TEMPLATES,
  insertTemplate,
  searchTemplates,
  unicodeToTex,
} from "./mathTemplates";
import { renderTex } from "./mathRender";

describe("math palette", () => {
  it("every template renders once its placeholders are filled", async () => {
    for (const m of MATH_TEMPLATES) {
      const tex = m.tex.replace(/◻/g, "x");
      const res = await renderTex(
        tex.startsWith("^") || tex.startsWith("_") ? `x${tex}` : tex,
        { display: false }
      );
      expect(res.error, `${m.id}: ${res.error?.message}`).toBeUndefined();
    }
  });

  it("searches in English and French", () => {
    expect(searchTemplates("integral").map((m) => m.id)).toContain("int");
    expect(searchTemplates("intégrale").map((m) => m.id)).toContain("int");
    expect(searchTemplates("racine").map((m) => m.id)).toEqual(
      expect.arrayContaining(["sqrt", "nroot"])
    );
  });

  it("inserts at the cursor and returns the placeholder stops", () => {
    const r = insertTemplate("a + b", 4, 5, "\\frac{◻}{◻}");
    expect(r.text).toBe("a + \\frac{}{}");
    expect(r.stops).toEqual([10, 12]);
  });

  it("converts the 20 most common Unicode maths to TeX", () => {
    const cases: [string, string][] = [
      ["E = mc²", "E = mc^{2}"],
      ["½ m v²", "\\frac{1}{2} m v^{2}"],
      ["a × b", "a \\times b"],
      ["a ÷ b", "a \\div b"],
      ["x ≤ 3", "x \\leq 3"],
      ["x ≥ 3", "x \\geq 3"],
      ["x ≠ 0", "x \\neq 0"],
      ["π ≈ 3.14", "\\pi \\approx 3.14"],
      ["√2", "\\sqrt{2}"],
      ["√(x+1)", "\\sqrt{x+1}"],
      ["∑ x", "\\sum x"],
      ["∫ f", "\\int f"],
      ["x → ∞", "x \\to \\infty"],
      ["a ⇒ b", "a \\Rightarrow b"],
      ["x ∈ ℝ", "x \\in \\mathbb{R}"],
      ["A ∪ B", "A \\cup B"],
      ["A ∩ B", "A \\cap B"],
      ["α + β", "\\alpha + \\beta"],
      ["ΔT", "\\Delta T"],
      ["x³", "x^{3}"],
    ];
    for (const [input, want] of cases)
      expect(unicodeToTex(input), input).toBe(want);
  });
});
