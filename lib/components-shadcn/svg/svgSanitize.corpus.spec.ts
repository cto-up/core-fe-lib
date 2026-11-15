import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { sanitizeSvg } from "./svgSanitize";

// The shared XSS corpus (#282). The Go sanitizer (lms service/svgsanitize) runs
// the same files against the same manifest: the two halves of one policy must
// agree on every payload.
const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  "testdata",
  "svg-xss"
);
interface Case {
  file: string;
  expect: "blocked" | "allowed";
  bad?: string;
  keep?: string;
  why: string;
}
const manifest = JSON.parse(
  readFileSync(join(dir, "manifest.json"), "utf8")
) as Case[];

function re(src: string): RegExp {
  return src.startsWith("(?i)")
    ? new RegExp(src.slice(4), "i")
    : new RegExp(src);
}

describe("svg XSS corpus", () => {
  it("lists every file in the manifest", () => {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".svg"))
      .sort();
    expect(files).toEqual(manifest.map((c) => c.file).sort());
    expect(manifest.length).toBeGreaterThanOrEqual(40);
  });

  for (const c of manifest) {
    it(`${c.expect}: ${c.file} (${c.why})`, () => {
      const { svg, removed } = sanitizeSvg(
        readFileSync(join(dir, c.file), "utf8")
      );
      if (c.expect === "blocked") {
        expect(svg).not.toMatch(re(c.bad!));
        expect(svg === "" || removed.length > 0).toBe(true);
      } else {
        expect(svg).toContain(c.keep!);
        expect(removed).toEqual([]);
      }
    });
  }
});
