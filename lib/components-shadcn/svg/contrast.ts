// WCAG contrast helpers shared by every editor that previews a theme
// (SvgDesigner, ThemeEditor, the drawings library). One set of thresholds.

export const CONTRAST_TEXT = 4.5;
export const CONTRAST_SHAPE = 3;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sf = s / 100;
  const lf = l / 100;
  const a = sf * Math.min(lf, 1 - lf);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (lf - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

/**
 * Parse a colour: #rgb, #rrggbb, rgb(r g b) / rgb(r, g, b), hsl(h s% l%),
 * or a bare shadcn triplet "H S% L%". Returns null when it cannot.
 */
export function parseColor(input: string): Rgb | null {
  const v = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    const h =
      hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
    };
  }
  const nums = (s: string) =>
    s
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map((p) => Number.parseFloat(p));
  const rgb = /^rgba?\((.+)\)$/.exec(v);
  if (rgb) {
    const [r, g, b] = nums(rgb[1]);
    return [r, g, b].some(Number.isNaN) ? null : { r, g, b };
  }
  const hsl = /^hsla?\((.+)\)$/.exec(v);
  const triplet = hsl
    ? hsl[1]
    : /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(v)
      ? v
      : null;
  if (triplet) {
    const [h, s, l] = nums(triplet.replace(/%/g, ""));
    return [h, s, l].some(Number.isNaN) ? null : hslToRgb(h, s, l);
  }
  return null;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastOf(fg: string, bg: string): number | null {
  const a = parseColor(fg);
  const b = parseColor(bg);
  return a && b ? contrastRatio(a, b) : null;
}

export function passes(ratio: number, kind: "text" | "shape"): boolean {
  return ratio >= (kind === "text" ? CONTRAST_TEXT : CONTRAST_SHAPE);
}

function rgbToHsl({ r, g, b }: Rgb): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rf) h = (gf - bf) / d + (gf < bf ? 6 : 0);
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * The nearest colour with the same hue and saturation that reaches the target
 * ratio against `bg`, as hex — the "use a darker/lighter shade" fix.
 */
export function nearestPassing(
  fg: string,
  bg: string,
  kind: "text" | "shape" = "text"
): string | null {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const target = kind === "text" ? CONTRAST_TEXT : CONTRAST_SHAPE;
  if (contrastRatio(f, b) >= target) return toHex(f);
  const [h, s, l] = rgbToHsl(f);
  for (let step = 1; step <= 100; step++) {
    for (const dir of [-1, 1]) {
      const nl = l + dir * step;
      if (nl < 0 || nl > 100) continue;
      const c = hslToRgb(h, s, nl);
      if (contrastRatio(c, b) >= target) return toHex(c);
    }
  }
  return null;
}
