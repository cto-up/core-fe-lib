import { describe, expect, it } from "vitest";
import { mergeSharedSections } from "./nav-factory";
import type { MenuLink } from "../types/menu-link";

const t = (key: string) => key;

const link = (over: Partial<MenuLink> = {}): MenuLink => ({
  title: "Section",
  icon: "circle",
  items: [{ title: "Item", link: "/item" }],
  ...over,
});

const item = (title: string) => ({ title, link: `/${title}` });

describe("mergeSharedSections", () => {
  it("leaves links without a sectionId untouched", () => {
    const links = [link({ title: "A" }), link({ title: "B" })];
    expect(mergeSharedSections(links, t)).toEqual(links);
  });

  it("folds contributions with the same id into one section", () => {
    const out = mergeSharedSections(
      [
        link({ sectionId: "settings", items: [item("audit")] }),
        link({ title: "Team", items: [item("people")] }),
        link({ sectionId: "settings", items: [item("connections")] }),
      ],
      t
    );

    expect(out).toHaveLength(2);
    expect(out[0].items?.map((i) => i.title)).toEqual(["audit", "connections"]);
    expect(out[1].title).toBe("Team");
  });

  it("labels the merged section from the shell, not from a contributor", () => {
    const [section] = mergeSharedSections(
      [link({ sectionId: "settings", title: "Contributor's own label" })],
      t
    );

    expect(section.title).toBe("layout.navigation.settings.title");
    expect(section.caption).toBe("layout.navigation.settings.caption");
  });

  it("anchors the section at its first contributor, whatever the item order", () => {
    const out = mergeSharedSections(
      [
        link({ title: "Assistant" }),
        link({
          sectionId: "settings",
          sectionOrder: 20,
          items: [item("audit")],
        }),
        link({ title: "Credit" }),
        link({
          sectionId: "settings",
          sectionOrder: 10,
          items: [item("connections")],
        }),
      ],
      t
    );

    expect(out.map((l) => l.title)).toEqual([
      "Assistant",
      "layout.navigation.settings.title",
      "Credit",
    ]);
    expect(out[1].items?.map((i) => i.title)).toEqual(["connections", "audit"]);
  });

  it("keeps registration order for equal sectionOrder", () => {
    const [section] = mergeSharedSections(
      [
        link({ sectionId: "settings", items: [item("first")] }),
        link({ sectionId: "settings", items: [item("second")] }),
      ],
      t
    );

    expect(section.items?.map((i) => i.title)).toEqual(["first", "second"]);
  });

  it("yields an empty section when every contribution was filtered away", () => {
    const [section] = mergeSharedSections(
      [
        link({ sectionId: "settings", items: [] }),
        link({ sectionId: "settings", items: undefined }),
      ],
      t
    );

    // useShellNav drops this afterwards; what matters is that a contributor
    // emptied by the privilege filter does not claim the section's label slot.
    expect(section.items).toEqual([]);
  });
});
