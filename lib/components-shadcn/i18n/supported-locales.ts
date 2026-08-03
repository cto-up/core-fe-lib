export interface LocaleOption {
  value: string;
  label: string;
}

/**
 * Every locale core-fe-lib ships shell messages for. A consumer app that only
 * translates a subset must narrow this with `setSupportedLocales()` — offering
 * a locale whose `@/i18n/<lang>/index.ts` does not exist leaves the UI on the
 * fallback language while the switcher claims otherwise.
 */
const CATALOGUE: LocaleOption[] = [
  { value: "en-US", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
];

let supported: LocaleOption[] = CATALOGUE;

/**
 * Narrows the locales offered by `LanguageSwitcher` and matched against the
 * browser language. Call once at boot, before mount. Apps that never call it
 * keep the full catalogue, so this changes nothing for them.
 *
 * Order is the caller's: the first entry is the one a browser with no matching
 * language falls back to.
 */
export function setSupportedLocales(values: string[]): void {
  const unknown = values.filter(
    (v) => !CATALOGUE.some((locale) => locale.value === v)
  );
  if (unknown.length) {
    console.error(
      `setSupportedLocales: no shell messages for ${unknown.join(", ")} — ` +
        `known locales are ${CATALOGUE.map((l) => l.value).join(", ")}`
    );
  }

  supported = values
    .map((v) => CATALOGUE.find((locale) => locale.value === v))
    .filter((locale): locale is LocaleOption => !!locale);
}

export function getSupportedLocales(): LocaleOption[] {
  return supported;
}

/** The locale to fall back on: the first the consumer declared. */
export function getDefaultLocale(): string {
  return supported[0].value;
}
