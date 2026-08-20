import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Dark mode is class-based (composables/useDark.ts toggles `.dark` on the root
 * element), so a component painted in the raw Tailwind palette does not follow
 * the theme — it just stays light while everything around it turns dark.
 *
 * The MFA dialogs were written that way: a `bg-white` panel with no `dark:`
 * variant anywhere, so in dark mode the heading inherited a near-white
 * `text-foreground` and landed on a white card. The title of the "save your
 * recovery codes" dialog was invisible — reported as "text difficult to read in
 * Save Dialog when enabling MFA".
 *
 * The bug is invisible to `vue-tsc`, to the bundler, and to anyone running in
 * light mode, which is why it shipped. This test is the check that a hardcoded
 * colour on an auth surface is caught at build time.
 */

const AUTH_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Raw-palette classes that carry a colour. A theme token (bg-background,
 * text-muted-foreground, border-border, bg-warning/10 …) resolves through the
 * CSS variables the `.dark` class swaps; these do not.
 *
 * bg-black/bg-white with an opacity suffix are allowed for modal scrims — a
 * translucent black overlay is correct in both themes.
 */
const RAW_COLOUR = new RegExp(
  [
    String.raw`\b(?:bg|text|border|ring|fill|stroke|from|to|via)-`,
    String.raw`(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-`,
    String.raw`\d{2,3}\b`,
  ].join(""),
  "g"
);

/** `bg-white` / `text-black` and friends, except as a translucent scrim. */
const RAW_BW = /\b(?:bg|text|border)-(?:white|black)\b(?!\/)/g;

/**
 * Files exempt from the check. Empty, and worth keeping that way.
 *
 * It held seven entries when this guard was written — components painting
 * self-consistent colour chips, which look wrong against a dark page but stay
 * readable, unlike the MFA panels where themed text vanished into an opaque
 * white surface. They are now on the semantic tokens (success / destructive /
 * warning / info) that the Button variants already define, so a chip's tint and
 * its icon come from one pair and cannot drift apart.
 */
const KNOWN_EXCEPTIONS = new Set<string>([]);

function componentFiles(): string[] {
  return readdirSync(AUTH_DIR)
    .filter((f) => f.endsWith(".vue"))
    .filter((f) => !KNOWN_EXCEPTIONS.has(f));
}

/** Offending class names in a file's template, with `dark:`-guarded ones allowed. */
function rawColours(file: string): string[] {
  const src = readFileSync(join(AUTH_DIR, file), "utf8");
  const hits = [...(src.match(RAW_COLOUR) ?? []), ...(src.match(RAW_BW) ?? [])];
  // A raw colour is fine when the file also defines its dark counterpart.
  return hits.filter((c) => !src.includes(`dark:${c}`));
}

describe("auth components follow the theme", () => {
  it("finds the components", () => {
    // Guards against a path change making every assertion vacuously true.
    expect(componentFiles().length).toBeGreaterThan(5);
  });

  it.each(componentFiles())(
    "%s uses theme tokens, not the raw palette",
    (file) => {
      expect(
        rawColours(file),
        `${file} hardcodes colours that ignore dark mode`
      ).toEqual([]);
    }
  );

  it("keeps the MFA dialogs on a themed surface", () => {
    // The specific regression: an opaque panel that does not follow the theme
    // leaves the text on it unreadable in the other one.
    for (const file of ["TotpSetupModal.vue", "RecoveryCodesModal.vue"]) {
      const src = readFileSync(join(AUTH_DIR, file), "utf8");
      expect(src, `${file} must paint its panel with a token`).toContain(
        "bg-background"
      );
    }
  });
});
