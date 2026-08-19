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
 * Pre-existing offenders, left alone deliberately.
 *
 * These paint self-consistent colour chips — a green tick on a green-100
 * badge, a red error line — which look wrong against a dark page but stay
 * READABLE, because the text colour and the surface under it were chosen
 * together. That is a different problem from the MFA dialogs, where themed
 * text sat on an opaque white panel and disappeared.
 *
 * The list is here rather than absent so the guard still protects everything
 * else, and so these stay visible as work rather than passing unnoticed.
 * Shrinking it is always an improvement; growing it needs a reason.
 */
const KNOWN_EXCEPTIONS = new Set<string>([
  "Aal2VerificationDialog.vue",
  "EmailVerification.vue",
  "PasswordResetRequestPage.vue",
  "RecoveryPage.vue",
  "RegisterWebauthnPage.vue",
  "SigninPage.vue",
  "SignupPage.vue",
]);

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
