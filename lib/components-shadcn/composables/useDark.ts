import { ref, onMounted, onUnmounted } from "vue";

/**
 * Composable to detect and react to dark mode changes
 * Uses Tailwind's dark mode class on document.documentElement
 */
export function useDark() {
  const isDark = ref(false);

  const updateDarkMode = () => {
    isDark.value = document.documentElement.classList.contains("dark");
  };

  const initializeDarkMode = () => {
    const darkMode = localStorage.getItem("dark-mode");

    if (darkMode === "true") {
      document.documentElement.classList.add("dark");
      isDark.value = true;
    } else {
      document.documentElement.classList.remove("dark");
      isDark.value = false;
    }
  };

  const changeMode = async () => {
    console.log("🔄 changeMode called");
    const currentIsDark = document.documentElement.classList.contains("dark");
    console.log(
      "📍 Current mode before toggle:",
      currentIsDark ? "dark" : "light"
    );

    if (currentIsDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dark-mode", "false");
      isDark.value = false;
      console.log("☀️ Switched to LIGHT mode");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dark-mode", "true");
      isDark.value = true;
      console.log("🌙 Switched to DARK mode");
    }

    // Apply tenant theme colors for the new mode
    console.log("⏳ Applying tenant theme colors...");
    await applyTenantThemeColors();
    console.log("✅ Theme change complete");
  };

  const applyTenantThemeColors = async () => {
    try {
      console.log("🎯 applyTenantThemeColors called");
      const { useTenantStore } = await import("../../stores/tenant-store");
      const { applyTheme } = await import("../themes");

      const tenantStore = useTenantStore();
      console.log("🏢 Tenant store loaded:", {
        hasTenant: !!tenantStore.tenant,
        hasProfile: !!tenantStore.tenant?.profile,
        subdomain: tenantStore.tenant?.subdomain,
      });

      const currentIsDark = document.documentElement.classList.contains("dark");
      console.log("🌓 Current mode:", currentIsDark ? "dark" : "light");

      const colors = currentIsDark
        ? tenantStore.tenant?.profile?.darkColors
        : tenantStore.tenant?.profile?.lightColors;

      console.log("🎨 Colors to apply:", colors);
      console.log("🔑 Primary color:", colors?.primary);

      applyTheme((colors || {}) as Record<string, string>);
    } catch (e) {
      console.error("❌ Could not apply tenant theme:", e);
    }
  };

  onMounted(() => {
    // Initial check
    updateDarkMode();

    // Watch for class changes on documentElement
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Cleanup
    onUnmounted(() => {
      observer.disconnect();
    });
  });

  return {
    isDark,
    initializeDarkMode,
    changeMode,
  };
}
