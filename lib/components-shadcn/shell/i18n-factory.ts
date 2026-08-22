import type { HubModule } from "./types";

/**
 * The slice of a vue-i18n instance this needs.
 *
 * NOT `I18n` from vue-i18n: its generics default to `{}`, so a real instance —
 * whose message type is inferred from the app's own catalogue — is never
 * assignable to it, and every host got a type error at the call site. This
 * states the two methods actually used and works with any instance.
 */
type LocaleMessageTarget = {
  global: {
    getLocaleMessage(locale: string): unknown;
    setLocaleMessage(locale: string, messages: Record<string, unknown>): void;
  };
};

/**
 * Merges each module's i18n messages into the vue-i18n instance.
 * Module messages are namespaced under module.id (e.g. 'care', 'scholar').
 * Call this after createI18n() and before app.mount().
 */
export function mergeModuleMessages(
  i18n: LocaleMessageTarget,
  modules: HubModule[]
): void {
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
