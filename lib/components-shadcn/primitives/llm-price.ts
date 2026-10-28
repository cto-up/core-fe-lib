import type { LLMRegistryEntry } from "./LLMSelect.vue";

type Translate = (key: string, values?: Record<string, string>) => string;

const PROVIDER_CURRENCY: Record<string, string> = {
  ovh: "€",
  scaleway: "€",
  googleai: "$",
  anthropic: "$",
  openai: "$",
  mistral: "$",
};

export function fmtPrice(v: number): string {
  if (v === 0) return "0";
  if (v < 0.01) return String(Number(v.toPrecision(2)));
  return v.toFixed(2).replace(/\.?0+$/, "");
}

// A model is billed by what it consumes: tokens for chat, characters of text
// for speech, minutes of audio for transcription. Each gets its own unit, so a
// priced speech model never reads as unpriced.
export function priceLabel(m: LLMRegistryEntry, t: Translate): string {
  if (m.provider === "private" || m.provider === "ollama") {
    return t("llm.select.price.free");
  }
  const c = PROVIDER_CURRENCY[m.provider] ?? "";
  const money = (v: number) => `${c}${fmtPrice(v)}`;
  const parts: string[] = [];
  if (m.price_input_per_million || m.price_output_per_million) {
    parts.push(
      t("llm.select.price.perMillion", {
        input: money(m.price_input_per_million),
        output: money(m.price_output_per_million),
      })
    );
  }
  if (m.price_per_million_chars) {
    parts.push(
      t("llm.select.price.perMillionChars", {
        price: money(m.price_per_million_chars),
      })
    );
  }
  if (m.price_per_minute) {
    parts.push(
      t("llm.select.price.perMinute", { price: money(m.price_per_minute) })
    );
  }
  return parts.length ? parts.join(" · ") : t("llm.select.price.unknown");
}
