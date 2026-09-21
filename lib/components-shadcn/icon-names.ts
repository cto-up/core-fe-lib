import * as lucide from "lucide-vue-next";
import type { Component } from "vue";

type IconsType = Record<string, Component>;

/**
 * Lucide name handling, in ONE place.
 *
 * `Icon.vue` renders a name and `BIconPicker.vue` offers the names to choose
 * from; if the two disagree about what a name looks like, the picker quietly
 * writes values that render as nothing. So the conversion and the catalogue
 * are defined together here and both components import them.
 */
export const toPascalCase = (name: string): string =>
  name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

/** The component for a name in either spelling, or undefined when unknown. */
export function resolveIcon(name?: string | null): Component | undefined {
  if (!name) return undefined;
  const key = /[a-z][A-Z]/.test(name) ? name : toPascalCase(name);
  return (lucide as unknown as IconsType)[key];
}

const toKebab = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

/**
 * Every lucide glyph, as the kebab name to store.
 *
 * Filtered by round-tripping through `resolveIcon`, which drops the handful
 * (ArrowDownAZ and its three siblings) whose kebab form does not convert back
 * — offering a name that renders blank is worse than offering 1540 instead of
 * 1544.
 */
export const iconNames: string[] = Object.keys(lucide.icons)
  .map(toKebab)
  .filter((n) => resolveIcon(n))
  .sort();
