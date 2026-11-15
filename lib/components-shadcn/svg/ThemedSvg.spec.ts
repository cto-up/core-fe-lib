import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ThemedSvg from "./ThemedSvg.vue";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><style>.a{fill:red}</style><rect class="a t-fill-accent-1" width="100" height="40"/><script>alert(1)</script></svg>`;

describe("ThemedSvg", () => {
  it("renders sanitized, responsive, labelled markup", () => {
    const w = mount(ThemedSvg, {
      props: { svg: SVG, title: "Greeting", desc: "A box" },
    });
    const html = w.html();
    expect(html).not.toContain("<script");
    const svg = w.find("svg");
    expect(svg.attributes("role")).toBe("img");
    expect(svg.attributes("viewBox")).toBe("0 0 100 40");
    expect(svg.attributes("width")).toBeUndefined();
    expect(svg.find("title").text()).toBe("Greeting");
    expect(svg.attributes("aria-labelledby")).toContain(
      svg.find("desc").attributes("id")
    );
    expect(w.emitted("sanitized")?.[0]?.[0]).toContain("script");
  });

  it("scopes the drawing's own style and the role classes to the instance", () => {
    const w = mount(ThemedSvg, {
      props: {
        svg: SVG,
        title: "x",
        themeCss: ".svg-theme{--svg-accent-1:#123456}",
      },
    });
    const scope = w.attributes("data-svg-scope");
    const css = w
      .findAll("style")
      .map((s) => s.element.textContent ?? "")
      .join("\n");
    expect(css).toContain(`[data-svg-scope="${scope}"] .a{fill:red}`);
    expect(w.find("svg rect").exists()).toBe(true);
    expect(css).toContain(
      `[data-svg-scope="${scope}"] .t-fill-accent-1{fill:var(--svg-accent-1, hsl(var(--primary)))}`
    );
    expect(css).toContain(
      `[data-svg-scope="${scope}"]{--svg-accent-1:#123456}`
    );
  });

  it("two instances get different scopes", () => {
    const a = mount(ThemedSvg, { props: { svg: SVG, title: "a" } });
    const b = mount(ThemedSvg, { props: { svg: SVG, title: "b" } });
    expect(a.attributes("data-svg-scope")).not.toBe(
      b.attributes("data-svg-scope")
    );
  });

  it("an empty title marks the drawing decorative", () => {
    const w = mount(ThemedSvg, { props: { svg: SVG, title: "" } });
    expect(w.find("svg").attributes("aria-hidden")).toBe("true");
    expect(w.find("svg title").exists()).toBe(false);
  });
});
