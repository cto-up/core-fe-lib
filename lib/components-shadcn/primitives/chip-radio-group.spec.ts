import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import ChipRadioGroup from "./ChipRadioGroup.vue";
import DayToggleGroup from "./DayToggleGroup.vue";
import DisclosureRow from "./DisclosureRow.vue";
import { startsAWord } from "./chip-radio-group";

const OPTIONS = [
  { value: "1", key: "team", label: "Team meeting", hint: "45 min" },
  { value: "2", key: "board", label: "Board or committee meeting" },
  { value: "3", key: "onboarding", label: "Onboarding welcome" },
];

afterEach(() => {
  document.body.innerHTML = "";
});

describe("startsAWord", () => {
  it("matches the start of a word, without case or accents", () => {
    expect(startsAWord("Board or committee meeting", "board")).toBe(true);
    expect(startsAWord("Onboarding welcome", "board")).toBe(false);
    expect(startsAWord("Réunion générale", "reunion")).toBe(true);
    expect(startsAWord("Anything", "  ")).toBe(true);
  });
});

describe("ChipRadioGroup", () => {
  const chips = (props = {}) =>
    mount(ChipRadioGroup, {
      props: {
        options: OPTIONS.slice(0, 2),
        modelValue: "1",
        label: "Type",
        idPrefix: "kind",
        ...props,
      },
      slots: { default: "<button data-test='more'>More…</button>" },
      attachTo: document.body,
    });

  it("is a labelled radio group of chips, the slot after them", async () => {
    const w = chips();
    expect(w.get('[role="radiogroup"]').attributes("aria-label")).toBe("Type");
    expect(w.findAll("label").map((l) => l.text())).toEqual([
      "Team meeting",
      "Board or committee meeting",
    ]);
    expect(w.get('[data-test="kind-team"]').attributes("data-state")).toBe(
      "checked"
    );
    expect(w.find('[data-test="more"]').exists()).toBe(true);
    expect(w.find('[data-test="kind-search"]').exists()).toBe(false);
    await w.get('[data-test="kind-board"]').trigger("click");
    expect(w.emitted("update:modelValue")).toEqual([["2"]]);
  });

  it("searches every option, not only the chips; Enter picks the first", async () => {
    const w = chips({
      searchOptions: OPTIONS,
      searchPlaceholder: "Search types…",
      shortcut: "/",
      noMatchLabel: (q: string) => `Nothing matches ${q}`,
    });
    const search = w.get('[data-test="kind-search"]');
    expect(search.attributes("aria-keyshortcuts")).toBe("/");
    await search.setValue("welc");
    expect(w.findAll("[data-chip-result]").map((r) => r.text())).toEqual([
      "Onboarding welcome",
    ]);
    await search.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")).toEqual([["3"]]);
    expect(w.find('[data-test="kind-results"]').exists()).toBe(false);

    await search.setValue("zzz");
    expect(w.get('[data-test="kind-none"]').text()).toBe("Nothing matches zzz");
  });
});

describe("DisclosureRow", () => {
  it("shows the summary and toggles the fields it controls", async () => {
    const w = mount(DisclosureRow, {
      props: {
        summary: "45 min · Team sync",
        controls: "details",
        testId: "details",
        changeLabel: "Change",
        doneLabel: "Done",
        open: false,
        "onUpdate:open": (v: boolean) => w.setProps({ open: v }),
      },
    });
    expect(w.get('[data-test="details-summary"]').text()).toBe(
      "45 min · Team sync"
    );
    const button = w.get('[data-test="details-change"]');
    expect(button.text()).toBe("Change");
    expect(button.attributes("aria-controls")).toBe("details");
    await button.trigger("click");
    expect(button.attributes("aria-expanded")).toBe("true");
    expect(button.text()).toBe("Done");
  });
});

describe("DayToggleGroup", () => {
  it("names each day in the reader's language and keeps week order", async () => {
    const w = mount(DayToggleGroup, {
      props: { modelValue: ["fri"], label: "Days", testIdPrefix: "day" },
      global: {
        plugins: [createI18n({ legacy: false, locale: "en-US", messages: {} })],
      },
    });
    expect(w.get('[role="group"]').attributes("aria-label")).toBe("Days");
    const mon = w.get('[data-test="day-mon"]');
    expect(mon.text()).toBe("Mon");
    expect(mon.attributes("aria-label")).toBe("Monday");
    expect(w.get('[data-test="day-fri"]').attributes("data-state")).toBe("on");
    await mon.trigger("click");
    expect(w.emitted("update:modelValue")).toEqual([[["mon", "fri"]]]);
  });
});
