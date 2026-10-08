import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The auth pages hide late-arriving sections with the `hidden` ATTRIBUTE rather
 * than `v-if` (see SignupPage.vue). The UA rule `[hidden] { display: none }`
 * loses to any display utility on the same element, so `class="grid"` plus
 * `:hidden` stays visible: the sign-in page showed its "OR" divider with no
 * social provider above it (lms#111). An element that sets a display utility
 * must also carry `[&[hidden]]:hidden`.
 */

const AUTH_DIR = dirname(fileURLToPath(import.meta.url));
const DISPLAY =
  /(?:^|\s)(?:grid|flex|block|inline-flex|inline-block|inline-grid|table)(?:\s|$)/;
const TAG_WITH_HIDDEN = /<[a-zA-Z][^>]*?:hidden="[^"]*"[^>]*>/g;

function offenders(source: string): string[] {
  return [...source.matchAll(TAG_WITH_HIDDEN)]
    .map((m) => m[0])
    .filter((tag) => {
      const cls = tag.match(/\sclass="([^"]*)"/)?.[1] ?? "";
      return DISPLAY.test(cls) && !cls.includes("[&[hidden]]:hidden");
    });
}

describe("hidden attribute on auth pages", () => {
  it("is never overridden by a display utility", () => {
    const found = readdirSync(AUTH_DIR)
      .filter((f) => f.endsWith(".vue"))
      .flatMap((f) =>
        offenders(readFileSync(join(AUTH_DIR, f), "utf8")).map(
          (tag) => `${f}: ${tag}`
        )
      );
    expect(found).toEqual([]);
  });

  it("flags the shape that showed the orphan OR", () => {
    expect(
      offenders('<div class="grid gap-4" :hidden="!oidcProviders.length">')
    ).toHaveLength(1);
    expect(
      offenders(
        '<div class="grid gap-4 [&[hidden]]:hidden" :hidden="!oidcProviders.length">'
      )
    ).toHaveLength(0);
    expect(
      offenders('<div class="space-y-4" :hidden="!oidcProviders.length">')
    ).toHaveLength(0);
  });
});
