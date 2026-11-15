import { describe, expect, it } from "vitest";
import { cleanCss, sanitizeSvg, scopeCss } from "./svgSanitize";

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${inner}</svg>`;

describe("sanitizeSvg", () => {
  const vectors: [string, string, RegExp][] = [
    ["script", wrap("<script>alert(1)</script><rect/>"), /<script/i],
    [
      "onload",
      `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>`,
      /onload/i,
    ],
    ["onclick", wrap(`<rect onclick="alert(1)"/>`), /onclick/i],
    [
      "foreignObject",
      wrap("<foreignObject><div>x</div></foreignObject>"),
      /foreignObject/i,
    ],
    [
      "javascript href",
      wrap(`<a href="javascript:alert(1)"><text>x</text></a>`),
      /javascript:/i,
    ],
    [
      "external href",
      wrap(`<use href="https://evil.example/x.svg#a"/>`),
      /evil\.example/,
    ],
    [
      "xlink external",
      wrap(
        `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://evil.example/a"/>`
      ),
      /evil\.example/,
    ],
    [
      "data html",
      wrap(`<image href="data:text/html;base64,PHNjcmlwdD4="/>`),
      /data:text\/html/,
    ],
    [
      "set href",
      wrap(
        `<a><set attributeName="href" to="javascript:alert(1)"/><text>x</text></a>`
      ),
      /<set/i,
    ],
    [
      "animate",
      wrap(`<animate attributeName="href" values="javascript:alert(1)"/>`),
      /<animate/i,
    ],
    ["iframe", wrap(`<iframe src="https://evil.example"></iframe>`), /iframe/i],
    [
      "style import",
      wrap(
        `<style>@import url(https://evil.example/a.css); .a{fill:red}</style>`
      ),
      /@import|evil/,
    ],
    [
      "style url",
      wrap(`<style>.a{fill:url(https://evil.example/p)}</style>`),
      /evil/,
    ],
    [
      "css escape url",
      wrap(`<style>.a{background:\\75rl(https://evil.example/p)}</style>`),
      /evil/,
    ],
    [
      "style attr url",
      wrap(`<rect style="fill:url(https://evil.example/p)"/>`),
      /evil/,
    ],
  ];

  for (const [name, input, bad] of vectors) {
    it(`removes ${name}`, () => {
      const { svg, removed } = sanitizeSvg(input);
      expect(svg).not.toMatch(bad);
      expect(removed.length).toBeGreaterThan(0);
    });
  }

  it("keeps safe content: gradients, local use, local url(), data png", () => {
    const input = wrap(
      `<defs><linearGradient id="g"><stop offset="0"/></linearGradient><circle id="c" r="1"/></defs>` +
        `<rect class="t-fill-accent-1" fill="url(#g)"/><use href="#c"/>` +
        `<image href="data:image/png;base64,iVBORw0KGgo="/><style>.x{fill:url(#g)}</style>`
    );
    const { svg, removed } = sanitizeSvg(input);
    expect(svg).toContain("linearGradient");
    expect(svg).toContain('href="#c"');
    expect(svg).toContain("data:image/png");
    expect(svg).toContain("url(#g)");
    expect(svg).toContain("t-fill-accent-1");
    expect(removed).toEqual([]);
  });
});

describe("scopeCss", () => {
  const S = '[data-svg-scope="x"]';

  it("prefixes every selector and maps theme aliases to the scope", () => {
    const out = scopeCss(
      ".a, .b{fill:red} .svg-theme{--svg-ink:#000} .dark .lms-theme{--svg-ink:#fff}",
      S
    );
    expect(out).toContain(`${S} .a,${S} .b{fill:red}`);
    expect(out).toContain(`${S}{--svg-ink:#000}`);
    expect(out).toContain(`.dark ${S}{--svg-ink:#fff}`);
  });

  it("scopes inside @media and drops other at-rules", () => {
    const removed: string[] = [];
    const out = scopeCss(
      "@media (max-width:600px){.a{fill:red}} @keyframes k{from{opacity:0}}",
      S,
      removed
    );
    expect(out).toContain(`@media (max-width:600px){${S} .a{fill:red}}`);
    expect(out).not.toContain("keyframes");
    expect(removed.join()).toContain("@keyframes");
  });

  it("cleanCss drops anything that could close the host style element", () => {
    expect(
      cleanCss(".a{fill:red}</style><img src=x onerror=alert(1)>.b{fill:blue}")
    ).not.toContain("<");
  });

  it("cleanCss drops imports, font-face and remote urls", () => {
    const removed: string[] = [];
    const out = cleanCss(
      "@font-face{src:url(x.woff)} .a{fill:url(#ok)} .b{fill:url(http://e)}",
      removed
    );
    expect(out).toBe(".a{fill:url(#ok)}");
    expect(removed.length).toBe(2);
  });
});
