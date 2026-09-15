import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import LLMSelect, {
  type LLMFetcherArgs,
  type LLMRegistryEntry,
} from "./LLMSelect.vue";
import {
  filterByModalities,
  producesMedia,
  servesModalities,
} from "./llm-modalities";

function entry(
  llm_key: string,
  input: LLMRegistryEntry["effective_input_modalities"],
  output: LLMRegistryEntry["effective_output_modalities"] = ["text"]
): LLMRegistryEntry {
  return {
    llm_key,
    provider: llm_key.split("/")[0],
    label: llm_key,
    capabilities: ["text"],
    active: true,
    price_input_per_million: 1,
    price_output_per_million: 1,
    effective_input_modalities: input,
    effective_output_modalities: output,
  };
}

const GPT4O = entry("openai/gpt-4o", ["text", "image", "audio"]);
const O3 = entry("openai/o3", ["text"]);
const GEMINI = entry("googleai/gemini", ["text", "image"], ["text", "image"]);

describe("a model picker that asks what a model reads", () => {
  it("requires every modality asked for, not any of them", () => {
    expect(servesModalities(GPT4O, ["image", "audio"])).toBe(true);
    expect(servesModalities(GEMINI, ["image", "audio"])).toBe(false);
    expect(servesModalities(GEMINI, undefined, ["image"])).toBe(true);
  });

  it("does not assume a model that does not say", () => {
    const silent = { ...O3, effective_input_modalities: undefined };
    expect(servesModalities(silent, ["image"])).toBe(false);
  });

  it("keeps the saved model even when it no longer serves", () => {
    const kept = filterByModalities([GPT4O, O3], ["image"], [], "openai/o3");
    expect(kept.map((e) => e.llm_key)).toEqual(["openai/gpt-4o", "openai/o3"]);
  });

  it("changes nothing when no modality is asked for", () => {
    expect(filterByModalities([GPT4O, O3])).toHaveLength(2);
  });

  it("only flags output worth an icon", () => {
    expect(producesMedia(GPT4O)).toBe(false);
    expect(producesMedia(GEMINI)).toBe(true);
  });
});

describe("LLMSelect hands the modalities to its fetcher", () => {
  const i18n = createI18n({ legacy: false, locale: "en", messages: {} });

  it("asks the catalogue for them and asks again when they change", async () => {
    const fetcher = vi.fn<
      (args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>
    >(async () => []);
    const w = mount(LLMSelect, {
      props: {
        modelValue: "",
        fetcher,
        inputModalities: ["image"],
        outputModalities: ["audio"],
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({
        capability: "text",
        inputModalities: ["image"],
        outputModalities: ["audio"],
      })
    );

    await w.setProps({ inputModalities: ["image", "file"] });
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({ inputModalities: ["image", "file"] })
    );
  });

  it("leaves an existing caller's request as it was", async () => {
    const fetcher = vi.fn<
      (args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>
    >(async () => []);
    mount(LLMSelect, {
      props: { modelValue: "", fetcher },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    const args = fetcher.mock.calls[0][0];
    expect(args.inputModalities).toBeUndefined();
    expect(args.outputModalities).toBeUndefined();
  });
});
