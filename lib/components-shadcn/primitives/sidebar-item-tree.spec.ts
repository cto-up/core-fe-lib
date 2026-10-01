// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { h } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";
import SidebarItemTree from "./SidebarItemTree.vue";
import type { MenuItem } from "../types/menu-link";

const Icon = () => h("i");

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:p(.*)*", component: { render: () => null } }],
  });
}

async function mountTree(items: MenuItem[], at: string) {
  const router = makeRouter();
  await router.push(at);
  const wrapper = mount(
    {
      render: () =>
        h(
          "ul",
          h(SidebarItemTree, { items, expanded: true, resolveIcon: () => Icon })
        ),
    },
    { attachTo: document.body, global: { plugins: [router] } }
  );
  await flushPromises();
  return { wrapper, router };
}

const visible = (title: string) =>
  [...document.body.querySelectorAll("a, button")].some(
    (el) => el.textContent?.trim() === title
  );

const storefront: MenuItem[] = [
  {
    title: "Storefront",
    link: "/space",
    items: [
      {
        id: "s1",
        title: "Store",
        link: "/space/w/s1",
        items: [{ id: "c1", title: "Intro", link: "/space/catalogs/c1" }],
      },
      {
        id: "s2",
        title: "Store",
        link: "/space/w/s2",
        items: [{ id: "c2", title: "Advanced", link: "/space/catalogs/c2" }],
      },
    ],
  },
];

describe("SidebarItemTree", () => {
  it("opens the branch that holds the current page, and only that one", async () => {
    const { wrapper } = await mountTree(storefront, "/space/catalogs/c2");
    expect(visible("Advanced")).toBe(true);
    // Same title "Store" on both rows: keyed by id, the other stays closed.
    expect(visible("Intro")).toBe(false);
    wrapper.unmount();
  });

  it("navigates from a parent's label without toggling it", async () => {
    const { wrapper, router } = await mountTree(storefront, "/elsewhere");
    expect(visible("Store")).toBe(false);
    const label = [...document.body.querySelectorAll("a")].find(
      (a) => a.textContent?.trim() === "Storefront"
    )!;
    label.click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/space");
    wrapper.unmount();
  });

  it("toggles a linked parent from its chevron", async () => {
    const { wrapper } = await mountTree(storefront, "/elsewhere");
    const chevron = document.body.querySelector(
      'button[aria-label="Storefront"]'
    ) as HTMLButtonElement;
    chevron.click();
    await flushPromises();
    expect(visible("Store")).toBe(true);
    wrapper.unmount();
  });
});
