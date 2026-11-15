// LaTeX rendering with KaTeX, loaded on demand (its own chunk + CSS + fonts,
// all served from the app's origin). Safe by configuration: no \href/\url,
// no \html*, bounded macro expansion and sizes.

import type { KatexOptions } from "katex";

export const KATEX_OPTIONS: Readonly<KatexOptions> = Object.freeze({
  trust: false,
  maxExpand: 1000,
  maxSize: 20,
  strict: "warn",
  output: "htmlAndMathml",
  throwOnError: true,
});

/** Commands refused before rendering (mirrors the server's TeX lint). */
export const DENIED_COMMANDS = [
  "\\href",
  "\\url",
  "\\includegraphics",
  "\\htmlClass",
  "\\htmlId",
  "\\htmlStyle",
  "\\htmlData",
  "\\def",
  "\\gdef",
  "\\edef",
  "\\newcommand",
  "\\renewcommand",
];

export const MAX_TEX = 2000;

type Katex = typeof import("katex").default;
let katexPromise: Promise<Katex> | null = null;

/** Load KaTeX and its stylesheet once. */
export function loadKatex(): Promise<Katex> {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import("katex"),
      import("katex/dist/katex.min.css"),
    ]).then(([m]) => m.default);
  }
  return katexPromise;
}

export interface TexError {
  message: string;
  position?: number;
}

/** The first refused command or limit, or null. */
export function lintTex(tex: string): TexError | null {
  if (tex.length > MAX_TEX)
    return { message: `formula is ${tex.length} characters, max ${MAX_TEX}` };
  for (const cmd of DENIED_COMMANDS) {
    const re = new RegExp(`${cmd.replace(/\\/g, "\\\\")}(?![a-zA-Z])`);
    const m = re.exec(tex);
    if (m)
      return {
        message: `${cmd} is not allowed in a formula`,
        position: m.index,
      };
  }
  let depth = 0;
  for (let i = 0; i < tex.length; i++) {
    if (tex[i] === "\\") {
      i++;
      continue;
    }
    if (tex[i] === "{") depth++;
    if (tex[i] === "}") depth--;
    if (depth < 0) return { message: "unmatched }", position: i };
  }
  if (depth > 0) return { message: "missing }" };
  return null;
}

/** Render TeX to HTML (+ MathML). Never throws: errors come back as data. */
export async function renderTex(
  tex: string,
  opts: { display: boolean; macros?: Record<string, string> }
): Promise<{ html: string; error?: TexError }> {
  const lint = lintTex(tex);
  if (lint) return { html: "", error: lint };
  const katex = await loadKatex();
  try {
    const html = katex.renderToString(tex, {
      ...KATEX_OPTIONS,
      displayMode: opts.display,
      macros: { ...(opts.macros ?? {}) },
    });
    return { html };
  } catch (e) {
    const err = e as {
      message?: string;
      position?: number;
      rawMessage?: string;
    };
    return {
      html: "",
      error: {
        message: err.rawMessage ?? err.message ?? String(e),
        position: err.position,
      },
    };
  }
}
