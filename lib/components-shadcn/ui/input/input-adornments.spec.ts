import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * An absolutely placed icon or prefix before an <Input> is painted under it:
 * Input's wrapper is `relative` and comes later in the DOM, so its background
 * covers the icon unless the icon sits on z-10. pointer-events-none keeps a
 * click on the icon landing in the field (lms#54, lms#64).
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return vueFiles(path);
    return name.endsWith(".vue") ? [path] : [];
  });
}

function adornmentsBeforeInput(source: string): string[] {
  const found: string[] = [];
  for (const input of source.matchAll(/<Input\b/g)) {
    const before = source.slice(Math.max(0, input.index! - 600), input.index);
    const tags = [...before.matchAll(/<([A-Za-z][\w-]*)\b([^<>]*?)\/?>/gs)];
    for (const tag of tags.slice(-3)) {
      const cls = tag[2].match(/\bclass="([^"]*)"/)?.[1] ?? "";
      if (/\babsolute\b/.test(cls) && /\b(left|right)-/.test(cls))
        found.push(cls.replace(/\s+/g, " "));
    }
  }
  return found;
}

describe("icons placed before an <Input>", () => {
  const files = vueFiles(root).filter((f) => !f.endsWith("/Input.vue"));

  it("finds the admin list-page search icons", () => {
    const users = files.find((f) => f.endsWith("admin/UserListPage.vue"))!;
    expect(adornmentsBeforeInput(readFileSync(users, "utf8"))).not.toEqual([]);
  });

  it("sit on z-10 and ignore the pointer", () => {
    const bad = files.flatMap((f) =>
      adornmentsBeforeInput(readFileSync(f, "utf8"))
        .filter(
          (c) => !/\bz-10\b/.test(c) || !/\bpointer-events-none\b/.test(c)
        )
        .map((c) => `${relative(root, f)}: ${c}`)
    );
    expect(bad).toEqual([]);
  });
});
