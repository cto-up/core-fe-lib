# Themed SVG

Render user-supplied SVG safely, coloured by the host theme.

## Render a drawing

1. Import `ThemedSvg` from `core-fe-lib/components-shadcn/svg/ThemedSvg.vue`.
2. Pass `svg` (markup) and `title` (accessible name; `""` = decorative).
   Check: the `<svg>` has `role="img"` and a `<title>`.
3. Optional: `theme-css` (a theme stylesheet), `desc`, `max-height`.
   Check: listen to `@sanitized` to report removed content to the author.

## Draw with roles, not colours

| Class | Paints | Falls back to |
| --- | --- | --- |
| `t-fill-ink` / `t-ink` | text and outlines | `--foreground` |
| `t-fill-surface` | backgrounds | `--card` |
| `t-fill-muted` | secondary text | `--muted-foreground` |
| `t-stroke-line` | dividers, connectors | `--border` |
| `t-fill-accent-1` … `accent-6` | meaning: main, second… | `--primary`, `--chart-2..5`, `--chart-1` |

Every class has a `t-stroke-<role>` twin. Fonts: `--svg-font-body`, `--svg-font-display` (class `t-display`).

## Write a theme

A theme sets `--svg-<role>` on `.svg-theme` (or `.lms-theme`, `:root`), with an optional `.dark .svg-theme` block:

```css
.svg-theme { --svg-accent-1: #ffb627; --svg-ink: #1a1430; }
.dark .svg-theme { --svg-ink: #f5f3ff; }
```

> Note: rules are scoped to the instance. `@import`, `@font-face`, remote `url()`, `<`, `expression()` are dropped.

## What sanitizing removes

Elements outside the SVG allowlist (`SVG_ALLOWED_ELEMENTS` in `svgSanitize.ts`: script, foreignObject, iframe, SMIL animation…), `on*` attributes, any `href` that is not `#local` (or a base64 PNG/JPEG/GIF/WebP on `<image>`), DOCTYPE/entities, and malformed XML (renders nothing).
The backend (`service/svgsanitize` in lms) mirrors the allowlist.

## Check contrast

`contrast.ts` (`contrastOf`, `passes`, `nearestPassing`) and `ContrastBadge.vue`: 4.5:1 for text, 3:1 for shapes, everywhere.
