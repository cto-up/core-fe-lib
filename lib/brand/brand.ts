/**
 * A product's identity outside CSS: what the browser, the installed app and the
 * support widget call it. Each consumer keeps one in `src/brand/brand.json`;
 * its colours, faces and radius live beside it in `src/brand/identity.css`.
 */
export interface Brand {
  /** Shown in the tab, the PWA and the support widget. */
  name: string;
  /** The meta description and the PWA description. */
  description: string;
  /** Platform logo, a path under `public/`. */
  logo: string;
  /** Browser chrome and PWA theme colour, as hex. */
  themeColor: string;
  /** Tint of the Safari pinned-tab mask, as hex. */
  maskColor: string;
  /** The Google Fonts stylesheet the product's faces load from. */
  fontsHref: string;
}
