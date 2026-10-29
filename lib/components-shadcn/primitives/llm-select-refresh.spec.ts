import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { Select } from "../ui/select";
import LLMSelect, {
  type LLMFetcherArgs,
  type LLMRegistryEntry,
} from "./LLMSelect.vue";

const i18n = createI18n({ legacy: false, locale: "en", messages: { en: {} } });

function entry(llm_key: string): LLMRegistryEntry {
  return {
    llm_key,
    provider: llm_key.split("/")[0],
    label: llm_key,
    capabilities: ["text"],
    active: true,
    price_input_per_million: 1,
    price_output_per_million: 1,
  };
}

// A model added in another tab is offered the next time the picker opens,
// without reloading the page that holds it.
describe("LLMSelect reads its list again when it opens", () => {
  it("fetches on mount and again on each open, keeping the list meanwhile", async () => {
    let models = [entry("openai/gpt-4o-mini")];
    const fetcher = vi.fn<
      (args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>
    >(async () => models);
    const w = mount(LLMSelect, {
      props: { modelValue: "", fetcher },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);

    models = [...models, entry("custom:private-10000/qwen-flash-next")];
    w.findComponent(Select).vm.$emit("update:open", true);
    expect((w.vm as unknown as { loading: boolean }).loading).toBe(false);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      (w.vm as unknown as { entries: LLMRegistryEntry[] }).entries.map(
        (e) => e.llm_key
      )
    ).toContain("custom:private-10000/qwen-flash-next");

    w.findComponent(Select).vm.$emit("update:open", false);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps what it had when a refresh fails", async () => {
    const fetcher = vi
      .fn<(args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>>()
      .mockResolvedValueOnce([entry("openai/gpt-4o-mini")])
      .mockRejectedValueOnce(new Error("offline"));
    const w = mount(LLMSelect, {
      props: { modelValue: "", fetcher },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    w.findComponent(Select).vm.$emit("update:open", true);
    await flushPromises();
    expect(
      (w.vm as unknown as { entries: LLMRegistryEntry[] }).entries.map(
        (e) => e.llm_key
      )
    ).toEqual(["openai/gpt-4o-mini"]);
  });

  it("says why a failed load failed instead of offering no model", async () => {
    const fetcher = vi
      .fn<(args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>>()
      .mockRejectedValueOnce({ body: { error: "registry unreachable" } });
    const w = mount(LLMSelect, {
      props: { modelValue: "", fetcher },
      global: { plugins: [i18n] },
    });
    await flushPromises();
    expect((w.vm as unknown as { loadError: string }).loadError).toBe(
      "registry unreachable"
    );
    expect(w.find("[role=alert]").exists()).toBe(true);
  });
});
