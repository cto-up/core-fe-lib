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
import { getDefaultLocale } from "../i18n/supported-locales";
import { useLocaleSwitch } from "../composables/useLocaleSwitch";

const { t } = useI18n({ useScope: "global" });
const { locale, localeOptions, loadLocale, initialLocale, switchLocale } =
  useLocaleSwitch();

// The navbar stays mounted on every page, even where a route slides it away,
// so the startup locale is applied here.
const startLocale = initialLocale();
if (startLocale !== getDefaultLocale()) {
  void loadLocale(startLocale);
} else {
  locale.value = startLocale;
}

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => void switchLocale(value),
});
</script>

<template>
  <div class="flex items-center">
    <Select v-model="currentLocale">
      <!-- Icon-only on a phone. Spelled out, this control plus its chevron took
           ~140px of a 390px top bar to display a setting people change about
           twice a year; the language name returns at `sm`. -->
      <SelectTrigger
        class="h-11 min-w-[2.75rem] justify-center md:h-10 sm:min-w-[130px] sm:justify-between"
        variant="ghost"
        :aria-label="t('layout.header.language')"
      >
        <span class="flex items-center gap-2">
          <Languages class="h-4 w-4 shrink-0 text-muted-foreground" />
          <span class="hidden sm:inline"><SelectValue /></span>
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
