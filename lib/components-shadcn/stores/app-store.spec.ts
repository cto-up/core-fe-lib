import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../../stores/tenant-store", () => ({
  useTenantStore: () => ({ tenant: undefined }),
}));

// Node's own (file-less) localStorage global shadows happy-dom's and has no methods.
const stored = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => stored.set(key, value),
  removeItem: (key: string) => stored.delete(key),
  clear: () => stored.clear(),
});

let systemDark = false;
const listeners: ((event: { matches: boolean }) => void)[] = [];

function setSystemDark(dark: boolean) {
  systemDark = dark;
  listeners.forEach((listener) => listener({ matches: dark }));
}

window.matchMedia = ((query: string) => ({
  get matches() {
    return query === "(prefers-color-scheme: dark)" && systemDark;
  },
  addEventListener: (_: string, listener: (e: { matches: boolean }) => void) =>
    listeners.push(listener),
})) as unknown as typeof window.matchMedia;

const { useAppStore } = await import("./app-store");

const rootIsDark = () => document.documentElement.classList.contains("dark");

describe("app store theme preference", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    systemDark = false;
  });

  it("follows the device when nothing was ever chosen", async () => {
    systemDark = true;
    const store = useAppStore();
    await store.initTheme();

    expect(store.themePreference).toBe("system");
    expect(rootIsDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    setSystemDark(false);
    await vi.waitFor(() => expect(rootIsDark()).toBe(false));
  });

  it("keeps a choice saved before the system option existed", async () => {
    systemDark = true;
    localStorage.setItem("dark-mode", "false");
    const store = useAppStore();
    await store.initTheme();

    expect(store.themePreference).toBe("light");
    expect(rootIsDark()).toBe(false);
  });

  it("ignores device changes while a mode is pinned", async () => {
    const store = useAppStore();
    await store.initTheme();
    await store.setThemePreference("dark");

    expect(localStorage.getItem("dark-mode")).toBe("true");
    setSystemDark(false);
    expect(rootIsDark()).toBe(true);
  });

  it("forgets the pinned mode when switched back to system", async () => {
    localStorage.setItem("dark-mode", "true");
    const store = useAppStore();
    await store.initTheme();
    await store.setThemePreference("system");

    expect(localStorage.getItem("dark-mode")).toBeNull();
    expect(rootIsDark()).toBe(false);
  });
});
