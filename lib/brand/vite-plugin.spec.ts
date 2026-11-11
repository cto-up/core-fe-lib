import { describe, expect, it } from "vitest";
import { brandHtml } from "./vite-plugin";

const brand = {
  name: "Tessellion",
  description: "Agents & more",
  logo: "/icons/x.svg",
  themeColor: "#1f1f1f",
  maskColor: "#c4410d",
  fontsHref: "https://fonts.googleapis.com/css2?family=Inter&display=swap",
};

const run = (html: string) =>
  (brandHtml(brand).transformIndexHtml as (h: string) => string)(html);

describe("brandHtml", () => {
  it("fills every placeholder, escaped for an attribute", () => {
    expect(
      run('<title>%BRAND_NAME%</title><meta content="%BRAND_DESCRIPTION%">')
    ).toBe('<title>Tessellion</title><meta content="Agents &amp; more">');
  });

  it("refuses a placeholder brand.json does not fill", () => {
    expect(() => run("%BRAND_SLOGAN%")).toThrow(/BRAND_SLOGAN/);
  });
});
