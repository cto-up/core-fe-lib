import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ReachPicker, { type ReachMode } from "./ReachPicker.vue";

/**
 * One vocabulary for "how far does this reach".
 *
 * It was three controls saying the same thing three ways: a single-select on a
 * guard attachment, chips where naming nobody meant everybody on a fact
 * snippet, and all/only/except on the call axis. Only the third one could say
 * "everything but these", and it was the only one a person could learn.
 */
const OPTIONS = [
  { id: "a", label: "Jean Antonio", hint: "Support" },
  { id: "b", label: "Jean Antonio", hint: "Research" },
  { id: "c", label: "Priya" },
];

const WORDS = {
  labels: { all: "Every", only: "Only these", except: "All except" },
  hints: { all: "a", only: "b", except: "c" },
  emptyLabels: { all: "", only: "Name one", except: "Name one" },
  filterPlaceholder: "Filter…",
  noMatchLabel: "Nothing matches",
  removeLabel: "Remove",
  moreLabel: (n: number) => `Show ${n} more`,
};

function mountPicker(
  mode: ReachMode = "all",
  selected: string[] = [],
  extra: Record<string, unknown> = {}
) {
  return mount(ReachPicker, {
    props: { options: OPTIONS, mode, selected, ...WORDS, ...extra },
  });
}

const chip = (w: ReturnType<typeof mountPicker>, text: string) =>
  w.findAll("button").find((b) => b.text().startsWith(text));

describe("saying how far something reaches", () => {
  it("offers no list under 'every', because there is nothing to name", () => {
    const w = mountPicker("all");
    expect(w.find("input").exists()).toBe(false);
  });

  it("tells namesakes apart, which a bare label cannot", () => {
    // Two employees called Jean Antonio is not a rendering problem, it is two
    // different people, and a picker that cannot separate them is unusable.
    const w = mountPicker("only");
    const labels = w.findAll("button").map((b) => b.text());
    expect(labels.filter((l) => l.includes("Jean Antonio")).length).toBe(2);
    expect(labels.some((l) => l.includes("Support"))).toBe(true);
    expect(labels.some((l) => l.includes("Research"))).toBe(true);
  });

  it("filters on the disambiguator as well as the name", async () => {
    const w = mountPicker("only");
    await w.find("input").setValue("research");
    const names = w.findAll("button").map((b) => b.text());
    expect(names.some((n) => n.includes("Research"))).toBe(true);
    expect(names.some((n) => n.includes("Priya"))).toBe(false);
  });

  it("drops the names when it goes back to 'every'", async () => {
    // A stale list is a selection that does nothing today and reappears the
    // moment somebody switches back — the reach would change without anybody
    // touching the list.
    const w = mountPicker("only", ["a"]);
    await chip(w, "Every")!.trigger("click");
    expect(w.emitted("update:selected")!.at(-1)![0]).toEqual([]);
  });

  it("hides 'all except' where the product refuses to store one", () => {
    // A guard binding cannot simply exclude somebody: that is a weakening, and
    // it goes through a waiver with a reason and an expiry.
    const w = mountPicker("only", [], { allowExcept: false });
    expect(chip(w, "All except")).toBeUndefined();
    expect(chip(w, "Only these")).toBeTruthy();
  });

  it("still shows an id it cannot name", () => {
    // A chip that vanished because the name did not load would understate the
    // reach, which is the one thing this must never do.
    const w = mountPicker("only", ["gone"]);
    expect(w.text()).toContain("gone");
  });
});
