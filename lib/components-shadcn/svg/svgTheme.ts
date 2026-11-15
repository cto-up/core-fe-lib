// The SVG theme contract. A drawing never names a colour: it names a ROLE through
// a utility class (t-fill-<role>, t-stroke-<role>, t-ink). A theme is a CSS
// stylesheet that sets --svg-<role>. When nothing sets a role, the class falls
// back to the surrounding shadcn token, so a drawing follows the host theme and
// light/dark mode with no theme at all.

export const SVG_ROLES = [
  "ink",
  "surface",
  "muted",
  "line",
  "accent-1",
  "accent-2",
  "accent-3",
  "accent-4",
  "accent-5",
  "accent-6",
] as const;

export type SvgRole = (typeof SVG_ROLES)[number];

export interface SvgTheme {
  name: string;
  label: string;
  css: string;
}

/** The shadcn token each role falls back to (values are "H S% L%" triplets). */
export const SVG_ROLE_FALLBACK: Record<SvgRole, string> = {
  ink: "hsl(var(--foreground))",
  surface: "hsl(var(--card))",
  muted: "hsl(var(--muted-foreground))",
  line: "hsl(var(--border))",
  "accent-1": "hsl(var(--primary))",
  "accent-2": "hsl(var(--chart-2))",
  "accent-3": "hsl(var(--chart-3))",
  "accent-4": "hsl(var(--chart-4))",
  "accent-5": "hsl(var(--chart-5))",
  "accent-6": "hsl(var(--chart-1))",
};

export const SVG_FONT_VARS = ["--svg-font-display", "--svg-font-body"] as const;

export function roleVar(role: SvgRole): string {
  return `var(--svg-${role}, ${SVG_ROLE_FALLBACK[role]})`;
}

/**
 * Utility classes every ThemedSvg ships, scoped under `scope`. Roles read the
 * custom property first, so any ancestor (a course theme) or a theme stylesheet
 * can set them; the fallback is the host's shadcn token.
 */
export function roleClassesCss(scope: string): string {
  const rules: string[] = [];
  for (const role of SVG_ROLES) {
    rules.push(`${scope} .t-fill-${role}{fill:${roleVar(role)}}`);
    rules.push(`${scope} .t-stroke-${role}{stroke:${roleVar(role)}}`);
  }
  rules.push(`${scope} .t-ink{fill:${roleVar("ink")}}`);
  rules.push(
    `${scope} text{font-family:var(--svg-font-body, inherit)}`,
    `${scope} .t-display{font-family:var(--svg-font-display, var(--svg-font-body, inherit))}`
  );
  return rules.join("\n");
}

/** An explicit theme equal to the fallbacks: the starting point for editors. */
export const DEFAULT_SVG_THEME_CSS = `.svg-theme {\n${SVG_ROLES.map(
  (r) => `  --svg-${r}: ${SVG_ROLE_FALLBACK[r]};`
).join("\n")}\n}\n`;

export const DEFAULT_SVG_THEME: SvgTheme = {
  name: "default",
  label: "Default",
  css: DEFAULT_SVG_THEME_CSS,
};
