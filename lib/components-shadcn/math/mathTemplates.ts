// The MathEditor palette: what a click inserts. "◻" marks a placeholder the
// cursor jumps to (Tab moves to the next one); it never reaches the TeX.

export interface MathTemplate {
  id: string;
  tex: string;
  label: { en: string; fr: string };
  keywords: string[];
  group:
    | "basics"
    | "greek"
    | "operators"
    | "relations"
    | "arrows"
    | "sets"
    | "calculus"
    | "matrices";
}

const t = (
  id: string,
  tex: string,
  en: string,
  fr: string,
  group: MathTemplate["group"],
  keywords: string[] = []
): MathTemplate => ({
  id,
  tex,
  label: { en, fr },
  group,
  keywords,
});

const GREEK: [string, string][] = [
  ["alpha", "alpha"],
  ["beta", "bêta"],
  ["gamma", "gamma"],
  ["delta", "delta"],
  ["epsilon", "epsilon"],
  ["theta", "thêta"],
  ["lambda", "lambda"],
  ["mu", "mu"],
  ["pi", "pi"],
  ["rho", "rhô"],
  ["sigma", "sigma"],
  ["tau", "tau"],
  ["phi", "phi"],
  ["omega", "oméga"],
  ["Delta", "Delta"],
  ["Sigma", "Sigma"],
  ["Omega", "Oméga"],
];

export const MATH_TEMPLATES: MathTemplate[] = [
  t("frac", "\\frac{◻}{◻}", "Fraction", "Fraction", "basics", [
    "divide",
    "over",
    "quotient",
  ]),
  t("pow", "^{◻}", "Power", "Puissance", "basics", [
    "exponent",
    "square",
    "exposant",
    "carré",
  ]),
  t("sub", "_{◻}", "Subscript", "Indice", "basics", ["index"]),
  t("sqrt", "\\sqrt{◻}", "Square root", "Racine carrée", "basics", [
    "root",
    "racine",
  ]),
  t("nroot", "\\sqrt[◻]{◻}", "Nth root", "Racine n-ième", "basics", [
    "root",
    "racine",
  ]),
  t("paren", "\\left( ◻ \\right)", "Parentheses", "Parenthèses", "basics", [
    "brackets",
  ]),
  t("abs", "\\left| ◻ \\right|", "Absolute value", "Valeur absolue", "basics", [
    "modulus",
  ]),
  t("text", "\\text{◻}", "Text (units)", "Texte (unités)", "basics", [
    "unit",
    "unité",
    "words",
  ]),
  ...GREEK.map(([n, fr]) => t(n, `\\${n}`, n, fr, "greek", ["greek", "grec"])),
  t("times", "\\times", "Times", "Multiplié par", "operators", [
    "multiply",
    "fois",
  ]),
  t("div", "\\div", "Divided by", "Divisé par", "operators", ["divide"]),
  t("pm", "\\pm", "Plus or minus", "Plus ou moins", "operators"),
  t("cdot", "\\cdot", "Dot", "Point", "operators", ["multiply"]),
  t("sum", "\\sum_{◻}^{◻}", "Sum", "Somme", "operators", [
    "sigma",
    "series",
    "série",
  ]),
  t("prod", "\\prod_{◻}^{◻}", "Product", "Produit", "operators"),
  t("eq", "=", "Equals", "Égal", "relations"),
  t("neq", "\\neq", "Not equal", "Différent", "relations"),
  t("leq", "\\leq", "Less or equal", "Inférieur ou égal", "relations"),
  t("geq", "\\geq", "Greater or equal", "Supérieur ou égal", "relations"),
  t("approx", "\\approx", "Approximately", "Environ", "relations"),
  t("equiv", "\\equiv", "Equivalent", "Équivalent", "relations"),
  t("propto", "\\propto", "Proportional", "Proportionnel", "relations"),
  t("to", "\\to", "Tends to", "Tend vers", "arrows", ["arrow", "flèche"]),
  t("implies", "\\Rightarrow", "Implies", "Implique", "arrows", [
    "arrow",
    "flèche",
  ]),
  t("iff", "\\Leftrightarrow", "If and only if", "Équivaut à", "arrows", [
    "arrow",
  ]),
  t("mapsto", "\\mapsto", "Maps to", "Associe", "arrows"),
  t("in", "\\in", "Belongs to", "Appartient à", "sets", ["element"]),
  t("notin", "\\notin", "Does not belong to", "N'appartient pas à", "sets"),
  t("subset", "\\subset", "Subset", "Inclus dans", "sets"),
  t("cup", "\\cup", "Union", "Union", "sets"),
  t("cap", "\\cap", "Intersection", "Intersection", "sets"),
  t("empty", "\\emptyset", "Empty set", "Ensemble vide", "sets"),
  t("reals", "\\mathbb{R}", "Real numbers", "Réels", "sets", ["R"]),
  t("lim", "\\lim_{◻ \\to ◻}", "Limit", "Limite", "calculus"),
  t("deriv", "\\frac{d◻}{d◻}", "Derivative", "Dérivée", "calculus", [
    "differential",
  ]),
  t("partial", "\\partial", "Partial", "Dérivée partielle", "calculus"),
  t("int", "\\int_{◻}^{◻}", "Integral", "Intégrale", "calculus", ["intégrale"]),
  t("infty", "\\infty", "Infinity", "Infini", "calculus"),
  t(
    "pmatrix",
    "\\begin{pmatrix} ◻ & ◻ \\\\ ◻ & ◻ \\end{pmatrix}",
    "Matrix 2×2",
    "Matrice 2×2",
    "matrices",
    ["matrix"]
  ),
  t("vec", "\\vec{◻}", "Vector", "Vecteur", "matrices"),
];

export const PLACEHOLDER = "◻";

/** Search the palette in English or French. */
export function searchTemplates(q: string): MathTemplate[] {
  const s = q.trim().toLowerCase();
  if (!s) return MATH_TEMPLATES;
  return MATH_TEMPLATES.filter(
    (m) =>
      m.label.en.toLowerCase().includes(s) ||
      m.label.fr.toLowerCase().includes(s) ||
      m.keywords.some((k) => k.toLowerCase().includes(s)) ||
      m.id === s
  );
}

const UNICODE: [RegExp, string][] = [
  [/²/g, "^{2}"],
  [/³/g, "^{3}"],
  [/¹/g, "^{1}"],
  [/ⁿ/g, "^{n}"],
  [/½/g, "\\frac{1}{2}"],
  [/¼/g, "\\frac{1}{4}"],
  [/¾/g, "\\frac{3}{4}"],
  [/×/g, "\\times "],
  [/÷/g, "\\div "],
  [/±/g, "\\pm "],
  [/·/g, "\\cdot "],
  [/≤/g, "\\leq "],
  [/≥/g, "\\geq "],
  [/≠/g, "\\neq "],
  [/≈/g, "\\approx "],
  [/≡/g, "\\equiv "],
  [/∞/g, "\\infty "],
  [/∑/g, "\\sum "],
  [/∏/g, "\\prod "],
  [/∫/g, "\\int "],
  [/∂/g, "\\partial "],
  [/→/g, "\\to "],
  [/⇒/g, "\\Rightarrow "],
  [/⇔/g, "\\Leftrightarrow "],
  [/∈/g, "\\in "],
  [/∉/g, "\\notin "],
  [/∪/g, "\\cup "],
  [/∩/g, "\\cap "],
  [/∅/g, "\\emptyset "],
  [/ℝ/g, "\\mathbb{R}"],
  [/√\(([^)]*)\)/g, "\\sqrt{$1}"],
  [/√(\w+)/g, "\\sqrt{$1}"],
  [/α/g, "\\alpha "],
  [/β/g, "\\beta "],
  [/γ/g, "\\gamma "],
  [/δ/g, "\\delta "],
  [/ε/g, "\\epsilon "],
  [/θ/g, "\\theta "],
  [/λ/g, "\\lambda "],
  [/μ/g, "\\mu "],
  [/π/g, "\\pi "],
  [/ρ/g, "\\rho "],
  [/σ/g, "\\sigma "],
  [/τ/g, "\\tau "],
  [/φ/g, "\\phi "],
  [/ω/g, "\\omega "],
  [/Δ/g, "\\Delta "],
  [/Σ/g, "\\Sigma "],
  [/Ω/g, "\\Omega "],
];

/** Convert pasted Unicode maths ("E = mc²", "½ m v²") to TeX. */
export function unicodeToTex(s: string): string {
  let out = s;
  for (const [re, tex] of UNICODE) out = out.replace(re, tex);
  return out.replace(/ +/g, " ").trim();
}

/** Insert a template at [start,end): returns the new text and the placeholder offsets. */
export function insertTemplate(
  text: string,
  start: number,
  end: number,
  tex: string
): { text: string; stops: number[] } {
  const stops: number[] = [];
  let clean = "";
  for (const ch of tex) {
    if (ch === PLACEHOLDER) stops.push(start + clean.length);
    else clean += ch;
  }
  const next = text.slice(0, start) + clean + text.slice(end);
  if (!stops.length) stops.push(start + clean.length);
  return { text: next, stops };
}
