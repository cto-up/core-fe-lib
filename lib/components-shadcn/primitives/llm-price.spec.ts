import { describe, expect, it } from "vitest";
import type { LLMRegistryEntry } from "./LLMSelect.vue";
import { fmtPrice, priceLabel } from "./llm-price";

const t = (key: string, v: Record<string, string> = {}) =>
  `${key.split(".").pop()}(${Object.values(v).join(",")})`;

function model(over: Partial<LLMRegistryEntry>): LLMRegistryEntry {
  return {
    llm_key: "mistral/m",
    provider: "mistral",
    label: "m",
    capabilities: ["text"],
    active: true,
    price_input_per_million: 0,
    price_output_per_million: 0,
    ...over,
  };
}

describe("a model's price, in the unit it is billed in", () => {
  it("prices a speech model by characters, not as unpriced", () => {
    expect(priceLabel(model({ price_per_million_chars: 13 }), t)).toBe(
      "perMillionChars($13)"
    );
  });

  it("prices transcription by the minute, beside any token rates", () => {
    expect(
      priceLabel(
        model({
          price_input_per_million: 0.1,
          price_output_per_million: 0.4,
          price_per_minute: 0.004,
        }),
        t
      )
    ).toBe("perMillion($0.1,$0.4) · perMinute($0.004)");
  });

  it("still says unknown when nothing is priced, and free when local", () => {
    expect(priceLabel(model({}), t)).toBe("unknown()");
    expect(priceLabel(model({ provider: "private" }), t)).toBe("free()");
  });

  it("keeps a sub-cent price readable", () => {
    expect(fmtPrice(0.0035)).toBe("0.0035");
    expect(fmtPrice(2.5)).toBe("2.5");
    expect(fmtPrice(13)).toBe("13");
  });
});
