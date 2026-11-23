// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { h } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Component } from "vue";
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

// Open state is persisted and shared per storage key, so each test gets a
// fresh module and empty storage.
let SidebarItemTree: Component;
beforeEach(async () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.resetModules();
  ({ default: SidebarItemTree } = await import("./SidebarItemTree.vue"));
});

const library: MenuItem[] = [
  {
    id: "library",
    title: "Library",
    items: [{ title: "Rooms", link: "/rooms" }],
  },
];

describe("SidebarItemTree", () => {
  it("starts a branch closed when the page is outside it", async () => {
    const { wrapper } = await mountTree(library, "/elsewhere");
    expect(visible("Rooms")).toBe(false);
    wrapper.unmount();
  });

  it("keeps a branch the user opened open after a remount", async () => {
    const first = await mountTree(library, "/elsewhere");
    (
      [...document.body.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "Library"
      ) as HTMLButtonElement
    ).click();
    await flushPromises();
    expect(visible("Rooms")).toBe(true);
    first.wrapper.unmount();

    vi.resetModules();
    ({ default: SidebarItemTree } = await import("./SidebarItemTree.vue"));
    const second = await mountTree(library, "/elsewhere");
    expect(visible("Rooms")).toBe(true);
    second.wrapper.unmount();
  });

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
