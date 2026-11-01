import { ref, onMounted, onUnmounted } from "vue";

/**
 * Reactive view of whether the dark theme is showing. Reads Tailwind's `dark`
 * class on the root, which the app store owns (stores/app-store.ts).
 */
export function useDark() {
  const isDark = ref(false);

  const updateDarkMode = () => {
    isDark.value = document.documentElement.classList.contains("dark");
  };

  onMounted(() => {
    updateDarkMode();

    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    onUnmounted(() => {
      observer.disconnect();
    });
  });

  return { isDark };
}
