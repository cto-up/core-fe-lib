export type ThemePreference = "light" | "dark" | "system";

// "true" / "false" pin a mode; no entry means "follow the device". Keeping the
// key and its two values means a choice saved before "system" existed still holds.
const STORAGE_KEY = "dark-mode";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function readThemePreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "true") return "dark";
  if (stored === "false") return "light";
  return "system";
}

export function writeThemePreference(preference: ThemePreference) {
  if (preference === "system") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, String(preference === "dark"));
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia?.(DARK_QUERY).matches ?? false;
}

export function onSystemDarkChange(listener: (dark: boolean) => void) {
  window
    .matchMedia?.(DARK_QUERY)
    .addEventListener("change", (event) => listener(event.matches));
}

export function resolveIsDark(
  preference: ThemePreference = readThemePreference()
): boolean {
  return preference === "system" ? systemPrefersDark() : preference === "dark";
}
