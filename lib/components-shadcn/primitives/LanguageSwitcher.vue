<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Languages } from "lucide-vue-next";

const { locale, getLocaleMessage, setLocaleMessage } = useI18n({
  useScope: "global",
});

async function loadLocale(lang: string) {
  // Check if we already have shell messages for this locale
  // Modules might have already registered this locale, but shell keys (like 'common') might be missing
  const currentMessages = (getLocaleMessage(lang) || {}) as Record<
    string,
    unknown
  >;
  const hasShellMessages = !!currentMessages.common;

  if (!hasShellMessages) {
    try {
      const messages = await import(`@/i18n/${lang}/index.ts`);
      // Merge shell messages with existing module messages
      setLocaleMessage(lang, {
        ...currentMessages,
        ...(messages.default || {}),
      });
    } catch (e) {
      console.error(`Failed to load i18n messages for ${lang}:`, e);
    }
  }
  locale.value = lang;
}

// Initialize locale from localStorage or browser preference
const savedLocale = localStorage.getItem("user-locale");
const initialLocale = savedLocale
  ? savedLocale
  : navigator.language.startsWith("fr")
    ? "fr"
    : "en-US";

if (initialLocale !== "en-US") {
  // Load non-default locale asynchronously on startup
  void loadLocale(initialLocale);
} else {
  locale.value = "en-US";
}

const localeOptions = [
  { value: "en-US", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Deutsch" },
];

const updateLocale = async (newLocale: string) => {
  localStorage.setItem("user-locale", newLocale);
  await loadLocale(newLocale);
};

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => void updateLocale(value),
});
</script>

<template>
  <div class="flex items-center">
    <Select v-model="currentLocale">
      <SelectTrigger
        class="h-11 md:h-10 w-auto min-w-[130px]"
        variant="ghost"
      >
        <span class="flex items-center gap-2">
          <Languages class="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in localeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
