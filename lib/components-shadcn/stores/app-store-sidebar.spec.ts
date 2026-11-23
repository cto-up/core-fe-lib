// @vitest-environment happy-dom
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "./app-store";

describe("app store: the sidebar as the person left it", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    vi.stubGlobal("innerWidth", 1440);
    setActivePinia(createPinia());
  });

  it("opens the first time, and stays hidden after a reload once hidden", () => {
    const app = useAppStore();
    expect(app.sidebarExpand).toBe(true);
    app.toggleSidebar();
    expect(app.sidebarExpand).toBe(false);

    setActivePinia(createPinia()); // a reload
    expect(useAppStore().sidebarExpand).toBe(false);
    useAppStore().toggleSidebar();
    setActivePinia(createPinia());
    expect(useAppStore().sidebarExpand).toBe(true);
  });

  it("forgets a toggle the person did not ask for", () => {
    useAppStore().toggleSidebar({ remember: false });
    setActivePinia(createPinia());
    expect(useAppStore().sidebarExpand).toBe(true);
  });
});
