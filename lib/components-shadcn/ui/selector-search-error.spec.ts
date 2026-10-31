import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import axios from "axios";
import enUS from "../i18n/en-US";
import LabelSelector from "./label-selector/LabelSelector.vue";
import SelectorId from "./selector-id/SelectorId.vue";

vi.mock("axios", async (importActual) => {
  const real = (await importActual<typeof import("axios")>()).default;
  return { default: { get: vi.fn(), isAxiosError: real.isAxiosError } };
});

const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  messages: { "en-US": enUS },
});

type FailState = {
  loadOptions: (q?: string) => Promise<void>;
  loadFailed: boolean;
  failedText: string;
};

const cases = [
  {
    name: "LabelSelector",
    component: LabelSelector,
    props: { url: "/api/v1/labels", optionLabel: "name" },
  },
  {
    name: "SelectorId",
    component: SelectorId,
    props: { url: "/api/v1/things", optionLabel: "name", optionValue: "id" },
  },
];

describe.each(cases)("$name search failure", ({ component, props }) => {
  beforeEach(() => vi.mocked(axios.get).mockReset());

  it("says the search failed and why, instead of reading as no results", async () => {
    vi.mocked(axios.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "search index offline" } },
    });
    const w = mount(component, { props, global: { plugins: [i18n] } });
    const vm = w.vm as unknown as FailState;

    await vm.loadOptions("ab");
    await flushPromises();

    expect(vm.loadFailed).toBe(true);
    expect(vm.failedText).toBe("The search failed: search index offline");
  });

  it("clears the failure once a search succeeds", async () => {
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue({ data: [] });
    const w = mount(component, { props, global: { plugins: [i18n] } });
    const vm = w.vm as unknown as FailState;

    await vm.loadOptions("ab");
    await vm.loadOptions("abc");
    await flushPromises();

    expect(vm.loadFailed).toBe(false);
  });
});
