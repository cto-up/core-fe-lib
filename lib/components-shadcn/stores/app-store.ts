import { defineStore } from "pinia";
import { applyTheme } from "../themes";

interface IAppStore {
  themeMode: "light" | "dark";
  sidebarExpand: boolean;
  wrapperWidth: number;
  wrapperLeftOffset: number;
  navWidth: number | string;
}

const LIGHT = "light";
const DARK = "dark";
const EXPAND = 252;
const SHRINKED = 72;

export const useAppStore = defineStore("app", {
  state: () =>
    <IAppStore>{
      themeMode: LIGHT,
      sidebarExpand: true,
      wrapperWidth: 0,
      wrapperLeftOffset: 0,
      navWidth: "100%",
    },
  getters: {
    theme: (state) => state.themeMode,
    isDark: (state) => state.themeMode === DARK,
    sidebarExpanded: (state) => state.sidebarExpand,
  },
  actions: {
    toggleSidebar() {
      this.sidebarExpand = !this.sidebarExpand;
      if (window.innerWidth > 1024) {
        this.initWrapper();
      }
    },
    initWrapper() {
      if (window.innerWidth > 1024) {
        if (this.sidebarExpand) {
          this.wrapperWidth = EXPAND;
          this.wrapperLeftOffset = EXPAND;
        } else {
          this.wrapperWidth = SHRINKED;
          this.wrapperLeftOffset = SHRINKED;
        }
        this.navWidth = `calc(100% - ${this.wrapperWidth}px)`;
      } else {
        this.navWidth = "100%";
        this.sidebarExpand = false;
        this.wrapperWidth = SHRINKED;
        this.wrapperLeftOffset = SHRINKED;
      }
    },
    async initTheme() {
      // Check both keys for backward compatibility with useDark.ts
      const cache = localStorage.getItem("dark-mode") === "true" ? DARK : LIGHT;

      if (cache) {
        this.themeMode = cache as "light" | "dark";
      }

      window.addEventListener("resize", this.initWrapper);
      this.applyTheme();
      this.initWrapper();

      // Re-apply tenant colors if available
      await this.applyTenantTheme();
    },
    async toggleTheme() {
      this.themeMode = this.themeMode === LIGHT ? DARK : LIGHT;
      this.applyTheme();
      localStorage.setItem("dark-mode", (this.themeMode === DARK).toString());

      // Re-apply tenant colors for the new mode
      await this.applyTenantTheme();
    },
    async applyTenantTheme() {
      try {
        const { useTenantStore } = await import("../../stores/tenant-store");
        const tenantStore = useTenantStore();

        // Always call applyTheme to ensure any previous mode's overrides are cleared.
        // If profile or specific colors are missing, passing {} triggers a reset to CSS defaults.
        const colors =
          (this.isDark
            ? tenantStore.tenant?.profile?.darkColors
            : tenantStore.tenant?.profile?.lightColors) || {};
        applyTheme(colors as Record<string, string>);
      } catch (e) {
        console.warn("Could not apply tenant theme:", e);
      }
    },
    appUnmount() {
      window.removeEventListener("resize", this.initWrapper);
    },
    applyTheme() {
      const isDark = this.themeMode === DARK;
      document.documentElement.classList.toggle(DARK, isDark);
      document.body.classList.toggle(DARK, isDark);
      document.documentElement.classList.toggle(LIGHT, !isDark);
      document.body.classList.toggle(LIGHT, !isDark);
    },
  },
});
