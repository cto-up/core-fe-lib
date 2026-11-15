// Mirrors DefaultLimits in the backend (service/svgsanitize): the designer
// warns at paste time about a drawing the server would refuse.
export const SVG_LIMITS = {
  elements: 20000,
  depth: 64,
  pathChars: 100000,
  filterPrimitives: 8,
} as const;

/** The first limit `svg` exceeds, as "elements: 30000, max 20000", or null. */
export function exceededLimit(svg: string): string | null {
  const root = new DOMParser().parseFromString(
    svg,
    "image/svg+xml"
  ).documentElement;
  const all = Array.from(root.querySelectorAll("*"));
  if (all.length > SVG_LIMITS.elements)
    return `elements: ${all.length}, max ${SVG_LIMITS.elements}`;
  const filters = all.filter((e) => /^fe[A-Z]/.test(e.localName)).length;
  if (filters > SVG_LIMITS.filterPrimitives)
    return `filter primitives: ${filters}, max ${SVG_LIMITS.filterPrimitives}`;
  for (const p of all) {
    const d = p.getAttribute("d");
    if (d && d.length > SVG_LIMITS.pathChars)
      return `path length: ${d.length}, max ${SVG_LIMITS.pathChars}`;
  }
  let maxDepth = 0;
  const walk = (el: Element, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    for (const c of Array.from(el.children)) walk(c, depth + 1);
  };
  walk(root, 1);
  if (maxDepth > SVG_LIMITS.depth)
    return `depth: ${maxDepth}, max ${SVG_LIMITS.depth}`;
  return null;
}
