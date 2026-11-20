// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { computed, h } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MainAppLayout from "./MainAppLayout.vue";
import { useAppStore } from "../stores/app-store";

/**
 * `autoCloseNav` (office#104): opt-in collapse of the desktop sidebar once a
 * leaf link is activated. Default keeps it open; a section header never
 * closes it.
 */

// Node's own (file-less) localStorage global shadows happy-dom's and has no methods.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
});

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("../../stores/user-store", () => ({
  useUserStore: () => ({
    isLogged: true,
    hasRole: true,
    isSuperAdmin: false,
    user: { email: "a@b.c", roles: [] },
    hasPrivilege: () => false,
  }),
}));
vi.mock("../../authentication/vue", () => ({
  useKratosAuth: () => ({ signMeOut: vi.fn() }),
}));
vi.mock("../../composables/useUrl", () => ({
  useUrl: () => ({ isTenantSubdomain: () => true }),
}));
vi.mock("../composables/useLoggedUser", () => ({
  default: () => ({ getUserPictureURL: () => "" }),
}));
vi.mock("../composables/useAppNav", () => ({
  useAppNav: () => ({
    menuLinks: computed(() => [
      {
        title: "Work",
        icon: "work",
        items: [
          { title: "Boards", link: "/boards" },
          { title: "Chat", link: "/chat" },
        ],
      },
    ]),
    topSection: computed(() => undefined),
    trailingSections: computed(() => []),
    subGroups: computed(() => []),
    canAccess: () => true,
  }),
}));

const Icon = () => h("i");

async function mountLayout(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:p(.*)*", component: { render: () => h("p", "page") } }],
  });
  await router.push("/boards");
  const wrapper = mount(MainAppLayout, {
    props: { resolveIcon: () => Icon, ...props },
    attachTo: document.body,
    global: { plugins: [router], stubs: { AppMainNavbar: true } },
  });
  await flushPromises();
  return { wrapper, router };
}

const aside = () => document.body.querySelector("aside")!;
const leaf = (title: string) =>
  [...aside().querySelectorAll("a")].find(
    (a) => a.textContent?.trim() === title
  )!;
const sectionHeader = (title: string) =>
  [...aside().querySelectorAll("button")].find((b) =>
    b.textContent?.includes(title)
  )!;

describe("MainAppLayout autoCloseNav", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps the sidebar open after a leaf click by default", async () => {
    const { router } = await mountLayout();
    leaf("Chat").click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/chat");
    expect(useAppStore().sidebarExpand).toBe(true);
  });

  it("collapses the sidebar and focuses main after a leaf click", async () => {
    const { router } = await mountLayout({ autoCloseNav: true });
    leaf("Chat").click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/chat");
    expect(useAppStore().sidebarExpand).toBe(false);
    expect(document.activeElement?.tagName).toBe("MAIN");
  });

  it("keeps the sidebar open when a section header is toggled", async () => {
    await mountLayout({ autoCloseNav: true });
    sectionHeader("Work").click();
    await flushPromises();
    expect(useAppStore().sidebarExpand).toBe(true);
  });
});
