import { ref, watch, type Ref } from "vue";

const stores = new Map<string, Ref<Record<string, boolean>>>();

function load(storageKey: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// One map per storage key, shared by every caller: a recursive tree mounts one
// instance per level, and separate copies would overwrite each other's writes.
function storeFor(storageKey: string): Ref<Record<string, boolean>> {
  let state = stores.get(storageKey);
  if (state) return state;
  state = ref(load(storageKey));
  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // localStorage unavailable — silently skip
      }
    },
    { deep: true }
  );
  stores.set(storageKey, state);
  return state;
}

/**
 * Per-section open/closed state for a sidebar, persisted in localStorage.
 * A section never toggled takes `defaultOpen` (open unless told otherwise).
 *
 *   const { isSectionOpen, setSectionOpen } = useSidebarSectionState();
 */
export function useSidebarSectionState(
  storageKey = "sidebar-sections-open",
  { defaultOpen = true }: { defaultOpen?: boolean } = {}
) {
  const sectionOpen = storeFor(storageKey);

  function isSectionOpen(title: string): boolean {
    return sectionOpen.value[title] ?? defaultOpen;
  }

  function setSectionOpen(title: string, open: boolean): void {
    sectionOpen.value[title] = open;
  }

  return { isSectionOpen, setSectionOpen };
}
