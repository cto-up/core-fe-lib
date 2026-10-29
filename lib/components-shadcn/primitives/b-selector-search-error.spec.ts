import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import axios from "axios";
import enUS from "../i18n/en-US";
import BSelector from "./BSelector.vue";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": enUS },
});

describe("BSelector search failure", () => {
  it("keeps the reason instead of reading as no results", async () => {
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { data: { error: "search index offline" } },
    });
    const w = mount(BSelector, {
      props: {
        url: "/api/v1/things",
        label: "Things",
        modelValue: null,
        optionValue: "id",
        optionLabel: "name",
      },
      global: { plugins: [i18n] },
    });
    const vm = w.vm as unknown as {
      onSearch: (q: string) => Promise<void>;
      searchError: string;
    };
    await vm.onSearch("ab");
    await flushPromises();
    expect(vm.searchError).toBe("search index offline");
  });
});
