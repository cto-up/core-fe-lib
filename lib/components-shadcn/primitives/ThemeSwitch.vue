<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="h-11 w-11 md:h-10 md:w-10"
        :aria-label="t('layout.header.theme')"
      >
        <component :is="icons[modelValue]" class="h-5 w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup
        :model-value="modelValue"
        @update:model-value="
          emit('update:modelValue', $event as ThemePreference)
        "
      >
        <DropdownMenuRadioItem
          v-for="option in OPTIONS"
          :key="option"
          :value="option"
          class="min-h-11 md:min-h-0"
        >
          <component :is="icons[option]" class="mr-2 h-4 w-4" />
          {{ t(`layout.header.themeOptions.${option}`) }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Monitor, Moon, Sun } from "lucide-vue-next";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { ThemePreference } from "../theme-preference";

defineProps<{ modelValue: ThemePreference }>();
const emit = defineEmits<{ "update:modelValue": [value: ThemePreference] }>();

const { t } = useI18n({ useScope: "global" });

const OPTIONS: ThemePreference[] = ["light", "dark", "system"];
const icons = { light: Sun, dark: Moon, system: Monitor };
</script>
