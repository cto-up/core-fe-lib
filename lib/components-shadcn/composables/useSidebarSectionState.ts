import { ref, watch } from "vue";

/**
 * Per-section open/closed state for a sidebar, persisted in localStorage.
 * Missing entries default to open; only explicit `false` collapses a section.
 *
 *   const { isSectionOpen, setSectionOpen } = useSidebarSectionState();
 */
export function useSidebarSectionState(
  storageKey = "sidebar-sections-open"
) {
  const sectionOpen = ref<Record<string, boolean>>(load());

  function load(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function isSectionOpen(title: string): boolean {
    return sectionOpen.value[title] !== false;
  }

  function setSectionOpen(title: string, open: boolean): void {
    sectionOpen.value[title] = open;
  }

  watch(
    sectionOpen,
    (value) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // localStorage unavailable — silently skip
      }
    },
    { deep: true }
  );

  return { isSectionOpen, setSectionOpen };
}
