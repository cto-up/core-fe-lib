// Sanitizing policy shared with the backend (service/svgsanitize): the input is
// parsed as XML (malformed input is rejected, no HTML parser quirks), then walked
// against an element allowlist. Everything that can run code, load a remote
// resource or re-target a link after sanitizing is dropped. Kept in sync with the
// Go list by the shared XSS corpus.

export const SVG_ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "defs",
  "symbol",
  "use",
  "title",
  "desc",
  "style",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "path",
  "text",
  "tspan",
  "textPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "pattern",
  "clipPath",
  "mask",
  "marker",
  "image",
  "filter",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
]);

// Elements whose children are kept when the element itself is dropped.
const UNWRAP = new Set(["a", "switch"]);

const SAFE_DATA_IMAGE =
  /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;
const SVG_NS = "http://www.w3.org/2000/svg";

export interface SanitizeResult {
  svg: string;
  removed: string[];
}

function isSafeHref(tag: string, value: string): boolean {
  const v = value.trim();
  if (v.startsWith("#")) return true;
  return tag === "image" && SAFE_DATA_IMAGE.test(v);
}

function cleanElement(el: Element, removed: string[]) {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value;
    const local = name.includes(":") ? name.split(":").pop()! : name;
    let drop = false;
    if (name.startsWith("on")) drop = true;
    else if (local === "href") drop = !isSafeHref(el.localName, value);
    else if (
      /^\s*(javascript|vbscript|data):/i.test(decodeCssEscapes(value)) &&
      local !== "href"
    )
      drop = true;
    else if (name === "style")
      drop =
        DANGEROUS_STYLE.test(decodeCssEscapes(value)) || hasRemoteUrl(value);
    if (drop) {
      removed.push(local === "href" ? `${name}=${value.slice(0, 40)}` : name);
      el.removeAttributeNode(attr);
    }
  }
  for (const child of Array.from(el.children)) {
    const tag = child.localName;
    if (child.namespaceURI !== SVG_NS || !SVG_ALLOWED_ELEMENTS.has(tag)) {
      removed.push(tag);
      if (UNWRAP.has(tag) && child.namespaceURI === SVG_NS) {
        cleanElement(child, removed);
        while (child.firstChild) el.insertBefore(child.firstChild, child);
      }
      child.remove();
      continue;
    }
    if (tag === "style") {
      child.textContent = cleanCss(child.textContent ?? "", removed);
      continue;
    }
    cleanElement(child, removed);
  }
  // Processing instructions and comments carry nothing a drawing needs.
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 7 || node.nodeType === 8)
      node.parentNode?.removeChild(node);
  }
}

/** Sanitize SVG markup. Returns the cleaned SVG ("" when it is not a well-formed SVG) and what was removed. */
export function sanitizeSvg(svg: string): SanitizeResult {
  const removed: string[] = [];
  const src = (svg ?? "").trim();
  if (!src) return { svg: "", removed };
  if (/<!DOCTYPE|<!ENTITY/i.test(src)) return { svg: "", removed: ["doctype"] };
  const doc = new DOMParser().parseFromString(src, "image/svg+xml");
  const root = doc.documentElement;
  if (
    !root ||
    root.getElementsByTagName("parsererror").length ||
    root.localName !== "svg" ||
    root.namespaceURI !== SVG_NS
  ) {
    return { svg: "", removed: ["not a well-formed svg"] };
  }
  cleanElement(root, removed);
  return {
    svg: new XMLSerializer().serializeToString(root),
    removed: [...new Set(removed)],
  };
}

const DANGEROUS_STYLE =
  /expression\s*\(|behavior\s*:|-moz-binding|@import|javascript:/i;

function hasRemoteUrl(css: string): boolean {
  let bad = false;
  decodeCssEscapes(css).replace(URL_RE, (m, _q, target: string) => {
    if (!target.trim().startsWith("#")) bad = true;
    return m;
  });
  return bad;
}

/** Decode CSS escapes (\75rl( → url() so filters cannot be dodged with them. */
export function decodeCssEscapes(css: string): string {
  return css
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/\\(.)/g, "$1");
}

const DANGEROUS_CSS =
  /@import|@font-face|@namespace|expression\s*\(|behavior\s*:|-moz-binding|javascript:/i;
const URL_RE = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;

/** Remove dangerous constructs from a stylesheet. Local url(#id) stays. */
export function cleanCss(css: string, removed: string[] = []): string {
  const decoded = decodeCssEscapes(css).replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  for (const block of splitTopLevel(decoded)) {
    // A "<" could close the host <style> element ("</style><img onerror=…>").
    if (DANGEROUS_CSS.test(block) || block.includes("<")) {
      removed.push(
        block.trim().split(/[{;]/)[0].trim().slice(0, 40) || "css rule"
      );
      continue;
    }
    if (hasRemoteUrl(block)) {
      removed.push("url() in css");
      continue;
    }
    out.push(block.trim());
  }
  return out.join("\n");
}

/** Split a stylesheet into top-level statements (rules and at-rules). */
export function splitTopLevel(css: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        parts.push(css.slice(start, i + 1));
        start = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      parts.push(css.slice(start, i + 1));
      start = i + 1;
    }
  }
  const rest = css.slice(start).trim();
  if (rest) parts.push(rest);
  return parts.filter((p) => p.trim());
}

// Selectors that mean "the drawing itself" in a theme stylesheet.
const SCOPE_ALIASES = /^(:root|:scope|\.svg-theme|\.lms-theme)$/;
const DARK_ALIASES = /^\.dark\s+(:root|:scope|\.svg-theme|\.lms-theme)$/;

function scopeSelector(sel: string, scope: string): string {
  const s = sel.trim();
  if (SCOPE_ALIASES.test(s)) return scope;
  if (DARK_ALIASES.test(s)) return `.dark ${scope}`;
  return `${scope} ${s}`;
}

/**
 * Sanitize a stylesheet and confine every rule to `scope` (a CSS selector such as
 * `[data-svg-scope="abc"]`). @media blocks are kept and scoped recursively; other
 * at-rules are dropped.
 */
export function scopeCss(
  css: string,
  scope: string,
  removed: string[] = []
): string {
  const clean = cleanCss(css, removed);
  const out: string[] = [];
  for (const block of splitTopLevel(clean)) {
    const open = block.indexOf("{");
    if (open < 0) continue;
    const head = block.slice(0, open).trim();
    const body = block.slice(open + 1, block.lastIndexOf("}"));
    if (head.startsWith("@media")) {
      out.push(`${head}{${scopeCss(body, scope, removed)}}`);
      continue;
    }
    if (head.startsWith("@")) {
      removed.push(head.slice(0, 40));
      continue;
    }
    const sel = head
      .split(",")
      .map((s) => scopeSelector(s, scope))
      .join(",");
    out.push(`${sel}{${body.trim()}}`);
  }
  return out.join("\n");
}
