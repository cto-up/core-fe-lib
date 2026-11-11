import type { Plugin } from "vite";
import type { Brand } from "./brand";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Fills `%BRAND_NAME%`, `%BRAND_DESCRIPTION%`, `%BRAND_THEME_COLOR%`,
 * `%BRAND_MASK_COLOR%` and `%BRAND_FONTS_HREF%` in index.html from the
 * product's brand.json, so renaming a product is a one-file change.
 * Fails the build when a placeholder is left unfilled.
 */
export function brandHtml(brand: Brand): Plugin {
  const values: Record<string, string> = {
    BRAND_NAME: brand.name,
    BRAND_DESCRIPTION: brand.description,
    BRAND_THEME_COLOR: brand.themeColor,
    BRAND_MASK_COLOR: brand.maskColor,
    BRAND_FONTS_HREF: brand.fontsHref,
  };
  return {
    name: "core-fe-lib:brand-html",
    transformIndexHtml(html) {
      const out = html.replace(/%(BRAND_[A-Z_]+)%/g, (match, key: string) =>
        key in values ? escape(values[key]) : match
      );
      const left = out.match(/%BRAND_[A-Z_]+%/);
      if (left) throw new Error(`brand.json has no value for ${left[0]}`);
      return out;
    },
  };
}
