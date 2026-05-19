import type { I18n } from "vue-i18n";
import type { HubModule } from "./types";

/**
 * Merges each module's i18n messages into the vue-i18n instance.
 * Module messages are namespaced under module.id (e.g. 'care', 'scholar').
 * Call this after createI18n() and before app.mount().
 */
export function mergeModuleMessages(i18n: I18n, modules: HubModule[]): void {
  for (const module of modules) {
    if (!module.messages) continue;
    for (const [locale, messages] of Object.entries(module.messages)) {
      // Use get/set instead of merge to be more robust across i18n versions
      const current = (i18n.global.getLocaleMessage(locale) || {}) as Record<
        string,
        unknown
      >;
      i18n.global.setLocaleMessage(locale, {
        ...current,
        [module.id]: messages,
      });
    }
  }
}
