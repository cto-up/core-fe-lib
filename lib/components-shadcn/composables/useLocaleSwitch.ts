import { useI18n } from "vue-i18n";
import { useToast } from "../ui/toast/use-toast";
import {
  getDefaultLocale,
  getSupportedLocales,
} from "../i18n/supported-locales";
import { serverMessageOf } from "../../utils/server-message";

const STORAGE_KEY = "user-locale";

/**
 * Switching the interface language: load the shell messages for a locale
 * before showing it, and remember the choice. Shared by the navbar's
 * LanguageSwitcher and any surface that offers the choice in its own menu
 * (the classroom's phone header, which replaces the navbar there).
 */
export function useLocaleSwitch() {
  const { t, locale, getLocaleMessage, setLocaleMessage } = useI18n({
    useScope: "global",
  });
  const { toast } = useToast();
  const localeOptions = getSupportedLocales();

  async function loadLocale(lang: string) {
    // Modules may have registered this locale already without the shell keys.
    const currentMessages = (getLocaleMessage(lang) || {}) as Record<
      string,
      unknown
    >;
    if (!currentMessages.common) {
      try {
        const messages = await import(`@/i18n/${lang}/index.ts`);
        setLocaleMessage(lang, {
          ...currentMessages,
          ...(messages.default || {}),
        });
      } catch (e) {
        // Switching anyway would leave the whole interface on raw i18n keys.
        console.error(`Failed to load i18n messages for ${lang}:`, e);
        toast({
          title: t("common.language.loadFailed"),
          description:
            serverMessageOf(e) ?? t("common.language.loadFailedDesc", { lang }),
          variant: "destructive",
        });
        return;
      }
    }
    locale.value = lang;
  }

  function isSupported(value: string | null): value is string {
    return !!value && localeOptions.some((option) => option.value === value);
  }

  // Map the browser's tag onto a locale the app ships, else the default.
  function detectBrowserLocale(): string {
    const nav = (navigator.language || "").toLowerCase();
    const match = localeOptions.find((option) =>
      nav.startsWith(option.value.slice(0, 2).toLowerCase())
    );
    return match?.value ?? getDefaultLocale();
  }

  /** The stored locale if the app still offers it, else the browser's. */
  function initialLocale(): string {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isSupported(saved) ? saved : detectBrowserLocale();
  }

  async function switchLocale(lang: string) {
    localStorage.setItem(STORAGE_KEY, lang);
    await loadLocale(lang);
  }

  return { locale, localeOptions, loadLocale, initialLocale, switchLocale };
}
