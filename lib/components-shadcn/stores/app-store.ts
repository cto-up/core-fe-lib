import { defineStore } from "pinia";
import { applyTheme } from "../themes";
import {
  type ThemePreference,
  onSystemDarkChange,
  readThemePreference,
  systemPrefersDark,
  writeThemePreference,
} from "../theme-preference";

interface IAppStore {
  themePreference: ThemePreference;
  systemDark: boolean;
  sidebarExpand: boolean;
  wrapperWidth: number;
  wrapperLeftOffset: number;
  navWidth: number | string;
}

const LIGHT = "light";
const DARK = "dark";
const EXPAND = 252;
// Collapsed = fully hidden (drawer-style), not an icon rail. Content goes
// full-width; the navbar toggle brings the sidebar back.
const SHRINKED = 0;

let systemListenerAttached = false;

// Whether the person left the desktop sidebar open or hidden, kept on this
// device so a reload shows it as they left it.
const SIDEBAR_KEY = "app.sidebarExpanded";

function readSidebarExpand(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeSidebarExpand(expand: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, String(expand));
  } catch {
    // localStorage unavailable: the sidebar opens next time
  }
}

export const useAppStore = defineStore("app", {
  state: () =>
    <IAppStore>{
      themePreference: "system",
      systemDark: false,
      sidebarExpand: readSidebarExpand(),
      wrapperWidth: 0,
      wrapperLeftOffset: 0,
      navWidth: "100%",
    },
  getters: {
    isDark: (state) =>
      state.themePreference === "system"
        ? state.systemDark
        : state.themePreference === DARK,
    sidebarExpanded: (state) => state.sidebarExpand,
  },
  actions: {
    /** remember: false for a toggle the person did not ask for (a layout
     * hiding the sidebar after a navigation), which a reload forgets. */
    toggleSidebar({ remember = true }: { remember?: boolean } = {}) {
      this.sidebarExpand = !this.sidebarExpand;
      if (remember && window.innerWidth > 1024)
        writeSidebarExpand(this.sidebarExpand);
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
      this.themePreference = readThemePreference();
      this.systemDark = systemPrefersDark();

      if (!systemListenerAttached) {
        systemListenerAttached = true;
        // Attached once for the page, so it looks the store up when it fires
        // rather than holding the instance that happened to attach it.
        onSystemDarkChange((dark) => {
          const store = useAppStore();
          store.systemDark = dark;
          if (store.themePreference === "system") void store.refreshTheme();
        });
      }

      window.addEventListener("resize", this.initWrapper);
      this.initWrapper();
      await this.refreshTheme();
    },
    async setThemePreference(preference: ThemePreference) {
      this.themePreference = preference;
      writeThemePreference(preference);
      await this.refreshTheme();
    },
    async refreshTheme() {
      this.applyTheme();
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
      const isDark = this.isDark;
      // Lets the browser draw its own UI (scrollbars, form controls and, on
      // Android, the system bars of an installed app) in the matching scheme.
      document.documentElement.style.colorScheme = isDark ? DARK : LIGHT;
      document.documentElement.classList.toggle(DARK, isDark);
      document.body.classList.toggle(DARK, isDark);
      document.documentElement.classList.toggle(LIGHT, !isDark);
      document.body.classList.toggle(LIGHT, !isDark);
    },
  },
});
