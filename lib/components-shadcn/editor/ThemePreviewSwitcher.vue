<!--
  ThemePreviewSwitcher — the one control for "preview this in theme X, light or
  dark", used wherever an editor previews a theme. A select (fits any number of
  themes at phone width) plus a light/dark toggle.
-->
<template>
  <div class="flex items-center gap-2">
    <Select
      :model-value="theme"
      @update:model-value="(v) => emit('update:theme', String(v))"
    >
      <SelectTrigger class="h-9 w-44" :aria-label="t('editor.previewTheme')">
        <SelectValue :placeholder="t('editor.previewTheme')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="opt in themes" :key="opt.id" :value="opt.id">
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button
      variant="outline"
      size="icon"
      type="button"
      class="h-9 w-9"
      :aria-pressed="dark"
      :aria-label="dark ? t('editor.lightMode') : t('editor.darkMode')"
      :title="dark ? t('editor.lightMode') : t('editor.darkMode')"
      @click="emit('update:dark', !dark)"
    >
      <Sun v-if="dark" class="h-4 w-4" aria-hidden="true" />
      <Moon v-else class="h-4 w-4" aria-hidden="true" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Moon, Sun } from "lucide-vue-next";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

defineProps<{
  theme: string;
  dark: boolean;
  themes: { id: string; label: string }[];
}>();

const emit = defineEmits<{
  "update:theme": [id: string];
  "update:dark": [dark: boolean];
}>();
const { t } = useI18n();
</script>
