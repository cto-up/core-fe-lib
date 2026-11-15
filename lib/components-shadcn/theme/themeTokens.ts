// Theme tokens: the one list of what a theme stylesheet may set, mirrored by the
// lms backend sanitizer (service/themecss, kept in sync by a Go test that reads
// this file). A theme is `.lms-theme { --token: value; }` plus an optional
// `.dark .lms-theme { … }` block.

import { parseColor } from "../svg/contrast";

export type TokenKind = "triplet" | "colour" | "length" | "font";

export interface ThemeToken {
  name: string;
  kind: TokenKind;
  /** i18n key suffix under theme.tokens.* */
  label: string;
  /** Neutral surfaces flip lightness for dark mode; accents keep their colour. */
  surface?: boolean;
}

export interface ThemeTokenGroup {
  id:
    | "basics"
    | "surface"
    | "text"
    | "accent"
    | "charts"
    | "drawings"
    | "maths";
  tokens: ThemeToken[];
  /** Shown to every author; the rest sit under "More colours". */
  basic?: boolean;
}

const tr = (name: string, label: string, surface = false): ThemeToken => ({
  name,
  kind: "triplet",
  label,
  surface,
});
const co = (name: string, label: string): ThemeToken => ({
  name,
  kind: "colour",
  label,
});

export const THEME_TOKENS: ThemeTokenGroup[] = [
  {
    id: "basics",
    basic: true,
    tokens: [
      tr("--primary", "accent"),
      { name: "--font-display", kind: "font", label: "headingFont" },
      { name: "--font-sans", kind: "font", label: "bodyFont" },
      { name: "--radius", kind: "length", label: "radius" },
    ],
  },
  {
    id: "surface",
    tokens: [
      tr("--background", "background", true),
      tr("--card", "card", true),
      tr("--popover", "popover", true),
      tr("--muted", "muted", true),
      tr("--secondary", "secondary", true),
      tr("--accent", "accentSurface", true),
      tr("--border", "border", true),
      tr("--input", "input", true),
      tr("--ring", "ring"),
    ],
  },
  {
    id: "text",
    tokens: [
      tr("--foreground", "foreground", true),
      tr("--card-foreground", "cardForeground", true),
      tr("--popover-foreground", "popoverForeground", true),
      tr("--muted-foreground", "mutedForeground", true),
      tr("--secondary-foreground", "secondaryForeground", true),
      tr("--accent-foreground", "accentForeground", true),
      tr("--primary-foreground", "primaryForeground"),
      tr("--primary-text", "primaryText"),
    ],
  },
  {
    id: "charts",
    tokens: [1, 2, 3, 4, 5, 6].map((i) => tr(`--lms-chart-${i}`, `chart${i}`)),
  },
  {
    id: "drawings",
    tokens: [
      co("--svg-ink", "svgInk"),
      co("--svg-surface", "svgSurface"),
      co("--svg-muted", "svgMuted"),
      co("--svg-line", "svgLine"),
      ...[1, 2, 3, 4, 5, 6].map((i) =>
        co(`--svg-accent-${i}`, `svgAccent${i}`)
      ),
      { name: "--svg-font-display", kind: "font", label: "svgHeadingFont" },
      { name: "--svg-font-body", kind: "font", label: "svgBodyFont" },
    ],
  },
  {
    id: "maths",
    tokens: [
      co("--math-ink", "mathInk"),
      co("--math-accent", "mathAccent"),
      co("--math-muted", "mathMuted"),
    ],
  },
];

export const ALL_TOKENS: ThemeToken[] = THEME_TOKENS.flatMap((g) => g.tokens);
const BY_NAME = new Map(ALL_TOKENS.map((t) => [t.name, t]));

export const THEME_FONTS = [
  "Bricolage Grotesque",
  "Onest",
  "Inter",
  "Carlito",
  "JetBrains Mono",
  "system-ui",
  "ui-sans-serif",
  "sans-serif",
  "serif",
  "monospace",
];

export type TokenMap = Record<string, string>;

export interface ParsedTheme {
  light: TokenMap;
  dark: TokenMap;
  errors: { line: number; rule: string; reason: string }[];
}

const TRIPLET = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FUNC_COLOUR = /^(rgb|rgba|hsl|hsla)\(\s*[\d.%\s,/]+\)$/i;
const LENGTH = /^\d{1,3}(\.\d+)?(rem|px|em)$/;
const DANGER = /url\(|image-set|@import|expression|javascript:|</i;

/** Hex → "H S% L%" (rounded to 0.1, like the server). */
export function hexToTriplet(hex: string): string {
  const c = parseColor(hex);
  if (!c) return hex;
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const f = (x: number) => String(Math.round(x * 10) / 10);
  return `${f(h)} ${f(s * 100)}% ${f(l * 100)}%`;
}

/** Any colour token value → #rrggbb for colour pickers. */
export function toHex(value: string): string {
  const c = parseColor(value);
  if (!c) return "#000000";
  return `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Check one value; returns the canonical value or a reason. */
export function checkValue(
  name: string,
  value: string
): { value?: string; reason?: string } {
  const tok = BY_NAME.get(name);
  if (!tok) return { reason: "only theme tokens can be set" };
  const v = value.trim();
  if (!v) return { reason: "empty value" };
  if (v.length > 200) return { reason: "value longer than 200 characters" };
  if (DANGER.test(v))
    return {
      reason: "url(), image-set(), @import, expression() and < are not allowed",
    };
  switch (tok.kind) {
    case "triplet":
      if (TRIPLET.test(v)) return { value: v.split(/\s+/).join(" ") };
      if (HEX.test(v)) return { value: hexToTriplet(v) };
      return { reason: 'expected a colour: "#ffb627" or "42 100% 58%"' };
    case "colour":
      if (HEX.test(v) || FUNC_COLOUR.test(v)) return { value: v };
      if (TRIPLET.test(v)) return { value: `hsl(${v.split(/\s+/).join(" ")})` };
      return { reason: 'expected a colour: "#ffb627", "rgb(…)" or "hsl(…)"' };
    case "length":
      return LENGTH.test(v)
        ? { value: v }
        : { reason: 'expected a length like "0.75rem"' };
    case "font": {
      const out: string[] = [];
      for (const part of v.split(",")) {
        const name = part.trim().replace(/^["']|["']$/g, "");
        const ok = THEME_FONTS.find(
          (f) => f.toLowerCase() === name.toLowerCase()
        );
        if (!ok) return { reason: `font "${name}" is not available` };
        out.push(ok.includes(" ") ? `"${ok}"` : ok);
      }
      return { value: out.join(", ") };
    }
  }
}

/** Parse a theme stylesheet the way the server will (for inline feedback). */
export function parseThemeCss(css: string): ParsedTheme {
  const out: ParsedTheme = { light: {}, dark: {}, errors: [] };
  const src = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ""));
  if (src.includes("\\")) {
    out.errors.push({
      line: src.slice(0, src.indexOf("\\")).split("\n").length,
      rule: "\\",
      reason: "CSS escapes are not allowed in a theme",
    });
    return out;
  }
  const re = /([^{}]*)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  let consumed = 0;
  while ((m = re.exec(src))) {
    const startLine =
      src.slice(0, m.index).split("\n").length +
      (m[1].match(/^\s*/)?.[0].split("\n").length ?? 1) -
      1;
    const selector = m[1].trim().replace(/\s+/g, " ");
    consumed = re.lastIndex;
    const target =
      selector === ".lms-theme"
        ? out.light
        : selector === ".dark .lms-theme"
          ? out.dark
          : null;
    if (!target) {
      out.errors.push({
        line: startLine,
        rule: selector.slice(0, 60),
        reason: selector.startsWith("@")
          ? "at-rules are not allowed in a theme"
          : "only .lms-theme and .dark .lms-theme can be styled",
      });
      continue;
    }
    let line = src.slice(0, m.index + m[1].length).split("\n").length;
    for (const decl of m[2].split(";")) {
      const at = line + (decl.match(/^\s*/)?.[0].split("\n").length ?? 1) - 1;
      line += decl.split("\n").length - 1;
      const d = decl.trim();
      if (!d) continue;
      const i = d.indexOf(":");
      if (i < 0) {
        out.errors.push({
          line: at,
          rule: d.slice(0, 60),
          reason: "not a declaration",
        });
        continue;
      }
      const name = d.slice(0, i).trim();
      const res = checkValue(name, d.slice(i + 1));
      if (res.reason)
        out.errors.push({ line: at, rule: d.slice(0, 60), reason: res.reason });
      else target[name] = res.value!;
    }
  }
  const rest = src.slice(consumed).trim();
  if (rest)
    out.errors.push({
      line: src.split("\n").length,
      rule: rest.slice(0, 60),
      reason: "text outside a rule",
    });
  return out;
}

/** Lightness flipped for dark mode, same hue and saturation. */
export function flipLightness(triplet: string): string {
  const m = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(triplet.trim());
  if (!m) return triplet;
  const l = Math.round((100 - Number(m[3])) * 10) / 10;
  return `${m[1]} ${m[2]}% ${l}%`;
}

/**
 * Dark values derived from light ones: neutral surfaces flip lightness, the
 * rest keep their colour. Explicit dark values win.
 */
export function deriveDark(light: TokenMap, dark: TokenMap): TokenMap {
  const out: TokenMap = {};
  for (const [name, value] of Object.entries(light)) {
    const tok = BY_NAME.get(name);
    if (tok?.kind === "triplet" && tok.surface)
      out[name] = flipLightness(value);
  }
  return { ...out, ...dark };
}

/** Canonical stylesheet, identical to the server's serialization. */
export function serializeThemeCss(
  light: TokenMap,
  dark: TokenMap = {}
): string {
  const block = (sel: string, m: TokenMap) => {
    const keys = Object.keys(m).sort();
    if (!keys.length) return "";
    return `${sel} {\n${keys.map((k) => `  ${k}: ${m[k]};\n`).join("")}}\n`;
  };
  return block(".lms-theme", light) + block(".dark .lms-theme", dark);
}

/**
 * Confine a theme stylesheet to `scope` (an attribute selector): `.lms-theme`
 * becomes the scope, `.dark .lms-theme` the scope in dark mode (inside a
 * `.dark` ancestor or carrying `.dark` itself).
 */
export function scopeThemeCss(css: string, scope: string): string {
  return css
    .replace(/\.dark\s+\.lms-theme/g, `.dark ${scope}, ${scope}.dark`)
    .replace(/\.lms-theme/g, scope);
}
